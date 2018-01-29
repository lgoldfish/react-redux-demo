// var vConsole = new VConsole();
import "../src/css/index.css"
import {MapMng} from "./js/map"
const mapMng = new MapMng();

let markerMng ,audioProvider,lastmessageInNavi
mapMng.initMap().then(()=>{
    audioProvider = new NGR.AudioProvider()
    audioProvider.open()
    audioProvider.playMessage("欢迎使用图聚智能导航")
    mapView.isDyNavi = false
    aliLocation.init({
        debug:false,
        uuids:["FDA50693-A4E2-4FB1-AFCF-C6EB07647825"],
        port:40000
    })
    aliLocation.start()
    setInterval(()=>{
        var data = aliLocation.getLocation();
        // data = {x: 13508856.233100427, y: 3661281.7272336474,floor:1849233} 
        if(mapView.layerGroup){
            mapView.sceneManager.setPosition(mapView.layerGroup.getLayer("locMarker"),"id",1,data.x,data.y,0.2);
        }
        if(mapView.isDyNavi){
            const options = {
                currentfloor:mapView.currentfloor,
                coord:data,
                maxRoadAttachDistance:5,
                maxDistanceReInitNavi:10,
                locMarker:mapView.layerGroup.getLayer("locMarker"),
                locMarkerId:1,
                needAudio: false,
                autoMove:true 
            }
            let naviInfo = mapMng.aliNaviMng.dynamicNavi(options)
            console.log(":naviInfo",naviInfo)
            if(naviInfo.messageInNavi!=lastmessageInNavi){
                audioProvider.playMessage(naviInfo.messageInNavi)
            }
            lastmessageInNavi = naviInfo.messageInNavi
        }
    },1000)
    aliLocation.orient(function(e) {
        if(mapView.layerGroup){
            mapView.sceneManager.setRotation(mapView.layerGroup.getLayer("locMarker"), 'id', 1, 0, 0, -e.angle / 180 * Math.PI);
        }
      });
})
.catch((err)=>{
    console.error("mapInit fail ",err)
})
export {mapMng}
