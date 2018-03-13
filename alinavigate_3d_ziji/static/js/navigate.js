// aliNaviMng
class AliNaviMng {
	constructor(options){
		const {dataSource,mapView,styleGenerator,naviLayerid,needAudio,autoMove} = options;
		if(!dataSource || !mapView || !styleGenerator || !naviLayerid){
			throw  new Error("dataSource || mapview || naviLayer || styleGenerator ||needAudio || autoMove  can not is empty");
			return;
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
		this.dataSource = dataSource;
		this.mapView = mapView;
		this.styleGenerator = styleGenerator;
		this.navigate = new NavigateManager(dataSource);
		this.dynamicNaviManager = new DynamicNavigation(this.mapView, this.navigate,{needAudio: needAudio,autoplay:needAudio,endThreshold:needAudio}, {autoMove});
		this.dynamicNaviManager.featureCollection = this.navigate.getRawFC();
		this.naviLayer = "";
		this.naviLayerid = naviLayerid;
		this.dyNavInfo = {};
		this.isHasNaviline = false;
		this.offset = this.mapView.coordinateSystem.getOffset();
	}
	setStartPosition(flooid,coord){
		this.options.startfloor = flooid;
		this.options.startcoord = coord;
	}
	setEndPosition(floorid,coord){
		this.options.endfloor = floorid;
		this.options.endcoord = coord;
	}
	async initNavi(options){
		const {currentfloor , is3d} = options;
		this.is3d = is3d;
		if(this.mapView.getLayer("navi")){
			this.mapView.removeLayer(this.naviLayer);
			this.naviLayer = "";
		}
		if(!this.styleGenerator){
			throw new Error("styleGenerator can not is empty ,from NGR.style.JSONStyleGenerator(style)");
			return ;
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
			this.naviLayer = new FeatureLayer(this.naviLayerid,this.styleGenerator);
			this.naviLayer.coordinateSystem = this.mapView.coordinateSystem;
            this.mapView.addLayer(this.naviLayer);
            let floorsOrder = this.navigate.getPlanarGraphOrder();
            let a 
            for (let i=0 ; i< floorsOrder.length ; i++){
            	if(floorsOrder[i] == currentfloor){
            		a = true
            	}
            }
            if(!a){
                return;
            }
			const features = this.navigate.getNavigateByPlanarGraph(currentfloor);
			this.naviLayer.features = features;
			if(is3d){
				let animation = new TubeOffsetAnimation(this.mapView, this.naviLayer, { duration: 500 });
				animation.start();
			}
			this.isHasNaviline = true;
			return this.dynamicNaviManager.getMessageInList();
		}).catch((e)=>{
			console.error("导航线渲染失败",e)
		})
	}
	endNavigate(){
		if(this.mapView.getLayer(this.naviLayerid)){
			this.mapView.removeLayer(this.naviLayer);
			this.naviLayer = "";
			this.isHasNaviline = false;
		}
	}
	dynamicNavi(options){
		const {currentfloor,coord,maxRoadAttachDistance,maxDistanceReInitNavi,locMarker,locMarkerId} =options;
		if(!this.isHasNaviline ){
			for(var key in this.dyNavInfo ){
				delete this.dyNavInfo[key] ;
				}
			return this.dyNavInfo 
		}
		 let floorsOrder = this.navigate.getPlanarGraphOrder();
	    let a 
        for (let i=0 ; i< floorsOrder.length ; i++){
        	if(floorsOrder[i] == currentfloor){
        		a = true
        	}
        }
        if(!a){
        	for(var key in this.dyNavInfo ){
				delete this.dyNavInfo[key] ;
				}
			return this.dyNavInfo 
        }
		if(!coord.x){
			throw new Error("无有效定位数据，不能动态导航");
			return ;
		}
		this.dyNavInfo.closestPoint = this.navigate.getClosestPoints(currentfloor, coord.x, coord.y)[0];
		this.dyNavInfo.distanceToEnd = this.dynamicNaviManager.distanceToEnd(this.dyNavInfo.closestPoint.x,this.dyNavInfo.closestPoint.y,currentfloor,true,false);
		this.dyNavInfo.timeToEnd = this.dyNavInfo.distanceToEnd;
		this.dyNavInfo.messageInList = this.dynamicNaviManager.getMessageInList();
		this.dyNavInfo.messageInNavi = this.dynamicNaviManager.getMessageInNavi(needAudio);
		const closestDistance = NGR.navi.NaviUtils.getDistance(coord, this.dyNavInfo.closestPoint);
		if(closestDistance < maxRoadAttachDistance){
			this.dyNavInfo.closestDistance = "attach";
			this.mapView.sceneManager.setPosition(locMarker, "id",locMarkerId, this.dyNavInfo.closestPoint.x, this.dyNavInfo.closestPoint.y, 0.2);
			if(autoMove){
				this.dynamicNaviManager.findNearestSegment(this.dyNavInfo.closestPoint.x, this.dyNavInfo.closestPoint.y, currentfloor, true, true);
				this.dynamicNaviManager.moveToSegment();
			}

		}else if(closestDistance < maxDistanceReInitNavi){
			this.dyNavInfo.closestDistance = "deviateing";
			this.mapView.sceneManager.setPosition(locMarker, "id",locMarkerId, coord.x, coord.y, 0.2);

		}else {
			this.dyNavInfo.closestDistance = "deviated";
			this.endNavigate();
			this.isHasNaviline =true;
			this.setStartPosition(currentfloor,coord)
			let op = {currentfloor:currentfloor,is3d:this.is3d};
			this.initNavi(op);
		}
		return this.dyNavInfo ;
	}
}
window.NGR.navi.AliNaviMng = AliNaviMng

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

window.NGR.AudioProvider = AudioProvider
