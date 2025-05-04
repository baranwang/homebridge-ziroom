import type { API, Characteristic, DynamicPlatformPlugin, Logger, PlatformConfig, Service } from 'homebridge';
import { Conditioner02, Light03, Light04 } from './accessories';
import { ZiroomRequest, type ZiroomRequestOptions } from './request';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import type { ZiroomDeviceInfo, ZiroomPlatformAccessory, ZiroomPlatformAccessoryContext } from './types';

export class ZiroomHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;

  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: ZiroomPlatformAccessory[] = [];

  public readonly request: ZiroomRequest;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.request = new ZiroomRequest(this.log, this.config as ZiroomRequestOptions);
    this.api.on('didFinishLaunching', () => {
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: ZiroomPlatformAccessory) {
    this.log.info('从缓存中获取设备', accessory.displayName);
    this.accessories.push(accessory);
  }

  async discoverDevices() {
    const devices = await this.request.getDeviceList();
    for (const device of devices) {
      this.handleAccessory(device);
    }
  }

  private handleAccessory(device: ZiroomDeviceInfo) {
    const AccessoryClass = this.getAccessoryClass(device);
    if (!AccessoryClass) {
      this.log.warn(`不支持的设备类型: ${device.modelCode}`);
      return;
    }
    const uuid = this.api.hap.uuid.generate(device.devUuid);
    const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.info('从缓存中获取设备', existingAccessory.displayName);
      existingAccessory.context = {
        deviceInfo: device,
      };
      this.api.updatePlatformAccessories([existingAccessory]);
      new AccessoryClass(this, existingAccessory);
    } else {
      const displayName = this.getDeviceName(device);
      this.log.info('添加新设备', displayName);
      const accessory = new this.api.platformAccessory<ZiroomPlatformAccessoryContext>(displayName, uuid);
      accessory.context = {
        deviceInfo: device,
      };
      new AccessoryClass(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    return device.devUuid;
  }

  private getAccessoryClass(device: ZiroomDeviceInfo) {
    switch (device.modelCode) {
      case 'light03':
        return Light03;
      case 'light04':
        return Light04;
      case 'conditioner02':
        return Conditioner02;
      default:
        return null;
    }
  }

  private getDeviceName(device: ZiroomDeviceInfo) {
    return `${device.rname} - ${device.devName}`;
  }
}
