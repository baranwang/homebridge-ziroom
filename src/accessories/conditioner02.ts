import type { CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './base';

enum AcOperationMode {
  HEAT = '0',
  COOL = '1',
  AUTO = '2',
  DEHUM = '3',
  WIND = '4',
}

export class Conditioner02 extends BaseAccessory {
  init() {
    this.setServices('thermostat', this.platform.Service.Thermostat);

    this.services.thermostat
      .getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
      .onGet(this.getCurrentHeatingCoolingState.bind(this));

    this.services.thermostat
      .getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
      .onGet(this.getTargetHeatingCoolingState.bind(this))
      .onSet(this.setTargetHeatingCoolingState.bind(this));

    this.services.thermostat
      .getCharacteristic(this.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    this.services.thermostat
      .getCharacteristic(this.Characteristic.TargetTemperature)
      .onGet(this.getTargetTemperature.bind(this))
      .onSet(this.setTargetTemperature.bind(this));

    if (this.getDevicePropsSync('show_inside_hum')) {
      this.services.thermostat
        .getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
        .onGet(this.getCurrentRelativeHumidity.bind(this));
    }
  }

  onDeviceInfoChange() {
    const thermostatService = this.services.thermostat;
    if (!thermostatService) {
      return;
    }
    const currentTemperature = Number(this.getDevicePropsSync('show_inside_tem'));
    if (!Number.isNaN(currentTemperature)) {
      thermostatService.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(currentTemperature);
    }
    const currentRelativeHumidity = Number(this.getDevicePropsSync('show_inside_hum'));
    if (!Number.isNaN(currentRelativeHumidity)) {
      thermostatService
        .getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
        .updateValue(currentRelativeHumidity);
    }
  }

  async getCurrentHeatingCoolingState() {
    const { CurrentHeatingCoolingState } = this.Characteristic;
    const [on, mode, tem, insideTem] = await Promise.all([
      this.getDeviceProps('set_on_off'),
      this.getDeviceProps('set_mode'),
      this.getDeviceProps('set_tem'),
      this.getDeviceProps('show_inside_tem'),
    ]);
    if (on !== '1') {
      return CurrentHeatingCoolingState.OFF;
    }
    switch (mode) {
      case AcOperationMode.COOL:
        return CurrentHeatingCoolingState.COOL;
      case AcOperationMode.HEAT:
        return CurrentHeatingCoolingState.HEAT;
      default: {
        if (Number(tem) < Number(insideTem)) {
          return CurrentHeatingCoolingState.HEAT;
        }
        return CurrentHeatingCoolingState.COOL;
      }
    }
  }

  async getTargetHeatingCoolingState() {
    const { TargetHeatingCoolingState } = this.Characteristic;
    const [on, mode] = await Promise.all([this.getDeviceProps('set_on_off'), this.getDeviceProps('set_mode')]);
    if (on !== '1') {
      return TargetHeatingCoolingState.OFF;
    }
    switch (mode) {
      case AcOperationMode.HEAT:
        return TargetHeatingCoolingState.HEAT;
      case AcOperationMode.COOL:
        return TargetHeatingCoolingState.COOL;
      case AcOperationMode.AUTO:
      default:
        return TargetHeatingCoolingState.AUTO;
    }
  }

  async setTargetHeatingCoolingState(value: CharacteristicValue) {
    const { TargetHeatingCoolingState } = this.Characteristic;
    if (value === TargetHeatingCoolingState.OFF) {
      return await this.setDeviceProps('set_on_off', '0');
    }
    const mode = {
      [TargetHeatingCoolingState.HEAT]: AcOperationMode.HEAT,
      [TargetHeatingCoolingState.COOL]: AcOperationMode.COOL,
      [TargetHeatingCoolingState.AUTO]: AcOperationMode.AUTO,
    }[value as number];
    if (mode) {
      const on = this.getDevicePropsSync('set_on_off');
      if (on !== '1') {
        await this.setDeviceProps('set_on_off', '1');
      }
      await this.setDeviceProps('set_mode', mode);
    }
  }

  async getCurrentTemperature() {
    const currentTemperature = await this.getDeviceProps('show_inside_tem');
    return Number(currentTemperature);
  }

  async getTargetTemperature() {
    const tem = await this.getDeviceProps('set_tem');
    return Number(tem);
  }

  async setTargetTemperature(value: CharacteristicValue) {
    await this.setDeviceProps('set_tem', value.toString());
  }

  async getCurrentRelativeHumidity() {
    const currentRelativeHumidity = await this.getDeviceProps('show_inside_hum');
    return Number(currentRelativeHumidity);
  }
}
