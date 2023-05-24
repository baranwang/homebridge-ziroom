declare namespace Ziroom {
  interface APIResponse<T = any> {
    code: string;
    data: T;
    message: string;
  }

  type Actions =
    | 'set_on_off'
    | 'set_on_off_l'
    | 'set_on_off_r'
    | 'set_brightness'
    | 'set_color_tem'
    | 'show_inside_tem'
    | 'set_appointment'
    | 'set_wind_speed'
    | 'show_inside_hum'
    | 'set_mode'
    | 'set_tem'
    | 'set_nightlight_group'
    | 'set_lighting_group'
    | 'set_ventilate_group'
    | 'set_weakwarm_group'
    | 'set_strongwarm_group'
    | 'set_blow_group'
    | 'curtain_opening';

  interface DevElement {
    prodOperCode: string;
    elementType: number;
    operName: string;
    prodStateCode: string;
    value: string;
    elementCode: string;
    minValue: number;
    maxValue: number;
  }
  interface Device {
    rname: string;
    rid: string;
    isOnline: 0 | 1;
    modelCode:
      | 'touchswitch01'
      | 'touchswitch02'
      | 'light03'
      | 'curtain01'
      | 'conditioner02'
      | 'waterimmersion01'
      | 'gasalarm01'
      | 'smokealarm01'
      | 'bathroommaster01';
    devName: string;
    devUuid: string;
    modelName: string;
    prodTypeName: string;
    devStateMap: Record<string, string>;
    groupInfoMap: Record<
      Actions | string,
      {
        devElementList: DevElement[];
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
  devConfig?: Record<
    string,
    Record<'reverseColorTem' | 'reversePosition', any>
  >;
}
