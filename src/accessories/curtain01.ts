import type { CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './base';

export class Curtain01 extends BaseAccessory {
  init() {
    this.setServices('curtain', this.platform.Service.WindowCovering);

    this.services.curtain
      .getCharacteristic(this.Characteristic.CurrentPosition)
      .onGet(this.getCurrentPosition.bind(this));

    this.services.curtain
      .getCharacteristic(this.Characteristic.TargetPosition)
      .onGet(this.getCurrentPosition.bind(this))
      .onSet(this.setTargetPosition.bind(this));

    this.services.curtain
      .getCharacteristic(this.Characteristic.PositionState)
      .onGet(() => this.Characteristic.PositionState.STOPPED);

    this.updatePosition();
  }

  onDeviceInfoChange() {
    this.updatePosition();
  }

  async getCurrentPosition() {
    const position = Number(await this.getDeviceProps('curtain_opening'));
    return Number.isFinite(position) ? Math.max(0, Math.min(100, position)) : 0;
  }

  async setTargetPosition(value: CharacteristicValue) {
    await this.setDeviceProps('curtain_opening', Math.round(value as number).toString());
  }

  private updatePosition() {
    const service = this.services.curtain;
    if (!service) {
      return;
    }
    const position = Number(this.getDevicePropsSync('curtain_opening'));
    if (Number.isFinite(position)) {
      const clamped = Math.max(0, Math.min(100, position));
      service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(clamped);
      service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(clamped);
      service
        .getCharacteristic(this.Characteristic.PositionState)
        .updateValue(this.Characteristic.PositionState.STOPPED);
    }
  }
}
