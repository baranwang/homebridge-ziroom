import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { ZiroomPlatformAccessory } from './base';
import { ZiroomHomebridgePlatform } from '../platform';
import { API_URL } from '../util';

export class ZiroomSwitch01 extends ZiroomPlatformAccessory {
  state = {
    On: false,
  };

  constructor(readonly platform: ZiroomHomebridgePlatform, readonly accessory: PlatformAccessory<Device>) {
    super(platform, accessory);

    this.generateService([this.platform.Service.Switch]);

    this.services[0].getCharacteristic(this.platform.Characteristic.On).onSet(this.setOn.bind(this)).onGet(this.getOn.bind(this));
  }

  setOn(value: CharacteristicValue) {
    const isOn = value as boolean;
    const { device } = this.accessory.context;
    const devElement = device.groupInfoMap.set_on_off.devElementList.find((item) => {
      if (isOn) {
        return item.elementType === 1;
      } else {
        return item.elementType === 2;
      }
    });
    if (!devElement) {
      this.platform.log.error('devElement not found');
      return;
    }
    this.platform
      .request(API_URL.setDeviceByOperCode, {
        hid: this.platform.config.hid,
        devUuid: device.devUuid.split('-')[0],
        prodOperCode: devElement.prodOperCode,
        version: 19,
      })
      .then(() => {
        this.state.On = isOn;
        this.platform.log.debug(`Set ${device.devName} ->`, devElement.operName);
      })
      .catch(() => {
        this.platform.log.error(`Set ${device.devName} failed`);
      });
  }

  async getOn(): Promise<CharacteristicValue> {
    let isOn = this.state.On;
    const { device } = this.accessory.context;
    try {
      const { devStateMap } = await this.platform.request<Ziroom.Device>(API_URL.getDeviceDetail, {
        hid: this.platform.config.hid,
        devUuid: device.devUuid.split('-')[0],
        version: 19,
      });
      const { devElementList } = device.groupInfoMap.set_on_off;
      if (!devElementList) {
        this.platform.log.error('devElementList not found');
        return isOn;
      }
      const { elementType } = devElementList.find((item) => item.value === devStateMap[devElementList[0].prodStateCode])!;
      if (elementType === 1) {
        isOn = true;
      } else if (elementType === 2) {
        isOn = false;
      }
    } catch (error) {
      this.platform.log.error(`Get ${device.devName} failed`, error);
    }
    this.state.On = isOn;
    return isOn;
  }
}
