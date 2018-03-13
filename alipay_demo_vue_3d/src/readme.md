#aliNavigate 

#  const aliNaviOptions = {
			dataSource:this.dataSource,//地图数据资源
			mapView:this.mapView,//mapview对象
			styleGenerator:this.styleGenerator,//地图样式配置
			naviLayerid:"navi",//导航线图层的layerid
			needAudio:false || true,//是否开启语音导航，默认为false
	        autoMove:false || true //是否开启自动转换相机视角，默认false
                }

// 初始化当航线管理器
# const aliNaviMng =  new NGR.navi.AliNaviMng(aliNaviOptions)

//设置起点位置
# aliNaviMng.setStartPosition(floorId, coord);

//设置终点位置
# aliNaviMng.setEndPosition(floorId, coord);

//渲染导航线  （传入当前楼层id）
# await  aliNaviMng.initNavi(currentfloor);
// messageInList 是导航线上的信息 
# let messageInList = aliNaviMng.getMessageInList()
//导航线信息用法
   ``` javascript
   aliNaviMng.initNavi({currentfloor: mapView.currentfloor,is3d:false}).then(()=>{
        let messageInList = aliNaviMng.getMessageInList()
          })
```
//监听导航线重新渲染
```javascript
	 aliNaviMng.on("reInitNavi",()=>{
                    let messageInList2 = aliNaviMng.getMessageInList()
           console.log("messageInList2",messageInList2)
          })
```
#const options = {
	currentfloor：当前楼层id,
	coord:定位sdk返回的实时定位点,//{x:123456,y:1546364}
	maxRoadAttachDistance:5,//定位点吸附导航线阈值
	maxDistanceReInitNavi：10,//自动重新规划路线阈值
	locMarker：定位点图层,
	locMarkerId：定位点图层id
}

//动态导航管理器 (前提：已画出导航线；该函数在获取云端定位点的回调里调用)
```javascript
mapMng.aliNaviMng.dynamicNavi(options).then((naviInfo)=>{
		console.log(":naviInfo",naviInfo)
	if(naviInfo.messageInNavi!=lastmessageInNavi){
		audioProvider.playMessage(naviInfo.messageInNavi)
	}
	lastmessageInNavi = naviInfo.messageInNavi
})
```
# naviInfo 
{
	closestPoint:导航线上距离指定坐标点最近的点,
	distanceToEnd:距离终点的距离,
	timeToEnd：距离终点的时间,
	closestDistance:是否偏航的提示信息,//attach：可吸附,deviateing：正在偏航,deviated：将严重偏航，自动重新规划路线
}
//语音系统初始化
# const //audioProvider = new NGR.//audioProvider()
//开启语音系统（默认开启）
# //audioProvider.open()
//关闭语音系统
# //audioProvider.close()
// 语音播放 msg:播放的信息string , isForce ：是否强制播放，默认非强制播放，语音列于队列当中，true为强制播放。
# //audioProvider.playMessage(msg,isForce)
```javascript
	"AreaText": {
		"renderer": {
			"type": "unique",
			"keys":["id"],
			"default":{
				"type": "Annotation",
				"color": "0x000000",
				"font": "30px -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Ubuntu, \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei\", \"Hiragino Kaku Gothic Pro\", Meiryo, \"Malgun Gothic\", \"Helvetica Neue\", Helvetica, sans-serif",
				"outlineWidth": 3,
				"outlineColor": "0xffffff",
				"field": "display",
				"anchor": [0.5, 1],
				"collision": true,
				"depthTest": false,
				"z": 2,
				"margin": -2
			},
			"style": {
				"3401480":{
					"type": "Annotation",
					"color": "0x000000",
					"font": "100px -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Ubuntu, \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei\", \"Hiragino Kaku Gothic Pro\", Meiryo, \"Malgun Gothic\", \"Helvetica Neue\", Helvetica, sans-serif",
					"outlineWidth": 3,
					"outlineColor": "0xffffff",
					"field": "display",
					"anchor": [0.5, 1],
					"collision": true,
					"depthTest": false,
					"z": 2,
					"margin": -2,
					"anchorStyle": {
					"type": "Icon",
					"serverUrl": "https://api.ipalmap.com/logo/64/",
					"field": "logo",
					"width": 20,
					"height": 20,
     			 }
				}
			}
		}
	}
```