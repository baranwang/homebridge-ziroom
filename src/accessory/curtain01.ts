import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { ZiroomHomebridgePlatform } from '../platform';
import { ZiroomPlatformAccessory } from './base';

export class ZiroomCurtain01 extends ZiroomPlatformAccessory {
  position = 0;

  targetPosition = 0;

  constructor(readonly platform: ZiroomHomebridgePlatform, readonly accessory: PlatformAccessory<Device>) {
    super(platform, accessory);

    this.generateService([this.platform.Service.WindowCovering]);

    this.services[0].getCharacteristic(this.platform.Characteristic.CurrentPosition).onGet(this.getPosition.bind(this));
    this.services[0].getCharacteristic(this.platform.Characteristic.TargetPosition).onGet(this.getPosition.bind(this)).onSet(this.setPosition.bind(this));
    this.services[0].getCharacteristic(this.platform.Characteristic.PositionState).onGet(this.getPositionState.bind(this));
  }

  async getPosition() {
    const { devState } = await this.getDevice('curtain_opening');
    this.position = Number(devState);
    return this.position;
  }

  async setPosition(value: CharacteristicValue) {
    const position = value as number;
    const { devElementList } = this.accessory.context.device.groupInfoMap.curtain_opening;
    this.setDevice(devElementList[0], position.toString());
    this.targetPosition = position;
  }

  async getPositionState() {
    await this.getPosition();
    if (this.position === this.targetPosition) {
      return this.platform.Characteristic.PositionState.STOPPED;
    } else if (this.position > this.targetPosition) {
      return this.platform.Characteristic.PositionState.DECREASING;
    } else {
      return this.platform.Characteristic.PositionState.INCREASING;
    }
  }
}
