class Marker {
    constructor(mapView){
        this.mapView = mapView
    }
    setEndMarker(endCoord){
        this.mapView.endMarker = new NGR.layer.FeatureLayer("endMarker", mapView.styleGenerator);
        this.mapView.endMarker.coordinateSystem = this.mapView.coordinateSystem
        var point = NGR.geom.GeometryFactory.createPoint([endCoord.x, endCoord.y])
        var endFeature = new NGR.data.Feature(point, { id: 1 });
        this.mapView.endMarker.addFeature(endFeature);
        this.mapView.layerGroup.addLayer(this.mapView.endMarker);
    }
    setStartMarker(startCoord){
        this.mapView.startMarker = new NGR.layer.FeatureLayer("startMarker", mapView.styleGenerator);
        this.mapView.startMarker.coordinateSystem = this.mapView.coordinateSystem
        var point = NGR.geom.GeometryFactory.createPoint([startCoord.x,startCoord.y])
        var startFeature = new NGR.data.Feature(point, { id: 1 });
        this.mapView.startMarker.addFeature(startFeature);
        this.mapView.layerGroup.addLayer(this.mapView.startMarker);
    }
    removeMarker(){
        this.mapView.layerGroup.removeLayer(this.mapView.layerGroup.getLayer("startMarker"))
        this.mapView.layerGroup.removeLayer(this.mapView.layerGroup.getLayer("endMarker"))
        this.mapView.endMarker = ""
        this.mapView.startMarker = ""
    }
    setLocMarker(){
        let locMarker = new NGR.layer.FeatureLayer("locMarker", this.mapView.styleGenerator);
        locMarker.coordinateSystem = this.mapView.coordinateSystem
        var point = NGR.geom.GeometryFactory.createPoint([0, 0])
        var localFeature = new NGR.data.Feature(point, { id: 1 });
        locMarker.addFeature(localFeature);
        this.mapView.layerGroup.addLayer(locMarker);
        this.mapView.gestureManager.on('zoom', 'zoomEnd', () => {
              const curDis = mapView.activeControl._curDistance;
              const scale = curDis / 10;
              mapView.sceneManager.setScale(locMarker, 'id', 1, scale, scale, 1);
          });
    }

}
export {Marker}