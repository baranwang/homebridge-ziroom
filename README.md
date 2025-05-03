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
    }
  ]
}
```

## 支持的设备

自如的智能设备有很多种，目前支持的设备如下：

- [x] 空调
- [x] 灯
- [ ] 窗帘
- [ ] 浴霸
- [ ] 水浸传感器
- [ ] 烟雾传感器
- [ ] 燃气传感器
- [ ] 单键开关
- [ ] 双键开关