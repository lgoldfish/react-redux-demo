###1. 地图初始化渲染：
- a. poi渲染时的小圆点有没有接口可以配置是否显示;
未见过
- b. poi渲染时的文字位置需要放置在poi中心
修改template.json文件 "AreaText" 下的 "anchor"字段
```
"AreaText": {
	"renderer": {
        "type": "simple",
        "style": {
            "type": "Annotation",
            "color": "0x000000",
            "font": "30px -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Ubuntu, \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei\", \"Hiragino Kaku Gothic Pro\", Meiryo, \"Malgun Gothic\", \"Helvetica Neue\", Helvetica, sans-serif",
            "outlineWidth": 3,
            "outlineColor": "0xffffff",
            "field": "display",
            "anchor": [0.5, 1],
            "collision": true,
            "depthTest": true,
            "z": 2,
            "margin": -2
            }
        }
    }
```
---

###2. 提供接口来修改地图的方向
`mapView.activeControl.rotateTo(0,0,10)`

[rotateTo接口文档链接](http://downloads.ipalmap.com/docs/js3d/ThirdPersonControl.html#rotateTo)

---

###3. 路径规划时路线的箭头方向需要兼容ie
调用H5接口的DeviceOrientationEvent和DeviceMotionEvent接口,ie不兼容，该问题无法解决

>[接口文档](https://developer.mozilla.org/en-US/docs/Web/API/Detecting_device_orientation)
---

###4. 路径规划的起点位置和终点位置不太准确（有一点偏移）
修改template.json文件 "startMarker" 下的 "anchor" 字段
```
"startMarker": {
    "renderer": {
        "type": "simple",
        "style": {
            "type": "Icon",
            "texture": "./static/images/marker_start@2x.png",
            "anchor": [0.5, 1],
            "width": 61,
            "height": 74,
            "collision": false,
            "depthTest": false,
            "z": 0.2
        }
    }
}
```
---

###5. 图聚的水印有没有接口可以删除
3D-SDK默认是没有水印的，水印是前端应用自己添加到dom的
