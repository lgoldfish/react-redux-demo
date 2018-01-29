# 图聚--支付宝蓝牙定位 SDK

- 支持H5通过支付宝扫描周边Beacon信息
- 通过图聚云端定位引擎实时获取定位信息

### Version   
#### 1.1

#### Release Notes 1.1
1. 优化了构建流程
2. 添加了获取手机方向与加速度的接口

## 使用方法

#### Script 标签引入

```
 <script type="text/javascript" src="locore.min.js"></script>

```

#### Import 引入 

```
import aliLocation from "locore.min.js"

```
#### CDN 引入

```
<script src="http://palmap-parking.oss-cn-shanghai.aliyuncs.com/alipayDemo/locore.min.js"></script>
```

## SDK 接口说明

#### 初始化
```
aliLocation.init({
    debug:false,//选填 默认false
    uuids:[],//选填 默认"FDA50693-A4E2-4FB1-AFCF-C6EB07647825"
    port:,//选填 图聚定位引擎端口号，默认40040
    major://选填 筛选现场蓝牙beacons的major信息，不填则不筛选
})
```
#### 开始监听定位数据

```
aliLocation.start();
```

#### 发送beacon信息获取云端定位信息

```
setInterval(function() {
  var data = palmapLocation.getLocation();
  //在这里添加你的逻辑
}, 1000);
```

#### 获取手机陀螺仪角度

```
aliLocation.orient(function(e) {
  //在这里添加你的逻辑
});
```

#### 获取移动/静止状态

```
aliLocation.motion(function(e) {
  //在这里添加你的逻辑
});
```
#### 停止监听定位数据


```
aliLocation.stop();
```


#### 云端定位信息说明

```
location:{
    x: 0,           //x坐标   （墨卡托米制坐标）
    y: 0,           //y坐标   （墨卡托米制坐标）
    floor: 0,       //楼层id  （来自图聚数据平台）
    er: 0           //误差。   （单位：米）
}
```
