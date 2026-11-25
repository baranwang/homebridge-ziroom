import { BaseAccessory } from './base';

const GAS_ALARM = 'E321V04022B_gas_alarmed';
const TROUBLE = 'E321V04022B_trouble_change';

export class GasAlarm01 extends BaseAccessory {
  init() {
    // HAP's Leak Sensor characteristic explicitly covers gas leaks as well as water leaks.
    const leak = this.setServices('gas', this.platform.Service.LeakSensor);
    leak.getCharacteristic(this.Characteristic.LeakDetected).onGet(this.getAlarmState.bind(this));
    leak.getCharacteristic(this.Characteristic.StatusFault).onGet(this.getFaultState.bind(this));
    this.updateValues();
    this.startPolling(this.platform.getPollingIntervalMs('detectorPollIntervalMinutes', 2));
  }

  onDeviceInfoChange() {
    this.updateValues();
  }

  getAlarmState(): number {
    const alarm = this.readBinaryState(this.getDeviceStateSync(GAS_ALARM), GAS_ALARM);
    return alarm ? this.Characteristic.LeakDetected.LEAK_DETECTED : this.Characteristic.LeakDetected.LEAK_NOT_DETECTED;
  }

  getFaultState(): number {
    const trouble = this.readBinaryState(this.getDeviceStateSync(TROUBLE), TROUBLE);
    return trouble
      ? this.Characteristic.StatusFault.GENERAL_FAULT
      : this.Characteristic.StatusFault.NO_FAULT;
  }

  private readBinaryState(value: string | undefined, stateCode: string) {
    if (value !== '0' && value !== '1') {
      throw new Error(`无法读取燃气传感器状态: ${stateCode}`);
    }
    return value === '1';
  }

  private updateValues() {
    const leak = this.services.gas;
    const alarm = this.getDeviceStateSync(GAS_ALARM);
    if (leak && (alarm === '0' || alarm === '1')) {
      leak
        .getCharacteristic(this.Characteristic.LeakDetected)
        .updateValue(alarm === '1' ? this.Characteristic.LeakDetected.LEAK_DETECTED : this.Characteristic.LeakDetected.LEAK_NOT_DETECTED);
    }

    const trouble = this.getDeviceStateSync(TROUBLE);
    if (leak && (trouble === '0' || trouble === '1')) {
      leak
        .getCharacteristic(this.Characteristic.StatusFault)
        .updateValue(
          trouble === '1'
            ? this.Characteristic.StatusFault.GENERAL_FAULT
            : this.Characteristic.StatusFault.NO_FAULT,
        );
    }
  }
}
