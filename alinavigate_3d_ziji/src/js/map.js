import config from "./config"
import {Control,AddLight,zoomLimit}  from "./control"
import {pickPOI} from "./navigate"
import {Marker} from "./marker"
class MapMng {
    constructor(){

    }

    async initMap(){
        this.dataSource = new NGR.data.DataSource({
            appKey:config.appKey,
            server:"https://api.ipalmap.com"
        })
         this.mapView = new NGR.view.MapView("map",{
            initSkewAngle:0
        })
        window.mapView = this.mapView
       await this.dataSource.requestMaps().then((maps)=>{
           this.dataSource.requestPOIChildren(maps.list[0].poi)
            .then((floors)=>{
               const floorId = floors[1].id
               this.mapView.floorsData = floors
               this.mapView.currentfloor = floorId
               this.dataSource.requestPlanarGraph(floorId)
               .then((layerInfo)=>{
                   console.log('layerxxxx ')
                    NGR.fetch("../../static/json/template.json", {})
                    .then((res)=>{
                        return res.json()
                    })
                    .then((style)=>{
                        let engine = new NGR.engine.ThreeEngine()
                        this.styleGenerator = new NGR.style.JSONStyleGenerator(style)
                        this.mapView.styleGenerator = this.styleGenerator;
                        let camera = new NGR.camera.ThreeCamera(45,window.innerWidth / window.innerHeight,1,80000)
                        camera.camera.position.set(0,0,100);
                        this.mapView.activeCamera = camera;   
                        engine.initMapView(this.mapView,{
                            clearImage:"./static/images/bg/bg_point.png"
                        })
                        this.mapView.drawPlanarGraphExt(layerInfo, {gradually: true}, ()=> {
                            console.log("地图加载完成")
                            this.mapView.layerGroup = mapView.getLayer(this.mapView.currentfloor);
                            this.markerMng = new Marker(this.mapView)
                            this.markerMng.setLocMarker()
                        });
                        this.mapView.start()
                        this.mapView.gestureManager.on('singleTap', pickPOI)
                        let aliNaviOptions = {
                            dataSource:this.dataSource,mapView:this.mapView,styleGenerator:this.styleGenerator,naviLayerid:"navi"
                        }
                        this.aliNaviMng = new NGR.navi.aliNaviMng(aliNaviOptions)
                        new AddLight(this.mapView,this.styleGenerator).addLight()
                        zoomLimit(this.mapView)
                        new Control(this.mapView).compassControl()
                    })
                    .catch((e)=>{
                        console.error("1",e,e.stach)
                    })
               })
               .catch((e)=>{
                 console.error("2",e,e.stack)
               })
        
            })
        })
        .catch((e)=>{
           console.error("3",e,e.stack)
        })
    }
}

export {MapMng}