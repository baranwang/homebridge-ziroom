import {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';
import jwtDecode from 'jwt-decode';
import {
  ZiroomConditioner02,
  ZiroomCurtain01,
  ZiroomLight03,
  ZiroomPlatformAccessory,
  ZiroomSwitch01,
} from './accessory';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { API_URL, request } from './util';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ZiroomHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic =
    this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory<Device>[] = [];

  public request<T = any>(url: string, data: Record<string, any>) {
    return request<T>(url, data, this.config.token!).then((res) => {
      if (res.code === '200') {
        return res.data;
      } else {
        this.log.error(res.message);
        throw new Error(res.message);
      }
    });
  }

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig & ZiroomPlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    if (!this.config.token) {
      this.log.error('No token provided');
      return;
    }

    const { uid } = jwtDecode<any>(this.config.token);
    this.config.uid = uid;

    if (!this.config.hid) {
      this.request<{ hid: string }[]>(API_URL.getHomeList, { uid }).then(
        (res) => {
          this.config.hid = res?.[0]?.hid;
        },
      );
    }

    this.log.info('Platform config:', this.config);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory<Device>) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  getAccessoryClass(
    device: Ziroom.Device,
  ): typeof ZiroomPlatformAccessory | null {
    switch (device.modelCode) {
      case 'touchswitch01':
        return ZiroomSwitch01;
      case 'light03':
        return ZiroomLight03;
      case 'curtain01':
        return ZiroomCurtain01;
      case 'conditioner02':
        return ZiroomConditioner02;
      // case 'bathroommaster01':
      //   return ZiroomBathroomMaster01;
      default:
        return null;
    }
  }

  async discoverDevices() {
    this.log.info('Discovering devices...');
    const { allRoomDeviceWrapper } = await this.request<Ziroom.DeviceList>(
      API_URL.getDeviceList,
      {
        uid: this.config.uid,
        version: 21,
      },
    ).catch(() => ({ allRoomDeviceWrapper: [] } as Ziroom.DeviceList));

    for (const device of allRoomDeviceWrapper) {
      const uuid = this.api.hap.uuid.generate(device.devUuid);

      const existingAccessory = this.accessories.find(
        (accessory) => accessory.UUID === uuid,
      );

      const AccessoryClass = this.getAccessoryClass(device);

      if (!AccessoryClass) {
        continue;
      }

      if (existingAccessory) {
        this.log.info(
          'Restoring existing accessory from cache:',
          existingAccessory.displayName,
        );
        new AccessoryClass(this, existingAccessory);
      } else {
        this.log.info('Adding new accessory:', device.devName);
        const accessory = new this.api.platformAccessory<Device>(
          `${device.rname} - ${device.devName}`,
          uuid,
        );
        accessory.context.device = device;

        new AccessoryClass(this, accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }
    }
  }
}
