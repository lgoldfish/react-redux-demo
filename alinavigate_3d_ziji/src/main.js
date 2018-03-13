console.log("333")
import "../src/css/index.css"
console.log("444")
import {MapMng} from "./js/map"
console.log("5555")
import "../static/js/navigate"
console.log("6666")
const mapMng = new MapMng();
console.log("777",mapMng)

let markerMng ,audioProvider,lastmessageInNavi
mapMng.initMap().then(()=>{
    console.log("8888")
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
        var data = aliLocation.getLocation()
        // data = {x: 13361607.932468172, y: 3539748.7420764375,floor:3400625} 
        data = {x: 13361593.7500057, y: 3539716.01548276,floor:3400625} 
        data.x += Math.random()
        data.y += Math.random()
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
