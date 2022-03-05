declare namespace Ziroom {
  interface APIResponse<T = any> {
    code: string;
    data: T;
    message: string;
  }

  interface Device {
    rname: string;
    rid: string;
    isOnline: 0 | 1;
    devTypeId: 'switch' | 'conditioner';
    modelCode: 'touchswitch01' | 'touchswitch02';
    devName: string;
    devUuid: string;
    modelName: string;
    prodTypeName: string;
    devStateMap: Record<string, string>;
    groupInfoMap: Record<
      | 'set_on_off'
      | 'set_on_off_l'
      | 'set_on_off_r'
      | 'show_inside_tem'
      | 'set_appointment'
      | 'set_wind_speed'
      | 'show_inside_hum'
      | 'set_mode'
      | 'set_tem'
      | string,
      {
        devElementList: {
          prodOperCode: string;
          elementType: number;
          operName: string;
          prodStateCode: string;
          value: string;
          elementCode: string;
        }[];
        groupName: string;
        groupCode: string;
      }
    >;
  }

  interface DeviceList {
    allRoomDeviceWrapper: Device[];
  }
}

interface Device {
  device: Ziroom.Device;
}

interface ZiroomPlatformConfig {
  token?: string;
  uid?: string;
  hid?: string;
}
