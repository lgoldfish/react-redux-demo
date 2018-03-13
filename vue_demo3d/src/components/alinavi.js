// aliNaviMng
class AliNaviMng {
	constructor(options){
		const {dataSource,mapView,styleGenerator,naviLayerid} = options
		if(!dataSource || !mapView || !styleGenerator || !naviLayerid){
			throw  new Error("dataSource || mapview || naviLayer || styleGenerator can not is empty")
			return
		}
		this.options = {
			startfloor:"",
			endfloor:"",
			startcoord:{
				x:"",
				y:""
			},
			endcoord:{
				x:"",
				y:""
			}
		}
		this.dataSource = dataSource
		this.mapView = mapView
		this.styleGenerator = styleGenerator
		this.navigate = new NGR.navi.NavigateManager(dataSource)
		this.naviLayer = ""
		this.dynamicNaviManager = ""
		this.naviLayerid = naviLayerid
		this.dyNavInfo = {},
		this.isHasNaviline = false,
		this.offset = this.mapView.coordinateSystem.getOffset();
	}
	setStartPosition(flooid,coord){
		this.options.startfloor = flooid
		this.options.startcoord = coord
	}
	setEndPosition(floorid,coord){
		this.options.endfloor = floorid
		this.options.endcoord = coord
	}
	async initNavi(options){
		const {currentfloor , is3d} = options
		this.is3d = is3d
		if(this.mapView.getLayer("navi")){
			this.mapView.removeLayer(this.naviLayer)
			this.naviLayer = ""
		}
		if(!this.styleGenerator){
			throw new Error("styleGenerator can not is empty ,from NGR.style.JSONStyleGenerator(style)")
			return 
		}
		let that = this
	  await	this.navigate.navigate({
			'from_x': that.options.startcoord.x,
			'from_y': that.options.startcoord.y,
			'from_planar_graph': that.options.startfloor,
			'to_x':that.options.endcoord.x,
			'to_y':that.options.endcoord.y,
			'to_planar_graph': that.options.endfloor
		}).then((res)=>{
			console.log("a")
			this.naviLayer = new NGR.layer.FeatureLayer(this.naviLayerid,this.styleGenerator)
			console.log("b")
			this.naviLayer.coordinateSystem = this.mapView.coordinateSystem
			console.log("c")
			this.mapView.addLayer(this.naviLayer)
			console.log("d")
			let floorsOrder = this.navigate.getPlanarGraphOrder()
			console.log("e",floorsOrder)
			console.log("eee",currentfloor,typeof currentfloor)
			console.log("ee",floorsOrder.includes(Number(currentfloor)))
            if(!floorsOrder.includes(Number(currentfloor))){
                return
			}
			console.log("f")
			const features = this.navigate.getNavigateByPlanarGraph(currentfloor);
			console.log("g")
			this.naviLayer.features = features;
			if(is3d){
				let animation = new NGR.helper.tubeHelper.TubeOffsetAnimation(this.mapView, this.naviLayer, { duration: 500 });
				animation.start();
			}
			this.isHasNaviline = true
		}).catch((e)=>{
			console.error("导航线渲染失败",e)
		})
	}
	endNavigate(){
		if(this.mapView.getLayer(this.naviLayerid)){
			this.mapView.removeLayer(this.naviLayer)
			this.naviLayer = ""
			this.isHasNaviline = false
		}
	}
	dynamicNavi(options){
		const {currentfloor,coord,maxRoadAttachDistance,maxDistanceReInitNavi,locMarker,locMarkerId,needAudio,autoMove} =options
		if(!this.isHasNaviline || !this.navigate.getPlanarGraphOrder().includes(Number(currentfloor))){
			for(var key in this.dyNavInfo ){
				delete this.dyNavInfo[key] ;
				}
			return this.dyNavInfo 
		}
		if(!coord.x){
			throw new Error("无有效定位数据，不能动态导航")
			return 
		}
		this.dynamicNaviManager = new NGR.navi.DynamicNavigation(this.mapView, this.navigate,{needAudio: needAudio,autoplay:needAudio,endThreshold:needAudio}, {autoMove});
		console.log("getRawFC()", this.navigate.getRawFC())
		this.dynamicNaviManager.featureCollection = this.navigate.getRawFC();
		console.log("q")
		this.dyNavInfo.closestPoint = this.navigate.getClosestPoints(currentfloor, coord.x, coord.y)[0]
		console.log("qq")
		this.dyNavInfo.distanceToEnd = this.dynamicNaviManager.distanceToEnd(this.dyNavInfo.closestPoint.x,this.dyNavInfo.closestPoint.y,currentfloor,true,false)
		console.log("qqq")
		this.dyNavInfo.timeToEnd = this.dyNavInfo.distanceToEnd
		this.dyNavInfo.messageInList = this.dynamicNaviManager.getMessageInList()
		this.dyNavInfo.messageInNavi = this.dynamicNaviManager.getMessageInNavi(needAudio)
		const closestDistance = NGR.navi.NaviUtils.getDistance(coord, this.dyNavInfo.closestPoint);
		if(closestDistance < maxRoadAttachDistance){
			this.dyNavInfo.closestDistance = "attach"
			this.mapView.sceneManager.setPosition(locMarker, "id",locMarkerId, this.dyNavInfo.closestPoint.x, this.dyNavInfo.closestPoint.y, 0.2)
			if(autoMove){
				this.dynamicNaviManager.findNearestSegment(this.dyNavInfo.closestPoint.x, this.dyNavInfo.closestPoint.y, currentfloor, true, true)
				this.dynamicNaviManager.moveToSegment()
			}

		}else if(closestDistance < maxDistanceReInitNavi){
			this.dyNavInfo.closestDistance = "deviateing"
			this.mapView.sceneManager.setPosition(locMarker, "id",locMarkerId, coord.x, coord.y, 0.2)

		}else {
			this.dyNavInfo.closestDistance = "deviated"
			this.endNavigate()
			this.isHasNaviline =true
			this.setStartPosition(currentfloor,coord)
			let op = {currentfloor:currentfloor,is3d:this.is3d}
			this.initNavi(op)
		}
		return this.dyNavInfo 
	}
}
NGR.navi.AliNaviMng = AliNaviMng

class AudioProvider {
    constructor() {
        const dom = document.getElementById('audioProvider');
        dom && dom.remove();
		this._status = 'open';
        this._audioStack = [];
		this._audioDom = document.createElement('audio');
		this._audioDom.setAttribute("id","audioProvider")
        this._audioDom.onplaying = () => {
            this._isPlaying = true;
        };

        this._audioDom.onended = () => {
            this._isPlaying = false;
            this.playMessage(this._audioStack.shift());
        };

        document.body.appendChild(this._audioDom);
    }

    playMessage(msg, isForce) {
        if (typeof msg !="string" || this._status === 'close') {
            return;
        }

        if (this._isPlaying) {
            isForce && this._audioStack.push(msg);
            return;
        }

        this._audioDom.src = `https://apiexternal.ipalmap.com:10010/speech?tex=${msg}`;
        this._audioDom.play();
        this._isPlaying = true;
    }

    close() {
        this._status = 'close';
        this._audioDom.muted = true;
    }

    open() {
        this._status = 'open';
        this._audioDom.muted = false;
    }
}

NGR.AudioProvider = AudioProvider
