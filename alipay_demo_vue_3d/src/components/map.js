import config from "./config"
import {Control,AddLight,zoomLimit}  from "./control"
import {pickPOI} from "./navigate"
import {Marker} from "./marker"
import setPriority from "./textMargin"
const priorityArr = [
    { 
        key: 'AreaText',
        value: [
            { key:"003824", value: 2 }, 
            { key:"003821", value: 2 }, 
            { key:"003822", value: 2 }, 
            { key:"003820", value: 2 }, 
            { key:"003823", value: 2 }, 
            { key:"002642", value: 2 }, 
            { key:"003891", value: 2 }, 
            { key:"002631", value: 2 },
            { key:"002630", value: 2 },
            { key:"002641", value: 2 },
            { key:"999999", value: 0 }
        ]
    },
    {
        key: 'Facility', 
        value: [
            { key: 'other', value: 6 },  // 其它设施
            { key: 24097000, value: 7 },  // 楼梯
            { key: 23043000, value: 3 },  // 建筑物正门
            { key: 23041000, value: 3 },  // 出入口
        ]
    }
];
class MapMng {
    constructor(){
        this.englishNames = ["002407",
        "002415",
        "002416",
        "002803",
        "002804",
        "002806",
        "002809",
        "002810",
        "002811",
        "002812",
        "003819",
        "003820",
        "003830",
        "003831",
        "003832",
        "003834",
        "003835",
        "003836",
        "003837",
        '003839',
        "003845",
        "003846",
        "003847",
        "003848",
        "003849",
        "003850",
        "003851",
        "003852",
        "003853",
        "003854",
        "003855",
        "003865",
        "003866",
        "003869",
        "003871",
        "003874",
        "003881",
        "003888",
        "003898",
        "003903",
        "003906",
        "003907",
        "003911",
        "003912",
        "003915",
        "003859",
        "003860",
        "003861",
        "003862",
        "003872",
        "003878",
        "002416",
        "003832",
        "003875",
        "003840","003894",
        "003877","003896","002412","002814","003857","003913"
    ]
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
           console.log("maps is",maps)
           this.dataSource.requestPOIChildren(maps.list[0].poi)
            .then((floors)=>{
                console.log("floors is",floors)
               const floorId = floors[2].id
               this.mapView.floorsData = floors
               this.mapView.currentfloor = floorId
               this.dataSource.requestPlanarGraph(floorId)
               .then((layerInfo)=>{
                   console.log("layerInfo before",layerInfo)
                    NGR.fetch("./static/template.json", {})
                    .then((res)=>{
                        console.log("template.json",res)
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
                            // clearImage:"./static/images/bg/bg_point.png"
                        })
                        //23062000   15000000
                        /** 
                         * 不渲染不需要的类别，通过englishName 
                        */
                       console.log("layerInfo is",layerInfo)
                        var planarGraph = new NGR.data.PlanarGraph(layerInfo); 
                        console.log("planarGraph",planarGraph)
                        console.log("planarGraph is",planarGraph.features.Area._features)
                        let planarGraph2 = []
                        var time1 = new Date().getTime()
                        planarGraph.features.Area._features.forEach((val,i)=>{                                       
                            this.englishNames.indexOf(val.properties.englishName) == -1 &&
                            planarGraph2.push(val);
                        })
                        var time2 = new Date().getTime()
                        console.log("循环花费的时间",time2 - time1)
                        console.log("planarGraph2",planarGraph2)
                        planarGraph.features.Area._features = planarGraph2
                        console.log("planarGraph3 is",planarGraph)
                        this.mapView.drawPlanarGraph(planarGraph); 

                        //--------------------------------------------------------
                        var time3 = new Date().getTime()
                        console.log("画图所需的时间",time3 - time2)
                        console.log("layerInfo is",layerInfo)
                        console.log("dataSource is",this.dataSource)
                        // this.mapView.drawPlanarGraphExt(layerInfo, {gradually: true}, ()=> {
                            console.log("地图加载完成")
                        // 调节文字的碰撞检测 看 priorityArr  默认是7 ，数字越小越不能碰撞掉 ，最小为0
                            setPriority(mapView, priorityArr);
                        //----------------------------------------------------
                            this.mapView.layerGroup = mapView.getLayer(this.mapView.currentfloor);
                            this.markerMng = new Marker(this.mapView)
                            this.markerMng.setLocMarker()
                            let aliNaviOptions = {
                                dataSource:this.dataSource,mapView:this.mapView,
                                styleGenerator:this.styleGenerator,naviLayerid:"navi",
                                needAudio: false,
                                autoMove:true 
                            }
                            this.aliNaviMng = new NGR.navi.AliNaviMng(aliNaviOptions)
                            // mapView.activeControl.minDistance = 200
                    //    })
                        this.mapView.start()
                        this.mapView.gestureManager.on('singleTap', pickPOI)
                        this.addLight = new AddLight(this.mapView,this.styleGenerator)
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
        $(".showToast").show().text("正在切换楼层")
        this.dataSource.requestPlanarGraph(floorId).then((layerInfo)=>{
            console.log("changefloor1")
            var planarGraph = new NGR.data.PlanarGraph(layerInfo); 
            console.log("planarGraph is",planarGraph.features.Area._features)
            let planarGraph2 = []
            var time1 = new Date().getTime()
            planarGraph.features.Area._features.forEach((val,i)=>{                                       
                this.englishNames.indexOf(val.properties.englishName) == -1 &&
                planarGraph2.push(val);
            })
            var time2 = new Date().getTime()
            console.log("循环花费的时间",time2 - time1)
            console.log("planarGraph2",planarGraph2)
            planarGraph.features.Area._features = planarGraph2
            this.mapView.drawPlanarGraph(planarGraph); 
            $(".showToast").hide()
            this.mapView.currentfloor = floorId
            var time3 = new Date().getTime()
            console.log("画图所需的时间",time3 - time2)
                console.log("地图加载完成")
              setPriority(this.mapView , priorityArr);
            // this.mapView.drawPlanarGraphExt(layerInfo, {gradually: true}, ()=> {
                this.addLight.addLight()
                this.mapView.currentfloor = floorId 
                this.mapView.layerGroup = this.mapView.getLayer(this.mapView.currentfloor);
                this.markerMng.setLocMarker()
                this.mapView.gestureManager.on('singleTap', pickPOI)
                if(this.mapView.isHasNavLine){
                    this.aliNaviMng.initNavi({currentfloor:this.mapView.currentfloor,is3d:false}).then(()=>{
                        console.log("导航线出来了")
                    })
                }
            // })
        })
        .catch((e)=>{
            console.error("error",e)
        })
    }
}

export {MapMng}