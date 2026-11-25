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
      "detectorPollIntervalMinutes": 2, // 可选，燃气/水浸传感器轮询分钟数，默认 2
      "lockPollIntervalMinutes": 60 // 可选，智能锁电量轮询分钟数，默认 60
    }
  ]
}
```

## 支持的设备

自如的智能设备有很多种，目前支持的设备如下：

- [x] 空调
- [x] 灯
- [x] 窗帘
- [x] 智能门锁电量（只读；不支持读取门锁状态或下发开锁/密码操作）
- [ ] 智能门锁状态与控制
- [ ] 浴霸
- [x] 水浸传感器（只读，含电量）
- [ ] 烟雾传感器
- [x] 燃气报警器（只读）
- [ ] 单键开关
- [ ] 双键开关

HomeKit 将水浸和燃气泄漏都通过 Leak Sensor 的报警状态表示。

燃气和水浸传感器状态默认每 2 分钟从自如刷新一次，智能门锁电量默认每 60 分钟刷新一次。可用 `detectorPollIntervalMinutes` 和 `lockPollIntervalMinutes` 调整轮询间隔（最小 1 分钟）；HomeKit/HA 读取时使用最近一次缓存值。智能锁目前只支持查看电量，不支持读取锁状态、下发密码或临时密码，也不支持远程开锁。
