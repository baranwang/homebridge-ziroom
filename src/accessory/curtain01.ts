import type { CharacteristicValue, PlatformAccessory } from 'homebridge';
import type { ZiroomHomebridgePlatform } from '../platform';
import { ZiroomPlatformAccessory } from './base';

export class ZiroomCurtain01 extends ZiroomPlatformAccessory {
  constructor(
    readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: PlatformAccessory<Device>,
  ) {
    super(platform, accessory);

    this.generateService([this.platform.Service.WindowCovering]);

    this.services[0]
      .getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.getPosition.bind(this));
    this.services[0]
      .getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(this.getPosition.bind(this))
      .onSet(this.setPosition.bind(this));
    this.services[0]
      .getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(() => this.platform.Characteristic.PositionState.STOPPED);
  }

  get reversePosition() {
    return this.devConfig?.reversePosition ?? false;
  }

  async getPosition() {
    const { devState } = await this.getDevice('curtain_opening');
    let position = Number(devState);
    if (this.reversePosition) {
      position = 100 - position;
    }
    return position;
  }

  async setPosition(value: CharacteristicValue) {
    let position = value as number;
    const { devElementList } =
      this.accessory.context.device.groupInfoMap.curtain_opening;
    if (this.reversePosition) {
      position = 100 - position;
    }
    this.setDevice(devElementList[0], position.toString());
  }
}
