import { PlatformAccessory } from 'homebridge';
import { ZiroomHomebridgePlatform } from '../platform';
import { ZiroomPlatformAccessory } from './base';

export class ZiroomBathroomMaster01 extends ZiroomPlatformAccessory {
  constructor(readonly platform: ZiroomHomebridgePlatform, readonly accessory: PlatformAccessory<Device>) {
    super(platform, accessory);

    this.generateService([this.platform.Service.Switch, this.platform.Service.Lightbulb ]);

    this.services[0].setCharacteristic(this.platform.Characteristic.Name, '强暖');
    this.services[0].getCharacteristic(this.platform.Characteristic.On).onGet(this.getLightOn.bind(this));
    // .onSet(this.setOn.bind(this));
  }

  async getLightOn() {
    const { devElementList } = await this.getDevice('set_on_off');
    console.log(devElementList);
    return true;
  }
}
