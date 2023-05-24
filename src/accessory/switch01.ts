import type { CharacteristicValue, PlatformAccessory } from 'homebridge';
import type { ZiroomHomebridgePlatform } from '../platform';
import { ZiroomPlatformAccessory } from './base';

export class ZiroomSwitch01 extends ZiroomPlatformAccessory {
  constructor(
    readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: PlatformAccessory<Device>,
  ) {
    super(platform, accessory);

    this.generateService([this.platform.Service.Switch]);

    this.services[0]
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
  }

  setOn(value: CharacteristicValue) {
    const isOn = value as boolean;
    const { device } = this.accessory.context;
    const devElement = device.groupInfoMap.set_on_off.devElementList.find(
      (item) => {
        if (isOn) {
          return item.value === '1';
        } else {
          return item.value === '0';
        }
      },
    );
    if (!devElement) {
      this.platform.log.error('devElement not found');
      return;
    }
    this.setDevice(devElement);
  }

  async getOn(): Promise<CharacteristicValue> {
    const { devState } = await this.getDevice('set_on_off');
    return devState === '1';
  }
}
