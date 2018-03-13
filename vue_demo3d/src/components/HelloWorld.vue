<template>
  <div>
    <div id="map" style="width: 100%; height: 100%; margin: 0; padding: 0; position:absolute"></div>
      <div class="button_list">
          <div>
              <button disabled>设为终点</button>
              <button disabled>设为起点</button>
              <button disabled>出导航线</button>
              <button disabled>退出导航</button>
              <button disabled class="dynavi">动态航线</button>
          </div>     
        
      </div>
      <div class="floorControl">
          <div>F1</div>
          <div>F7</div>
      </div>
  </div>
</template>
<script src="./navigate.js"></script>
<script>
import {mapMng} from "./newMap"
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  mounted(){
    let markerMng ,audioProvider,lastmessageInNavi,aliNaviMng
      mapMng.initMap().then(()=>{
          console.log("99999 IS",NGR)
          console.log("8888",NGR.audio.AudioProvider)
          audioProvider = new NGR.audio.AudioProvider()
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

            // 设为终点
      $(".button_list button").eq(0).click(()=>{
          coordType = "start"
          console.log("endbutton")
      })
      // 设为起点
      $(".button_list button").eq(1).click(()=>{
          $(".button_list button").eq(2).attr("disabled",false).siblings().attr("disabled",true)
      })
      // 开始导航
      $(".button_list button").eq(2).click(()=>{
          console.log("开始导航",NGR.navi)
          $(".button_list button").eq(3).attr("disabled",false).siblings().attr("disabled",true)
          console.log("mapMng is ",mapMng)
          $(".dynavi").attr("disabled",false)
          mapView.isHasNavLine = true
          coordType = ""
          aliNaviMng = mapMng.aliNaviMng
          console.log("aliNaviMng",aliNaviMng)
          aliNaviMng.setStartPosition(mapView.startfloor,mapView.startCoord)
          aliNaviMng.setEndPosition(mapView.endfloor,mapView.endCoord)
          console.log("beafore navi")
          aliNaviMng.initNavi({currentfloor: mapView.currentfloor,is3d:false}).then(()=>{
              console.log("导航线出来了")
          })
      })
      // 退出导航
      $(".button_list button").eq(3).click(()=>{
          console.log("退出导航")
          coordType = "end"
          mapView.isDyNavi = false
          mapMng.markerMng.removeMarker()
          aliNaviMng.endNavigate()
          mapView.isHasNavLine = false

      })
      // 动态导航
      $(".button_list button").eq(4).click(()=>{
          console.log("动态导航")
          mapView.isDyNavi = true
      })
      //楼层切换 
      $(".floorControl div").eq(0).click(()=>{
          mapMng.floorChange(3400625)
          console.log("F1")
      })
      $(".floorControl div").eq(1).click(()=>{
          console.log("F7")
          mapMng.floorChange(3401443)
      })


  }
}
</script>
<style scoped>
</style>
