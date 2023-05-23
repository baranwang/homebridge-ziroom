import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { ZiroomHomebridgePlatform } from '../platform';
import { ZiroomPlatformAccessory } from './base';
import { transformRange } from '../util';

interface IOptions {
  transform?: [number, number];
  reverseKey?: string;
}

export class ZiroomLight03 extends ZiroomPlatformAccessory {
  constructor(
    readonly platform: ZiroomHomebridgePlatform,
    readonly accessory: PlatformAccessory<Device>,
  ) {
    super(platform, accessory);

    this.generateService([this.platform.Service.Lightbulb]);

    this.services[0]
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    this.services[0]
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onGet(this.getBrightness.bind(this))
      .onSet(this.setBrightness.bind(this));

    this.services[0]
      .getCharacteristic(this.platform.Characteristic.ColorTemperature)
      .onGet(this.getColorTemperature.bind(this))
      .onSet(this.setColorTemperature.bind(this));
    this.platform.Characteristic.ColorTemperature.MaximumTransmitPower;
  }

  get devConfig() {
    return this.platform.config.devConfig?.[
      this.accessory.context.device.devUuid
    ];
  }

  private async getDeviceProperty(
    property: Ziroom.Actions,
    options?: IOptions,
  ) {
    try {
      const { devState, devElementList } = await this.getDevice(property);
      const { transform, reverse } = this.processTransformOptions(
        property,
        options,
      );
      if (transform && devElementList) {
        return transformRange(devElementList[0], transform).ziroom2hb(
          Number(devState),
          reverse,
        );
      }
      return devState ? Number(devState) : 0;
    } catch (error) {
      return 0;
    }
  }

  private async setDeviceProperty(
    property: Ziroom.Actions,
    value: CharacteristicValue,
    getDevElement: (
      devElementList: Ziroom.DevElement[]
    ) => Ziroom.DevElement | undefined,
    options?: IOptions,
  ) {
    const { device } = this.accessory.context;
    const devElement = getDevElement(
      device.groupInfoMap[property].devElementList,
    );

    if (!devElement) {
      this.platform.log.error('devElement not found');
      return;
    }

    try {
      let newValue = value;
      const { transform, reverse } = this.processTransformOptions(
        property,
        options,
      );
      if (transform) {
        newValue = transformRange(devElement, transform).hb2ziroom(
          Number(value),
          reverse,
        );
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
    this.setDeviceProperty(
      'set_brightness',
      brightness,
      (devElementList) => devElementList[0],
    );
  }

  getColorTemperature(): Promise<CharacteristicValue> {
    return this.getDeviceProperty('set_color_tem', {
      transform: [140, 500],
      reverseKey: 'reverseColorTem',
    });
  }

  setColorTemperature(value: CharacteristicValue) {
    const colorTemperature = value as number;
    this.setDeviceProperty(
      'set_color_tem',
      colorTemperature,
      (devElementList) => devElementList[0],
      { transform: [140, 500], reverseKey: 'reverseColorTem' },
    );
  }

  private processTransformOptions(
    property: Ziroom.Actions,
    { transform, reverseKey }: IOptions = {},
  ) {
    let reverse = false;
    if (reverseKey) {
      reverse = this.devConfig?.[reverseKey] ?? false;
    }
    if (property === 'set_color_tem') {
      reverse = !reverse;
    }
    return { transform, reverse };
  }
}
