#aliNavigate 

// 初始化当航线管理器 (appkey | string ,map | mapView 对象)
# const aliNaviMng =  new NGR.AliNaviMng(appkey,map)

//设置起点位置 (latlng | 经纬度 {lat:164566,lng:4874331})
# aliNaviMng.setStartPosition(latlng, floorid);

//设置终点位置
# aliNaviMng.setEndPosition(latlng, floorid);

//渲染导航线  
# const options = {
#	floorid:当前楼层id,
#	style:地图的style样式,
#	layerType："Navi"对应style.json 中导航线的 图层id 
# }

# aliNaviMng.initNavi(options).then((naviInfo)=>{
#  console.log(naviInfo)
#})
naviInfo: {
	distance:44.972274142386205,//导航线总长度
	//导航线上的所有信息
	messageInList:[
		{message: "直行4米后, 右转", direction: "right", facilityType: undefined},		
		{message: "直行14米后, 左转", direction: "left", facilityType: undefined}
		]
	}
#const options = {
	 		currentFloor:map.currentFloor,//当前楼层
            coord:data,//云端返回的定位数据
            maxRoadAttachDistance:5,//路网吸附值
            maxDistanceReInitNavi:10,//导航线重新规划值
            locMarker:localMarker//定位点对象 NGR.canvasmarker();
}

//动态导航管理器 (前提：已画出导航线；该函数在获取云端定位点的回调里调用)
# const dyNaviInfo = aliNaviMng.dynamicNavi(options)
# dyNaviInfo 
{
	//导航线上距离指定坐标点最近的点
	closestPoint:{
		distance:实际定位点距离导航线的最近距离,
		x:导航线上的坐标x,
		y:导航线上的坐标y
	},
	distanceToEnd:距离终点的距离,
	timeToEnd：距离终点的时间,
	//当前导航线段的导航提示信息
	messageInNavi：{
		isWillChange: false, message: "直行20米后, 右转", distance: 20, direction: "right", facilityType: undefined
	},
	closestDistance:是否偏航的提示信息,//attach：可吸附,deviateing：正在偏航,deviated：将严重偏航，自动重新规划路线
}
//语音系统初始化
# const audioProvider = new NGR.AudioProvider()
//开启语音系统（默认开启）
# audioProvider.open()
//关闭语音系统
# audioProvider.close()
// 语音播放 msg:播放的信息string , isForce ：是否强制播放，默认非强制播放，语音列于队列当中，true为强制播放。
# audioProvider.playMessage(msg,isForce)