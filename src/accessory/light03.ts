import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { ZiroomHomebridgePlatform } from '../platform';
import { ZiroomPlatformAccessory } from './base';
import { transformRange } from '../util';

export class ZiroomLight03 extends ZiroomPlatformAccessory {
  constructor(readonly platform: ZiroomHomebridgePlatform, readonly accessory: PlatformAccessory<Device>) {
    super(platform, accessory);

    this.generateService([this.platform.Service.Lightbulb]);

    this.services[0].getCharacteristic(this.platform.Characteristic.On).onGet(this.getOn.bind(this)).onSet(this.setOn.bind(this));

    this.services[0].getCharacteristic(this.platform.Characteristic.Brightness).onGet(this.getBrightness.bind(this)).onSet(this.setBrightness.bind(this));

    this.services[0].getCharacteristic(this.platform.Characteristic.ColorTemperature).onGet(this.getColorTemperature.bind(this)).onSet(this.setColorTemperature.bind(this));
    this.platform.Characteristic.ColorTemperature.MaximumTransmitPower;
  }

  private async getDeviceProperty(property: Ziroom.Actions, transform?: [number, number]) {
    try {
      const { devState, devElementList } = await this.getDevice(property);
      if (transform && devElementList) {
        return transformRange(devElementList[0], transform).ziroom2hb(Number(devState));
      }
      return devState ? Number(devState) : 0;
    } catch (error) {
      return 0;
    }
  }

  private async setDeviceProperty(
    property: Ziroom.Actions,
    value: CharacteristicValue,
    getDevElement: (devElementList: Ziroom.DevElement[]) => Ziroom.DevElement | undefined,
    transform?: [number, number],
  ) {
    const { device } = this.accessory.context;
    const devElement = getDevElement(device.groupInfoMap[property].devElementList);

    if (!devElement) {
      this.platform.log.error('devElement not found');
      return;
    }

    try {
      let newValue = value;
      if (transform) {
        newValue = transformRange(devElement, transform).hb2ziroom(Number(value));
      }
      await this.setDevice(devElement, newValue.toString());
    } catch (error) {
      this.platform.log.error(`Error setting ${property}: ${error}`);
    }
  }

  getOn() {
    return this.getDeviceProperty('set_on_off');
  }

  setOn(value: CharacteristicValue) {
    const isOn = value as boolean;
    this.setDeviceProperty('set_on_off', isOn, (devElementList) => {
      return devElementList.find((item) => {
        if (isOn) {
          return item.value === '1';
        } else {
          return item.value === '0';
        }
      });
    });
  }

  getBrightness() {
    return this.getDeviceProperty('set_brightness');
  }

  setBrightness(value: CharacteristicValue) {
    const brightness = value as number;
    this.setDeviceProperty('set_brightness', brightness, (devElementList) => devElementList[0]);
  }

  getColorTemperature(): Promise<CharacteristicValue> {
    return this.getDeviceProperty('set_color_tem', [140, 500]);
  }

  setColorTemperature(value: CharacteristicValue) {
    const colorTemperature = value as number;
    this.setDeviceProperty('set_brightness', colorTemperature, (devElementList) => devElementList[0], [140, 500]);
  }
}
