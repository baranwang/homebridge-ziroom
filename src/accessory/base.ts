import { PlatformAccessory, Service } from "homebridge";
import { ZiroomHomebridgePlatform } from "../platform";
import { API_URL } from "../util";

export class ZiroomPlatformAccessory {
  service!: Service;

  constructor(
    readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: PlatformAccessory<Device>,
  ) {
    platform.request<{ name: '品牌' | '型号' | 'mac'; message: string }[]>(API_URL.getDevBaseInfo, {
      devUuid: accessory.context.device.devUuid.split('-')[0],
      uid: platform.config.uid,
    }).then((res) => {
      const info = Object.fromEntries(res.map(item => [item.name, item.message]));
      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, info['品牌'])
        .setCharacteristic(this.platform.Characteristic.Model, info['型号'])
        .setCharacteristic(this.platform.Characteristic.SerialNumber, info['mac']);
    });

  }
}