import type { PlatformAccessory } from 'homebridge';
import type { ZiroomHomebridgePlatform } from '../platform';
import { ZiroomPlatformAccessory } from './base';

export class ZiroomGasAlarm01 extends ZiroomPlatformAccessory {
  constructor(
    readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: PlatformAccessory<Device>,
  ) {
    super(platform, accessory);

    this.generateService([this.platform.Service.CarbonMonoxideSensor]);

    this.services[0]
      .getCharacteristic(this.platform.Characteristic.CarbonMonoxideDetected)
      .onGet(this.getLeakDetected.bind(this));
  }

  async getLeakDetected() {
    const device = await this.getDeviceDetail();
    const [, value] =
      Object.entries(device.devStateMap).find(([key]) =>
        key.includes('gas_alarmed'),
      ) ?? [];
    if (value === '1') {
      return this.platform.Characteristic.CarbonMonoxideDetected
        .CO_LEVELS_ABNORMAL;
    }
    return this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL;
  }
}
