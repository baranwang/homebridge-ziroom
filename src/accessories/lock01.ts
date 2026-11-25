import { BaseAccessory } from './base';

/** Exposes the confirmed lock battery reading. Lock status values and remote
 * lock commands are not mapped because the Ziroom profile does not define a
 * control operation for this lock model. */
export class Lock01 extends BaseAccessory {
  init() {
    const battery = this.setServices('battery', this.platform.Service.Battery);
    battery
      .getCharacteristic(this.Characteristic.BatteryLevel)
      .onGet(this.getBatteryLevel.bind(this));
    battery
      .getCharacteristic(this.Characteristic.StatusLowBattery)
      .onGet(this.getLowBatteryStatus.bind(this));
    this.updateBattery();
    this.startPolling(this.platform.getPollingIntervalMs('lockPollIntervalMinutes', 60));
  }

  onDeviceInfoChange() {
    this.updateBattery();
  }

  getBatteryLevel(): number {
    const value = Number(this.getDevicePropsSync('battery_energy'));
    if (!Number.isFinite(value)) {
      throw new Error('无法读取门锁电量');
    }
    return Math.max(0, Math.min(100, value));
  }

  getLowBatteryStatus(): number {
    const value = this.getBatteryLevel();
    return value <= 20
      ? this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
  }

  private updateBattery() {
    const battery = this.services.battery;
    if (!battery) {
      return;
    }
    const value = Number(this.getDevicePropsSync('battery_energy'));
    if (Number.isFinite(value)) {
      const level = Math.max(0, Math.min(100, value));
      battery.getCharacteristic(this.Characteristic.BatteryLevel).updateValue(level);
      battery
        .getCharacteristic(this.Characteristic.StatusLowBattery)
        .updateValue(
          level <= 20
            ? this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
            : this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
        );
    }
  }
}
