# Homebridge Ziroom Platform

自如智能硬件 HomeBridge 插件

## 安装

```shell
npm i -g --unsafe-perm homebridge homebridge-ziroom
```

## 配置

自行抓取自如 APP 登录后的 Token 配置在 Homebridge 配置文件中，如下：

```jsonc
{
  // ...
  "platforms": [
    {
      "platform": "ziroom",
      "name": "Ziroom",
      "token": "token",
      "hid": "hid", // 可选，如果填入合同号，则会自动查找合同对应的房间
      "devConfig": {
        "${devUuid}": { // devUuid 为设备的 UUID，可以在日志中找到
          // 实际中有发现设备的一些配置是反的，例如灯光的冷暖，窗帘的开关，可以通过这里进行反转
          "reverseColorTem": false, // 反转灯光的冷暖
          "reversePosition": false // 反转窗帘的开关
        }
      }
    }
  ]
}
```

## 支持的设备

自如的智能设备有很多种，目前支持的设备如下：

- [x] 空调
- [x] 筒灯
- [x] 窗帘
- [x] 浴霸
- [x] 水浸传感器
- [x] 烟雾传感器
- [x] 燃气传感器
- [x] 单键开关
- [ ] 双键开关
- ...