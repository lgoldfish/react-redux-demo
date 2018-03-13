import config from "./config"
import {Control,AddLight,zoomLimit}  from "./control"
import {pickPOI} from "./navigate"
import {Marker} from "./marker"
// import "./alinavi"
class MapMng {
    constructor(){

    }

    async initMap(){
        console.log("99999")
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
               const floorId = floors[3].id
               this.mapView.floorsData = floors
               this.mapView.currentfloor = floorId
               this.dataSource.requestPlanarGraph(floorId)
               .then((layerInfo)=>{
                   console.log('layerxxxx ')
                    NGR.fetch("/static/template.json", {})
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
                        console.log("1000")
                        // var planarGraph = new NGR.data.PlanarGraph(layerInfo); 
                        // this.mapView.drawPlanarGraph(planarGraph); 
                        this.mapView.drawPlanarGraphExt(layerInfo, {gradually: true}, ()=> {
                            console.log("地图加载完成")
                            this.mapView.layerGroup = mapView.getLayer(this.mapView.currentfloor);
                            this.markerMng = new Marker(this.mapView)
                            this.markerMng.setLocMarker()
                            console.log("NGR IS",NGR)
                            console.log("5",NGR.navi)
                            this.aliNaviMng = new NGR.navi.AliNaviMng(aliNaviOptions)
                            console.log("8",this.aliNaviMng)
                       });
                        console.log("2")
                        this.mapView.start()
                        console.log("3")
                        this.mapView.gestureManager.on('singleTap', pickPOI)
                        console.log("4")
                        let aliNaviOptions = {
                            dataSource:this.dataSource,mapView:this.mapView,styleGenerator:this.styleGenerator,naviLayerid:"navi"
                        }
                        console.log("6")
                        this.addLight = new AddLight(this.mapView,this.styleGenerator)
                        console.log("7")
                        this.addLight.addLight()
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
    floorChange(floorId){
        console.log("changefloor0")
        this.dataSource.requestPlanarGraph(floorId).then((layerInfo)=>{
            console.log("changefloor1")
            this.mapView.drawPlanarGraphExt(layerInfo, {gradually: true}, ()=> {
                console.log("changefloor2")
                this.mapView.currentfloor = floorId 
                this.mapView.layerGroup = mapView.getLayer(this.mapView.currentfloor);
                this.markerMng.setLocMarker()
                this.mapView.gestureManager.on('singleTap', pickPOI)
                this.addLight.addLight()
                if(this.mapView.isHasNavLine){
                    this.aliNaviMng.initNavi({currentfloor:this.mapView.currentfloor,is3d:false}).then(()=>{
                        console.log("导航线出来了")
                    })
                }
            })
        })
        .catch((e)=>{
            console.error("error",e)
        })
    }
}

export {MapMng}