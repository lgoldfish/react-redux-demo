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
          <div>B1</div>
      </div>
      <div  class="showToast">
          正在切换楼层
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
      let array33 = ["003824",
"003821",
"003822",
"003824",
"003824",
"003824",
"003824",
"003822",
"003822",
"003824",
"003824",
"003824",
"003822",
"003821",
"003821",
"003822",
"003824",
"003821",
"003821",
"003822",
"003821",
"003822",
"003820",
"003822",
"003824",
"003822",
"003824",
"003821",
"003821",
"003821",
"003821",
"003821",
"003821",
"003822",
"003824",
"003824",
"003821",
"003822",
"003822",
"003821",
"003822",
"003822",
"003822",
"003822",
"003822",
"003822",
"003822",
"003822",
"003822",
"003822",
"003822",
"003822",
"003822",
"003822",
"003821",
"003822",
"003821",
"003822",
"003822",
"003822",
"003823",
"003823",
"003823",
"003823",
"003823",
"002642",
"003891",
"003891",
"003891",
"003891",
"003891",
"003891",
"003891",
"003822",
"003891",
"002631",
"003891",
"003891",
"003891",
"002630",
"003821",
"003891",
"003891",
"002630",
"003891",
"003891",
"003891",
"003822",
"002641",
"003891",
"003821"]
console.log("arraye33",array33)
 var set = new Set(array33)
 console.log("set",set)
 console.log("array4",Array.from(set))
    let markerMng ,audioProvider,lastmessageInNavi,aliNaviMng
      mapMng.initMap().then(()=>{
          audioProvider = new NGR.audio.AudioProvider()
          audioProvider.open()
          audioProvider.playMessage("欢迎使用图聚智能导航")
          mapView.isDyNavi = false
          aliLocation.init({
              debug:false,
              uuids:["FDA50693-A4E2-4FB1-AFCF-C6EB07647825"],
              port:40420
          })
          aliLocation.start()
          setInterval(()=>{
              var data = aliLocation.getLocation()
            //   data = {x: 13361607.932468172, y: 3539600.7420764375,floor:3400625} 
            //   data = {x: 13361593.7500057, y: 3539716.01548276,floor:3400625} 
            //   data.x += Math.random()
            //   data.y += Math.random()
            console.log("data is",data)
              if(mapView.layerGroup){
                  mapView.sceneManager.setPosition(mapView.layerGroup.getLayer("locMarker"),"id",1,data.x,data.y,0.2);
              }
              if(mapView.isDyNavi){
                  const options = {
                      currentfloor:mapView.currentfloor,
                      coord:data,
                      maxRoadAttachDistance:8,
                      maxDistanceReInitNavi:10,
                      locMarker:mapView.layerGroup.getLayer("locMarker"),
                      locMarkerId:1
                  }
                  mapMng.aliNaviMng.dynamicNavi(options).then((naviInfo)=>{
                          console.log(":naviInfo",naviInfo)
                        if(naviInfo.messageInNavi!=lastmessageInNavi){
                            audioProvider.playMessage(naviInfo.messageInNavi)
                        }
                        lastmessageInNavi = naviInfo.messageInNavi
                  })
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
            aliNaviMng.on("reInitNavi",()=>{
                    let messageInList2 = aliNaviMng.getMessageInList()
           console.log("messageInList2",messageInList2)
          })
          aliNaviMng.setStartPosition(mapView.startfloor,mapView.startCoord)
          aliNaviMng.setEndPosition(mapView.endfloor,mapView.endCoord)
          console.log("beafore navi")
          aliNaviMng.initNavi({currentfloor: mapView.currentfloor,is3d:false}).then(()=>{
                console.log("导航线出来了")
                let messageInList = aliNaviMng.getMessageInList()
                console.log("messageInList",messageInList)
          })
          console.log("aliNaviMng is",aliNaviMng)
        
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
      $(".floorControl div").eq(2).click(()=>{
          console.log("B1")
          mapMng.floorChange(3399427)
      })


  }
}
</script>
<style scoped>
</style>
