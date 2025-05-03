import type { CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './base';

export class Light03 extends BaseAccessory {
  init() {
    this.setServices('light', this.platform.Service.Lightbulb);

    this.services.light
      .getCharacteristic(this.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    this.services.light
      .getCharacteristic(this.Characteristic.Brightness)
      .onGet(this.getBrightness.bind(this))
      .onSet(this.setBrightness.bind(this));

    this.services.light
      .getCharacteristic(this.Characteristic.ColorTemperature)
      .onGet(this.getColorTemperature.bind(this))
      .onSet(this.setColorTemperature.bind(this));
  }

  onDeviceInfoChange() {
    const lightService = this.services.light;
    if (!lightService) {
      return;
    }

    const on = this.getDevicePropsSync('set_on_off');
    lightService.getCharacteristic(this.Characteristic.On).updateValue(on === '1');

    const brightness = Number(this.getDevicePropsSync('set_brightness'));
    if (!Number.isNaN(brightness)) {
      lightService.getCharacteristic(this.Characteristic.Brightness).updateValue(brightness);
    }

    const colorTemperature = Number(this.getDevicePropsSync('set_color_tem'));
    if (!Number.isNaN(colorTemperature)) {
      lightService
        .getCharacteristic(this.Characteristic.ColorTemperature)
        .updateValue(this.colorTemperatureMapValue.btoa(colorTemperature.toString()));
    }
  }

  async getOn() {
    const on = await this.getDeviceProps('set_on_off');
    return on === '1';
  }

  async setOn(value: CharacteristicValue) {
    await this.setDeviceProps('set_on_off', value ? '1' : '0');
  }

  async getBrightness() {
    const [on, brightness] = await Promise.all([
      this.getDeviceProps('set_on_off'),
      this.getDeviceProps('set_brightness'),
    ]);
    if (on !== '1') {
      return 0;
    }
    return Number(brightness) ?? 0;
  }

  async setBrightness(value: CharacteristicValue) {
    if (value === 0) {
      await this.setOn(false);
    } else {
      await this.setOn(true);
      await this.setDeviceProps('set_brightness', value.toString());
    }
  }

  get colorTemperatureMapValue() {
    return this.mapValueFactory('set_color_tem', 1, 140, 500);
  }

  async getColorTemperature() {
    const colorTemperature = await this.getDeviceProps('set_color_tem');
    return this.colorTemperatureMapValue.btoa(colorTemperature ?? '');
  }

  async setColorTemperature(value: CharacteristicValue) {
    await this.setDeviceProps('set_color_tem', this.colorTemperatureMapValue.atob(value as number).toString());
  }
}
