import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { ZiroomPlatformAccessory } from './base';
import { ZiroomHomebridgePlatform } from '../platform';
import { API_URL } from '../util';

export class ZiroomConditioner02 extends ZiroomPlatformAccessory {
  constructor(
    readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: PlatformAccessory<Device>,
  ) {
    super(platform, accessory);

    const {
      CurrentHeatingCoolingState,
      CurrentTemperature,
      CurrentRelativeHumidity,
      TargetHeatingCoolingState,
      TargetTemperature,
      TemperatureDisplayUnits,
    } = this.platform.Characteristic;

    this.generateService([this.platform.Service.Thermostat]);

    this.services[0]
      .getCharacteristic(CurrentHeatingCoolingState)
      .onGet(this.getCurrentHeatingCoolingState.bind(this));

    this.services[0]
      .getCharacteristic(TargetHeatingCoolingState)
      .onSet(this.setTargetHeatingCoolingState.bind(this))
      .onGet(this.getTargetHeatingCoolingState.bind(this));

    this.services[0]
      .getCharacteristic(CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    this.services[0]
      .getCharacteristic(TargetTemperature)
      .onSet(this.setTargetTemperature.bind(this))
      .onGet(this.getTargetTemperature.bind(this));

    this.services[0]
      .getCharacteristic(TemperatureDisplayUnits)
      .onGet(this.getTemperatureDisplayUnits.bind(this));

    this.services[0]
      .getCharacteristic(CurrentRelativeHumidity)
      .onGet(this.getCurrentRelativeHumidity.bind(this));
  }

  async getCurrentHeatingCoolingState(): Promise<CharacteristicValue> {
    const { CurrentHeatingCoolingState } = this.platform.api.hap.Characteristic;
    const { devStateMap } = await this.getDeviceDetail();

    if (devStateMap.conditioner_powerstate === '0') {
      return CurrentHeatingCoolingState.OFF;
    }
    switch (devStateMap.conditioner_model) {
      case '0':
        return CurrentHeatingCoolingState.HEAT;
      case '1':
        return CurrentHeatingCoolingState.COOL;
      default:
        if (
          +devStateMap.conditioner_indoortemp < +devStateMap.conditioner_temper
        ) {
          return CurrentHeatingCoolingState.HEAT;
        } else {
          return CurrentHeatingCoolingState.COOL;
        }
    }
  }

  async setTargetHeatingCoolingState(state: CharacteristicValue) {
    const { device } = this.accessory.context;
    const { TargetHeatingCoolingState } = this.platform.api.hap.Characteristic;
    let mode: number | null = null;
    switch (state) {
      case TargetHeatingCoolingState.AUTO:
        mode = 2;
        break;
      case TargetHeatingCoolingState.COOL:
        mode = 1;
        break;
      case TargetHeatingCoolingState.HEAT:
        mode = 0;
        break;
      default:
        break;
    }

    if (
      mode === null ||
      (mode !== null && device.devStateMap.conditioner_powerstate === '0')
    ) {
      await this.setDeviceByOperCode(
        device.groupInfoMap.set_on_off.devElementList.find(
          (item) =>
            item.elementCode ===
            (mode === null ? 'conditioner_off_detail' : 'conditioner_on_detail'),
        )!,
      );
    }

    if (mode !== null) {
      const devElement = device.groupInfoMap.set_mode.devElementList.find(
        (item) => item.value === `${mode}`,
      );
      if (!devElement) {
        return;
      }
      await this.setDeviceByOperCode(devElement);
    }
  }

  async getTargetHeatingCoolingState(): Promise<CharacteristicValue> {
    const { devStateMap } = await this.getDeviceDetail();
    const { TargetHeatingCoolingState } = this.platform.api.hap.Characteristic;

    if (devStateMap.conditioner_powerstate === '0') {
      return TargetHeatingCoolingState.OFF;
    }

    switch (devStateMap.conditioner_model) {
      case '0':
        return TargetHeatingCoolingState.HEAT;
      case '1':
        return TargetHeatingCoolingState.COOL;
      case '2':
        return TargetHeatingCoolingState.AUTO;
      default:
        throw new this.platform.api.hap.HapStatusError(
          this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
        );
    }
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    const { devStateMap } = await this.getDeviceDetail();
    return devStateMap.conditioner_indoortemp;
  }

  async getTargetTemperature(): Promise<CharacteristicValue> {
    const { devStateMap } = await this.getDeviceDetail();
    return devStateMap.conditioner_temper;
  }

  getTemperatureDisplayUnits(): CharacteristicValue {
    return this.platform.api.hap.Characteristic.TemperatureDisplayUnits.CELSIUS;
  }

  async setTargetTemperature(temperature: CharacteristicValue) {
    await this.setDeviceByOperCode(
      this.accessory.context.device.groupInfoMap.set_tem.devElementList[0],
      `${temperature}`,
    );
  }

  async getCurrentRelativeHumidity(): Promise<CharacteristicValue> {
    const { devStateMap } = await this.getDeviceDetail();
    return devStateMap.conditioner_humidi || false;
  }

  private async setDeviceByOperCode(
    devElement: Ziroom.Device['groupInfoMap'][string]['devElementList'][number],
    param?: string,
  ) {
    const { device } = this.accessory.context;
    try {
      await this.platform.request(API_URL.setDeviceByOperCode, {
        hid: this.platform.config.hid,
        devUuid: device.devUuid,
        prodOperCode: devElement.prodOperCode,
        param,
      });
      this.platform.log.debug(`Set ${device.devName} ->`, devElement.operName);
    } catch {
      this.platform.log.error(`Set ${device.devName} mode failed`);
    }
    this.services[0].updateCharacteristic(
      this.platform.api.hap.Characteristic.CurrentHeatingCoolingState,
      await this.getCurrentHeatingCoolingState(),
    );
  }

  private async getDeviceDetail() {
    try {
      const { hid } = this.platform.config;
      const { devUuid } = this.accessory.context.device;
      const device = await this.platform.request<Ziroom.Device>(
        API_URL.getDeviceDetail,
        {
          hid,
          devUuid,
          version: 19,
        },
      );
      this.accessory.context.device = device;
      return device;
    } catch (e) {
      const error = e as Error;
      this.platform.log.error(error.message);
      return this.accessory.context.device;
    }
  }
}
