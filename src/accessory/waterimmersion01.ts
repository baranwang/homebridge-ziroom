import type { PlatformAccessory } from 'homebridge';
import type { ZiroomHomebridgePlatform } from '../platform';
import { ZiroomPlatformAccessory } from './base';

export class ZiroomWaterImmersion01 extends ZiroomPlatformAccessory {
  constructor(
    readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: PlatformAccessory<Device>,
  ) {
    super(platform, accessory);

    this.generateService([this.platform.Service.LeakSensor]);

    this.services[0]
      .getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(this.getStatusLowBattery.bind(this));
  }

  async getStatusLowBattery() {
    const device = await this.getDeviceDetail();
    const [, value] =
      Object.entries(device.devStateMap).find(([key]) =>
        key.includes('batterystate_state'),
      ) ?? [];
    if (Number(value ?? 100) < 20) {
      return this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
    }
    return this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
  }
}
