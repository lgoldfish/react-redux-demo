import config from "./config"
class  Control {
    constructor(mapView) {
        this.mapView = mapView
    }
    compassControl(){
        this.mapView.gestureManager.on('rotate', 'rotateEnd', ()=>{
            let angle = this.mapView.activeControl.getRotate();  
            $("#compass img").css("transform","rotate("+angle+"deg)")
        })
    }
}
class AddLight {
    constructor(mapView,styleGenerator){
        this.mapView = mapView ; 
        this.styleGenerator = styleGenerator;
    }
    addLight(){
        let lightLayer = new NGR.layer.FeatureLayer('light', this.styleGenerator);
        let point = NGR.geom.GeometryFactory.createPoint([0, 300, 300]);
        let lightFeature = new NGR.data.Feature(point, { id: 1 });
        lightLayer.addFeature(lightFeature);
        this.mapView.addLayer(lightLayer);
    }
}
function zoomLimit(mapView){
    mapView.activeControl.zoomByFocalLength(config.zoom)
    mapView.activeControl.maxDistance = config.zoomMax
    mapView.activeControl.minDistance = config.zoomMin

    console.log(mapView.activeControl.minDistance);
}
export  {
    Control,AddLight,zoomLimit
}