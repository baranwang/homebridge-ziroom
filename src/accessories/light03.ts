import type { CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './base';

export class Light03 extends BaseAccessory {
  // 色温转换常量
  private static readonly MIN_MIRED = 140;
  private static readonly MAX_MIRED = 500;
  private static readonly KELVIN_MULTIPLIER = 1000000;

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

    // 更新开关状态
    const on = this.getDevicePropsSync('set_on_off');
    lightService.getCharacteristic(this.Characteristic.On).updateValue(on === '1');

    // 更新亮度
    const brightness = Number(this.getDevicePropsSync('set_brightness'));
    if (!Number.isNaN(brightness)) {
      lightService.getCharacteristic(this.Characteristic.Brightness).updateValue(brightness);
    }

    // 更新色温
    const kelvinValue = Number(this.getDevicePropsSync('set_color_tem'));
    if (!Number.isNaN(kelvinValue)) {
      const miredValue = this.convertKelvinToMired(kelvinValue);
      lightService.getCharacteristic(this.Characteristic.ColorTemperature).updateValue(miredValue);
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
    return Number(brightness) || 0;
  }

  async setBrightness(value: CharacteristicValue) {
    if (value === 0) {
      await this.setOn(false);
    } else {
      await this.setOn(true);
      await this.setDeviceProps('set_brightness', value.toString());
    }
  }

  async getColorTemperature() {
    const kelvin = await this.getDeviceProps('set_color_tem');
    const kelvinValue = Number(kelvin);
    if (Number.isNaN(kelvinValue)) {
      return Light03.MIN_MIRED;
    }
    return this.convertKelvinToMired(kelvinValue);
  }

  async setColorTemperature(value: CharacteristicValue) {
    const kelvin = Math.round(Light03.KELVIN_MULTIPLIER / (value as number));
    await this.setDeviceProps('set_color_tem', kelvin.toString());
  }

  private convertKelvinToMired(kelvin: number) {
    const mired = Math.round(Light03.KELVIN_MULTIPLIER / kelvin);
    return Math.max(Light03.MIN_MIRED, Math.min(mired, Light03.MAX_MIRED));
  }
}
