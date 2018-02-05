import {mapMng} from "../main"
console.log("mapMng is",mapMng)
let feature , lastFeature , coordType = "end", markerMng ,aliNaviMng
//选择起点、终点
export const pickPOI = (e)=>{
    markerMng = mapMng.markerMng
    var touch = e.touches[0];
    var objs = mapView.searchObjectsByClient(touch.clientX, touch.clientY);
    var obj = objs[0];
    if (!obj) {
      return;
    }
    feature = obj.feature;
    console.log("feature",feature)
    let offset = mapView.coordinateSystem.getOffset();
    if(coordType == "end"){
        mapView.endCoord = {
            x:obj.point.x - offset[0],
            y:obj.point.y - offset[1]
        }
        mapView.endfloor = mapView.currentfloor
        if (lastFeature) {
            mapView.layerGroup.removeLayer(mapView.endMarker)
        }
        markerMng.setEndMarker(mapView.endCoord)
        $(".button_list button").eq(0).attr("disabled",false).siblings().attr("disabled",true)
    }else if(coordType == "start"){
        mapView.startCoord = {
            x:obj.point.x - offset[0],
            y:obj.point.y - offset[1]
        }
        mapView.startfloor = mapView.currentfloor
        if (lastFeature) {
            mapView.layerGroup.removeLayer(mapView.startMarker)
        }
        markerMng.setStartMarker(mapView.startCoord)
        $(".button_list button").eq(1).attr("disabled",false).siblings().attr("disabled",true)
    }
    lastFeature = feature;
}
// 设为终点
$(".button_list button").eq(0).click(()=>{
    coordType = "start"
})
// 设为起点
$(".button_list button").eq(1).click(()=>{
    $(".button_list button").eq(2).attr("disabled",false).siblings().attr("disabled",true)
})
// 开始导航
$(".button_list button").eq(2).click(()=>{
    console.log("开始导航")
    $(".button_list button").eq(3).attr("disabled",false).siblings().attr("disabled",true)
    console.log("mapMng is ",mapMng)
    $(".dynavi").attr("disabled",false)
    mapView.isHasNavLine = true
    coordType = ""
    aliNaviMng = mapMng.aliNaviMng
    aliNaviMng.setStartPosition(mapView.startfloor,mapView.startCoord)
    aliNaviMng.setEndPosition(mapView.endfloor,mapView.endCoord)
    aliNaviMng.initNavi({currentfloor: mapView.currentfloor,is3d:true}).then(()=>{
        console.log("导航线出来了")
    })
})
// 退出导航
$(".button_list button").eq(3).click(()=>{
    console.log("退出导航")
    coordType = "end"
    mapView.isDyNavi = false
    markerMng.removeMarker()
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
    mapMng.floorChange(1849195)
    console.log("F1")
})
$(".floorControl div").eq(1).click(()=>{
    console.log("F7")
    mapMng.floorChange(1849233)
})

