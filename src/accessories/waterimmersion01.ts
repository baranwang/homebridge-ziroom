import { BaseAccessory } from './base';

const LOW_BATTERY = 'wsdl_low_battery_change';
const BATTERY_LEVEL = 'E321V04022A_batterystate_state';

export class WaterImmersion01 extends BaseAccessory {
  init() {
    const leak = this.setServices('leak', this.platform.Service.LeakSensor);
    leak.getCharacteristic(this.Characteristic.LeakDetected).onGet(this.getLeakDetected.bind(this));

    const battery = this.setServices('battery', this.platform.Service.Battery, '电池');
    battery.getCharacteristic(this.Characteristic.BatteryLevel).onGet(this.getBatteryLevel.bind(this));
    battery.getCharacteristic(this.Characteristic.StatusLowBattery).onGet(this.getLowBatteryStatus.bind(this));
    this.updateValues();
    this.startPolling(
      this.platform.getPollingIntervalMs('detectorPollIntervalMinutes', 0.5, 0),
      () => this.loadDeviceInfoFromList(),
    );
  }

  onDeviceInfoChange() {
    this.updateValues();
  }

  getLeakDetected(): number {
    const alarm = this.getLeakAlarmState();
    if (alarm === undefined) {
      throw new Error('无法读取传感器状态: device_description');
    }
    return alarm ? this.Characteristic.LeakDetected.LEAK_DETECTED : this.Characteristic.LeakDetected.LEAK_NOT_DETECTED;
  }

  getBatteryLevel(): number {
    const value = Number(this.getDeviceStateSync(BATTERY_LEVEL));
    if (!Number.isFinite(value)) {
      throw new Error('无法读取水浸传感器电量');
    }
    return Math.max(0, Math.min(100, value));
  }

  getLowBatteryStatus(): number {
    const lowBattery = this.readBinaryState(this.getDeviceStateSync(LOW_BATTERY), LOW_BATTERY);
    return lowBattery
      ? this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
  }

  private readBinaryState(value: string | undefined, stateCode: string) {
    if (value !== '0' && value !== '1') {
      throw new Error(`无法读取传感器状态: ${stateCode}`);
    }
    return value === '1';
  }

  private getLeakAlarmState(): boolean | undefined {
    const description = this.getDeviceStateSync('device_description');
    if (description === '报警') {
      return true;
    }
    if (description === '干燥' || description === '正常' || description === '未报警' || description === '无报警') {
      return false;
    }
    if (description === undefined) {
      // `E321V04022A_alarmed_change` is not a reliable current-state flag:
      // observed as 0 with description 报警, and 1 after clearing the alarm
      // when the description was omitted from the device-list response.
      return false;
    }
    return undefined;
  }

  private updateValues() {
    const leak = this.services.leak;
    const alarm = this.getLeakAlarmState();
    if (leak && alarm !== undefined) {
      leak
        .getCharacteristic(this.Characteristic.LeakDetected)
        .updateValue(alarm ? this.Characteristic.LeakDetected.LEAK_DETECTED : this.Characteristic.LeakDetected.LEAK_NOT_DETECTED);
    }

    const battery = this.services.battery;
    const level = Number(this.getDeviceStateSync(BATTERY_LEVEL));
    if (battery && Number.isFinite(level)) {
      battery.getCharacteristic(this.Characteristic.BatteryLevel).updateValue(Math.max(0, Math.min(100, level)));
    }
    const lowBattery = this.getDeviceStateSync(LOW_BATTERY);
    if (battery && (lowBattery === '0' || lowBattery === '1')) {
      battery
        .getCharacteristic(this.Characteristic.StatusLowBattery)
        .updateValue(
          lowBattery === '1'
            ? this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
            : this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
        );
    }
  }
}
