import type { PlatformAccessory, Service } from 'homebridge';
import type { ZiroomHomebridgePlatform } from '../platform';
import { API_URL } from '../util';

export class ZiroomPlatformAccessory {
  services: Service[] = [];
  private deviceDetailPromise?: Promise<Ziroom.Device>;

  constructor(
    readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: PlatformAccessory<Device>,
  ) {
    platform
      .request<{ name: '品牌' | '型号' | 'mac'; message: string }[]>(
        API_URL.getDevBaseInfo,
        {
          devUuid: accessory.context.device.devUuid,
          uid: platform.config.uid,
        },
      )
      .then((res) => {
        const info = Object.fromEntries(
          res.map((item) => [item.name, item.message]),
        );
        this.services.forEach((service) => {
          service.setCharacteristic(
            this.platform.Characteristic.Name,
            accessory.context.device.devName,
          );
        });

        this.accessory
          .getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(
            this.platform.Characteristic.Manufacturer,
            info['品牌'],
          )
          .setCharacteristic(this.platform.Characteristic.Model, info['型号'])
          .setCharacteristic(
            this.platform.Characteristic.SerialNumber,
            info['mac'],
          );
      });
  }

  generateService<T extends typeof Service>(service: T[]) {
    this.services = service.map(
      (item) =>
        this.accessory.getService(item as any) ||
        this.accessory.addService(item as any),
    );
  }

  async getDeviceDetail() {
    const { device } = this.accessory.context;
    try {
      if (!this.deviceDetailPromise) {
        this.deviceDetailPromise = this.platform.request<Ziroom.Device>(
          API_URL.getDeviceDetail,
          {
            hid: this.platform.config.hid,
            uid: this.platform.config.uid,
            devUuid: device.devUuid,
            version: 19,
          },
        );
      }
      const deviceDetail = await this.deviceDetailPromise;
      this.platform.log.debug(
        `Get ${device.devName} ->`,
        JSON.stringify(deviceDetail),
      );
      return deviceDetail;
    } catch (error) {
      this.platform.log.error(`Get ${device.devName} failed`, error);
      return device;
    }
  }

  async getDevice(type: Ziroom.Actions) {
    const deviceDetail = await this.getDeviceDetail();
    try {
      const { devStateMap, groupInfoMap } = deviceDetail;
      this.accessory.context.device.groupInfoMap = groupInfoMap;

      const { devElementList } = groupInfoMap?.[type] ?? {};

      if (!devElementList) {
        this.platform.log.error('devElementList not found');
        return {};
      }
      const devState = devStateMap[devElementList[0].prodStateCode];

      return { devState, devElementList };
    } catch (error) {
      this.platform.log.error(`Get ${deviceDetail.devName} failed`, error);
      return {};
    }
  }

  async setDevice(
    devElement: Ziroom.Device['groupInfoMap'][string]['devElementList'][number],
    param?: string,
  ) {
    const { device } = this.accessory.context;
    try {
      const result = await this.platform.request(API_URL.setDeviceByOperCode, {
        hid: this.platform.config.hid,
        uid: this.platform.config.uid,
        devUuid: device.devUuid,
        prodOperCode: devElement.prodOperCode,
        param,
      });
      this.platform.log.debug(
        `Set ${device.devName} ->`,
        devElement.operName,
        JSON.stringify(result),
      );
      return result;
    } catch (error) {
      this.platform.log.error(`Set ${device.devName} failed`, error);
      throw error;
    }
  }

  get devConfig() {
    return this.platform.config.devConfig?.[
      this.accessory.context.device.devUuid
    ];
  }
}
