import Segment from "./navigate/Segment";
class AliNaviMng {
	constructor(appKey,map){
		if(!appKey){
			throw  new Error("appkey can't is empty")
			return
        }
        this.navigate = new NGR.NavigationProvider({
            appKey
        })
        this.map = map
        this.naviInfo = {},
        this.dyNaviInfo = {},
        this.routineLayer = "",
        this.isHasNaviline = false,
        this.initNaviOptions = "",
        this._segments = [],
        this._floorMap = { };
        this._crtIndex = 0
	}
	setStartPosition(latlng,floorid){
	  this.navigate.setFrom(latlng,floorid) 
	}
	setEndPosition(latlng,floorid){
      this.navigate.setDestination(latlng,floorid)
	}
 async initNavi(options){
        const {floorid,style,layerType} = options
        this.initNaviOptions = options
        this.routineLayer =  NGR.layerGroup()
       await this.navigate.navigate().then((features)=>{
           this.features = features
           this.routineLayer.clearLayers()
           this.naviInfo.distance = this.navigate.getNaviLineDistance()
           const routinesOnPlanarGraph = this.navigate.getRoutinesOnPlanarGraph(floorid)
           let layer = NGR.featureLayer(routinesOnPlanarGraph,{
               layerType,
               styleConfig:style
           })
         this.routineLayer.addLayer(layer)
         this.routineLayer.addTo(this.map)
         this.isHasNaviline = true  
         this._setFeatureCollection(features)
         this.naviInfo.messageInList = this.getMessageInList()
       }).fail((e)=>{
            console.error(e,e.stack)
       }) 
       return this.naviInfo
    }
    dynamicNavi(options){
        if(!this.isHasNaviline){
            return
        }
    const {currentFloor,coord,maxRoadAttachDistance,maxDistanceReInitNavi,locMarker} = options
        if(coord.x == 0 ){
            return
        }
        let latlng =  NGR.CRS.EPSG3857.unproject([coord.x,coord.y])
        let closePoint = this.navigate.getClosestPoint(currentFloor,coord.x,coord.y) 
        this.dyNaviInfo.closePoint = closePoint 
        let  closetLatlng = NGR.CRS.EPSG3857.unproject([closePoint.x,closePoint.y])
        if(closePoint.distance < maxRoadAttachDistance) {
            this.dyNaviInfo.closestDistance = "attach"
            this.findNearSegment(currentFloor,coord)
            locMarker.setLatLng(closetLatlng)
            this.dyNaviInfo.messageInNavi = this.getMessageInNavi()
            this.dyNaviInfo.distanceToEnd = this.distanceToEnd(currentFloor,coord)
            this.dyNaviInfo.timeToEnd = this.dyNaviInfo.distanceToEnd


        }else if (closePoint.distance < maxDistanceReInitNavi){
            this.dyNaviInfo.closestDistance = "deviateing"
            locMarker.setLatLng(latlng)
        }else {
            this.dyNaviInfo.closestDistance = "deviated"
            this.endNavigate()
            this.setStartPosition(latlng,currentFloor)
            this.initNaviOptions.floorid = currentFloor
            this.initNavi(this.initNaviOptions)
        }
        return this.dyNaviInfo
    }
    endNavigate(){
        this.routineLayer.clearLayers()
        this.routineLayer = ""
	}
    _setFeatureCollection(features){
        if(!(features instanceof Array)) {
            throw new Error('setFeatureCollection: failed a array is required');
        }
        this._reset()
        for(let i = 0; i<features.length;i++) {
            const segment = new Segment(features[i]);
            i > 0 && this._segments[i - 1].setNextSegment(segment);
            this._segments.push(segment);
            const floorId = features[i].properties.floor;
            //生成floorMap
            if(!this._floorMap[floorId]) {
                this._floorMap[floorId] = [segment];
            } else {
                this._floorMap[floorId].push(segment);
            }
        }

    }
    getMessageInList() {
        const arr = [];
        for(let i=0; i<this._segments.length; i++) {
            arr.push(this._segments[i].getMessage());
        }
        
        return arr;
    }
    findNearSegment(floorId,coord){
        this._crtCoord = coord 
        let oldIndex = this._crtIndex
        this._crtIndex = this._getCurSegmentIndex(floorId,coord)
    }
    getMessageInNavi() {
        return this._segments[this._crtIndex].getMessageInNavi(this._crtCoord);
    }
    distanceToEnd(floorId , coord ) {
        const index = this._getCurSegmentIndex(floorId, coord);
        let dis = this._segments[index].getRestDistance(coord);
        for(let i=index+1; i<this._segments.length; i++) {
            dis += this._segments[i]._distance;
        }
        return dis;
    }
    _getCurSegmentIndex(floorId, coord) {
        for(let i=0; i<this._segments.length; i++) {
            const isCurFloor = floorId === this._segments[i]._properties.floor;
            if(isCurFloor && this._segments[i].isInLine(coord)) {
                const curRestDis = this._segments[i].getRestDistance(coord);
                if(curRestDis <= 1 && i<(this._segments.length - 1) && !this._segments[i].facilityType) {
                    return i + 1;
                }
                return i;
            } 
        }

        if(process.env.NODE_ENV === 'development'){
            alert('error: not find cur segment');
            this._errorCoord = coord;
        }

        return 0;
    }
    _reset(){
        this._segments.length= 0;
        this._crtIndex = 0;
        this._audioIndex = 0;
        this._crtCoord = null;
    }
}
NGR.AliNaviMng = AliNaviMng
export default AliNaviMng