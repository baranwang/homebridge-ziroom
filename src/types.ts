import type { PlatformAccessory } from 'homebridge';

export type ZiroomPlatformAccessory = PlatformAccessory<ZiroomPlatformAccessoryContext>;

export type ZiroomPlatformAccessoryContext = {
  deviceInfo: ZiroomDeviceInfo;
};

export interface ZiroomDeviceInfo {
  /** 设备UUID */
  devUuid: string;
  /** 设备名称 */
  devName: string;
  /** 房间名 */
  rname: string;
  /** 设备状态 */
  devStateMap: Record<string, string>;
  /** 是否在线 */
  isOnline: 0 | 1;
  /** 设备类型 */
  modelCode: string;
  /** 品牌名 */
  brandName: string;
  prodTypeId: string;
  modelName: string;
  prodTypeName: string;
  firstLevelTypeName: string;
  secondLevelTypeName: string;
  groupInfoMap: Record<string, ZiroomGroupInfo>;
}

export interface ZiroomGroupInfo {
  groupName: string;
  groupType: number;
  isAggregate: number;
  groupCode: string;
  devElementList: ZiroomDevElementInfo[];
}

export interface ZiroomDevElementInfo {
  prodOperCode: string;
  prodStateName: string;
  elementCode: string;
  elementName: string;
  prodStateCode: string;
  elementType: number;
  value: string;
  maxValue?: number;
  minValue?: number;
}
