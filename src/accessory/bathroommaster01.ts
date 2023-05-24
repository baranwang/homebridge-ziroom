import type { CharacteristicValue, PlatformAccessory } from 'homebridge';
import type { ZiroomHomebridgePlatform } from '../platform';
import { ZiroomPlatformAccessory } from './base';

export class ZiroomBathroomMaster01 extends ZiroomPlatformAccessory {
  constructor(
    readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: PlatformAccessory<Device>,
  ) {
    super(platform, accessory);

    this.generateService([
      this.platform.Service.Lightbulb,
      this.platform.Service.Fanv2,
      this.platform.Service.HeaterCooler,
    ]);

    // Lightbulb
    this.services[0]
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getLightOn.bind(this))
      .onSet(this.setLightOn.bind(this));
    this.services[0]
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .setProps({
        minStep: 50,
      })
      .onGet(this.getBrightness.bind(this))
      .onSet(this.setBrightness.bind(this));

    // Fanv2
    this.services[1]
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getFanOn.bind(this))
      .onSet(this.setFanOn.bind(this));
    this.services[1]
      .getCharacteristic(this.platform.Characteristic.RotationDirection)
      .onGet(this.getFanDirection.bind(this))
      .onSet(this.setFanDirection.bind(this));

    // HeaterCooler
    this.services[2]
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(this.getHeaterActive.bind(this))
      .onSet(this.setHeaterActive.bind(this));
    this.services[2]
      .getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
      .onGet(
        () => this.platform.Characteristic.CurrentHeaterCoolerState.HEATING,
      );
    this.services[2]
      .getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
      .setProps({
        minValue: this.platform.Characteristic.TargetHeaterCoolerState.HEAT,
        maxValue: this.platform.Characteristic.TargetHeaterCoolerState.HEAT,
        validValues: [
          this.platform.Characteristic.TargetHeaterCoolerState.HEAT,
        ],
      });
    this.services[2]
      .getCharacteristic(
        this.platform.Characteristic.HeatingThresholdTemperature,
      )
      .setProps({
        minValue: 24,
        maxValue: 32,
        minStep: 8,
      })
      .onGet(this.getHeaterTemperature.bind(this))
      .onSet(this.setHeaterTemperature.bind(this));
  }

  async getLightOn() {
    const { nightLight, lighting } = await this.getLightDevice();
    if (nightLight.devState === '1' || lighting.devState === '1') {
      return true;
    }
    return false;
  }

  async setLightOn(value: CharacteristicValue) {
    const { nightLight, lighting } = await this.getLightDevice();

    if (
      !lighting.deviceOnElement ||
      !lighting.deviceOffElement ||
      !nightLight.deviceOffElement
    ) {
      this.platform.log.error('devElement not found');
      return;
    }
    if (value) {
      await this.setDevice(lighting.deviceOnElement);
    } else {
      await Promise.all([
        this.setDevice(lighting.deviceOffElement),
        this.setDevice(nightLight.deviceOffElement),
      ]);
    }
  }

  async getBrightness() {
    const { nightLight, lighting } = await this.getLightDevice();
    if (lighting.devState === '1') {
      return 100;
    }
    if (nightLight.devState === '1') {
      return 50;
    }
    return 0;
  }

  async setBrightness(value: CharacteristicValue) {
    const brightness = value as number;
    const { nightLight, lighting } = await this.getLightDevice();
    if (
      !nightLight.deviceOnElement ||
      !nightLight.deviceOffElement ||
      !lighting.deviceOnElement ||
      !lighting.deviceOffElement
    ) {
      this.platform.log.error('devElement not found');
      return;
    }
    if (brightness === 0) {
      await Promise.all([
        this.setDevice(lighting.deviceOffElement),
        this.setDevice(nightLight.deviceOffElement),
      ]);
    } else if (brightness <= 50) {
      await this.setDevice(nightLight.deviceOnElement);
    } else {
      await this.setDevice(nightLight.deviceOffElement);
    }
  }

  async getFanOn() {
    const { blow, ventilate } = await this.getFanDevice();
    if (blow.devState === '1' || ventilate.devState === '1') {
      return true;
    }
    return false;
  }

  async setFanOn(value: CharacteristicValue) {
    const { blow, ventilate } = await this.getFanDevice();
    if (
      !blow.deviceOffElement ||
      !ventilate.deviceOnElement ||
      !ventilate.deviceOffElement
    ) {
      this.platform.log.error('devElement not found');
      return;
    }
    if (value) {
      await this.setDevice(ventilate.deviceOnElement);
    } else {
      await Promise.all([
        this.setDevice(blow.deviceOffElement),
        this.setDevice(ventilate.deviceOffElement),
      ]);
    }
  }

  async getFanDirection() {
    const { blow, ventilate } = await this.getFanDevice();
    if (blow.devState === '1') {
      return this.platform.Characteristic.RotationDirection.CLOCKWISE;
    }
    if (ventilate.devState === '1') {
      return this.platform.Characteristic.RotationDirection.COUNTER_CLOCKWISE;
    }
    return this.platform.Characteristic.RotationDirection.CLOCKWISE;
  }

  async setFanDirection(value: CharacteristicValue) {
    const { blow, ventilate } = await this.getFanDevice();
    if (!blow.deviceOnElement || !ventilate.deviceOnElement) {
      this.platform.log.error('devElement not found');
      return;
    }
    if (value === this.platform.Characteristic.RotationDirection.CLOCKWISE) {
      await this.setDevice(blow.deviceOnElement);
    } else {
      await this.setDevice(ventilate.deviceOnElement);
    }
  }

  async getHeaterActive() {
    const { weakHeater, strongHeater } = await this.getHeaterDevice();
    if (weakHeater.devState === '1' || strongHeater.devState === '1') {
      return this.platform.Characteristic.Active.ACTIVE;
    }
    return this.platform.Characteristic.Active.INACTIVE;
  }

  async setHeaterActive(value: CharacteristicValue) {
    const { weakHeater, strongHeater } = await this.getHeaterDevice();
    if (
      !weakHeater.deviceOnElement ||
      !weakHeater.deviceOffElement ||
      !strongHeater.deviceOnElement ||
      !strongHeater.deviceOffElement
    ) {
      this.platform.log.error('devElement not found');
      return;
    }
    if (value === this.platform.Characteristic.Active.ACTIVE) {
      await this.setDevice(weakHeater.deviceOnElement);
    } else {
      await Promise.all([
        this.setDevice(weakHeater.deviceOffElement),
        this.setDevice(strongHeater.deviceOffElement),
      ]);
    }
  }

  async getHeaterTemperature() {
    const { weakHeater, strongHeater } = await this.getHeaterDevice();
    if (weakHeater.devState === '1') {
      return 24;
    }
    if (strongHeater.devState === '1') {
      return 32;
    }
    return 24;
  }

  async setHeaterTemperature(value: CharacteristicValue) {
    const temperature = value as number;
    const { weakHeater, strongHeater } = await this.getHeaterDevice();
    if (
      !weakHeater.deviceOnElement ||
      !weakHeater.deviceOffElement ||
      !strongHeater.deviceOnElement ||
      !strongHeater.deviceOffElement
    ) {
      this.platform.log.error('devElement not found');
      return;
    }
    if (temperature <= 24) {
      await this.setDevice(weakHeater.deviceOnElement);
    } else if (temperature >= 32) {
      await this.setDevice(strongHeater.deviceOnElement);
    } else {
      await Promise.all([
        this.setDevice(weakHeater.deviceOffElement),
        this.setDevice(strongHeater.deviceOffElement),
      ]);
    }
  }

  private async getLightDevice() {
    const [nightLight, lighting] = await Promise.all([
      this.getDeviceElementsAndState('set_nightlight_group'),
      this.getDeviceElementsAndState('set_lighting_group'),
    ]);

    return {
      nightLight,
      lighting,
    };
  }

  private async getFanDevice() {
    const [blow, ventilate] = await Promise.all([
      this.getDeviceElementsAndState('set_blow_group'),
      this.getDeviceElementsAndState('set_ventilate_group'),
    ]);
    return {
      blow,
      ventilate,
    };
  }

  private async getHeaterDevice() {
    const [weakHeater, strongHeater] = await Promise.all([
      this.getDeviceElementsAndState('set_weakwarm_group'),
      this.getDeviceElementsAndState('set_strongwarm_group'),
    ]);
    return {
      weakHeater,
      strongHeater,
    };
  }

  private async getDeviceElementsAndState(deviceName: Ziroom.Actions) {
    const { devElementList, devState } = await this.getDevice(deviceName);
    const deviceOnElement = devElementList?.find((item) => item.value === '1');
    const deviceOffElement = devElementList?.find((item) => item.value === '0');

    return {
      devElementList,
      devState,
      deviceOnElement,
      deviceOffElement,
    };
  }
}
