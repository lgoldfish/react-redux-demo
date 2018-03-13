import { mapMng } from "./newMap";
let feature, lastFeature, markerMng, aliNaviMng;
window.coordType = "end";
//选择起点、终点
export const pickPOI = e => {
   markerMng = mapMng.markerMng;
  var touch = e.touches[0];
  var objs = mapView.searchObjectsByClient(touch.clientX, touch.clientY);
  var obj = objs[0];
  if (!obj) {
    return;
  }
  feature = obj.feature;
  console.log("feature", feature);
  let offset = mapView.coordinateSystem.getOffset();
  if (coordType == "end") {
    mapView.endCoord = {
      x: obj.point.x - offset[0],
      y: obj.point.y - offset[1]
    };
    mapView.endfloor = mapView.currentfloor;
    if (lastFeature) {
      mapView.layerGroup.removeLayer(mapView.endMarker);
    }
    markerMng.setEndMarker(mapView.endCoord);
    $(".button_list button")
      .eq(0)
      .attr("disabled", false)
      .siblings()
      .attr("disabled", true);
  } else if (coordType == "start") {
    mapView.startCoord = {
      x: obj.point.x - offset[0],
      y: obj.point.y - offset[1]
    };
    mapView.startfloor = mapView.currentfloor;
    if (lastFeature) {
      mapView.layerGroup.removeLayer(mapView.startMarker);
    }
       markerMng.setStartMarker(mapView.startCoord);
    $(".button_list button")
      .eq(1)
      .attr("disabled", false)
      .siblings()
      .attr("disabled", true);
  }
  lastFeature = feature;
};
