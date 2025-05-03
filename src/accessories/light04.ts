import type { CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './base';

export class Light04 extends BaseAccessory {
  init() {
    this.setServices('light', this.platform.Service.Lightbulb);

    this.services.light
      .getCharacteristic(this.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));
  }

  onDeviceInfoChange() {
    const lightService = this.services.light;
    if (!lightService) {
      return;
    }
    const on = this.getDevicePropsSync('set_on_off');
    lightService.getCharacteristic(this.Characteristic.On).updateValue(on === '1');
  }

  async getOn() {
    return (await this.getDeviceProps('set_on_off')) === '1';
  }

  async setOn(value: CharacteristicValue) {
    await this.setDeviceProps('set_on_off', value ? '1' : '0');
  }
}
