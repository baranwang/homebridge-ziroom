import type { Service } from 'homebridge';
import type { ZiroomHomebridgePlatform } from '../platform';
import type { ZiroomDevElementInfo, ZiroomDeviceInfo, ZiroomPlatformAccessory } from '../types';

export abstract class BaseAccessory {
  public services: Record<string, Service> = {};

  private getDeviceDetailPromise: Promise<ZiroomDeviceInfo> | null = null;

  constructor(
    public readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: ZiroomPlatformAccessory,
  ) {
    this.initializeAccessory();
  }

  abstract init(): void;

  abstract onDeviceInfoChange(deviceInfo: ZiroomDeviceInfo): void;

  private async initializeAccessory() {
    try {
      const deviceInfo = await this.loadDeviceInfo();
      const infoService = this.accessory.getService(this.platform.Service.AccessoryInformation);

      const accessoryInformationMap = {
        Manufacturer: deviceInfo.brandName,
        Model: deviceInfo.modelName,
        Name: deviceInfo.prodTypeName,
        SerialNumber: deviceInfo.prodTypeId,
      } as const;
      Object.entries(accessoryInformationMap).forEach(([key, value]) => {
        if (value) {
          infoService
            ?.getCharacteristic(this.platform.Characteristic[key as keyof typeof accessoryInformationMap])
            .onGet(() => value);
        }
      });
    } catch (error) {
      this.platform.log.error(`设备初始化失败: ${this.accessory.displayName}`, error);
    }
    this.init();
  }

  private async getDeviceDetail() {
    if (!this.getDeviceDetailPromise) {
      this.getDeviceDetailPromise = this.platform.request.getDeviceDetail(this.deviceInfo.devUuid).finally(() => {
        this.getDeviceDetailPromise = null;
      });
    }
    return this.getDeviceDetailPromise;
  }

  private async loadDeviceInfo() {
    const deviceInfo = await this.getDeviceDetail();
    if (!deviceInfo) {
      throw new Error(`无法获取设备详情: ${this.deviceInfo.devUuid}`);
    }
    const newDeviceInfo = { ...this.deviceInfo, ...deviceInfo };
    this.accessory.context.deviceInfo = newDeviceInfo;
    this.onDeviceInfoChange(newDeviceInfo);
    return newDeviceInfo;
  }

  protected setServices<T extends typeof Service>(key: string, service: T, name?: string): InstanceType<T> {
    // 检查服务是否已存在
    const existingService = this.accessory.getService(key);
    if (existingService) {
      this.services[key] = existingService;
      return existingService as InstanceType<T>;
    }

    // 创建新服务
    const serviceName = name ? `${this.accessory.displayName} - ${name}` : this.accessory.displayName;

    const newService = this.accessory.addService(service as typeof Service, serviceName, key);
    newService.setCharacteristic(this.Characteristic.Name, serviceName);
    this.services[key] = newService;

    return newService as InstanceType<T>;
  }

  protected get Characteristic() {
    return this.platform.Characteristic;
  }

  protected get deviceInfo() {
    return this.accessory.context.deviceInfo;
  }

  protected getDevicePropsSync(prop: string) {
    const element = this.deviceInfo.groupInfoMap[prop]?.devElementList?.[0];
    return element ? this.deviceInfo.devStateMap[element.prodStateCode] : undefined;
  }

  protected async getDeviceProps(prop: string) {
    await this.loadDeviceInfo();
    return this.getDevicePropsSync(prop);
  }

  protected async setDeviceProps(prop: string, value: string) {
    const { groupInfoMap } = this.deviceInfo;
    const groupInfo = groupInfoMap[prop];

    if (!groupInfo) {
      this.platform.log.error(`无法找到属性组: ${prop}`);
      return;
    }

    switch (groupInfo.groupType) {
      case 1: {
        const element = groupInfo.devElementList.find((e) => e.value === value.toString());
        if (!element) {
          throw new Error(`无法找到元素: ${prop}`);
        }
        await this.setDeviceState(element, value.toString());
        break;
      }
      case 2: {
        const element = groupInfo.devElementList[0];
        const { maxValue = Number.MAX_SAFE_INTEGER, minValue = Number.MIN_SAFE_INTEGER } = element;
        if (Number(value) < minValue || Number(value) > maxValue) {
          throw new Error(`值超出范围: ${prop}`);
        }
        await this.setDeviceState(element, value.toString());
        break;
      }
      default: {
        throw new Error(`不支持的组类型: ${prop}`);
      }
    }
  }

  protected async setDeviceState(element: ZiroomDevElementInfo, value: string) {
    this.platform.log.debug('设置', this.accessory.displayName, element.elementName, value);
    try {
      await this.platform.request.setDeviceState(this.deviceInfo.devUuid, element.prodOperCode, value);
      this.platform.log.info('设置成功', this.accessory.displayName, element.elementName, value);
      await this.loadDeviceInfo();
    } catch (error) {
      this.platform.log.error('设置失败', this.accessory.displayName, element.elementName, value, error);
    }
  }
}
