// var vConsole = new VConsole();
   let naviInfo,fromMarker ,isNavi = false, isDynavi = false, destMarker ,localMarker,startIcon ,latlng,localIcon,destIcon ,routineLayer ,navi,navigationProvider,mapStyle
  console.log("ngr is",NGR)
   let audioProvider = new NGR.AudioProvider()
   audioProvider.playMessage("欢迎使用图聚定位")
    window.map = new NGR.View('map', {
        appKey: "f9dbdaf8473a4039ac7226c2180ce5f1"
    });
    window.dataSource = new NGR.DataSource({
        appKey: "f9dbdaf8473a4039ac7226c2180ce5f1"
    });
    let aliNaviMng = new NGR.AliNaviMng("f9dbdaf8473a4039ac7226c2180ce5f1",map)
    window.layers = {};
    dataSource.requestMaps().then(function (maps) {
        dataSource.requestPOIChildren(maps.list[0].poi).then(function(floors) {
            map.currentFloor = floors[1].id
            return dataSource.requestPlanarGraph(floors[1].id).then(function (layerInfo) {
                return NGR.IO.fetch({
                    url: '../static/json/style.json',
                    onsuccess: JSON.parse
                }).then(function (style) {
                    mapStyle = style
                    layers.frame = NGR.featureLayer(layerInfo, {
                        layerType: 'Frame',
                        styleConfig: style
                    });
                    layers.area = NGR.featureLayer(layerInfo, {
                        layerType: 'Area',
                        styleConfig: style
                    });
                    layers.facility = NGR.featureLayer(layerInfo.Facility, {
                        layerType: 'Facility',
                        styleConfig: style
                    });
                    layers.collision = NGR.layerGroup.collision({
                        margin: 3
                    });
                    layers.collision.addLayer(layers.facility);
                    map.addLayer(layers.frame);
                    map.addLayer(layers.area);
                    map.addLayer(layers.collision);
                    map.render();
                    // 定位
                    latlng = {lat: 0, lng: 0}

                    localMarker = NGR.canvasmarker(latlng, {
                        icon: localIcon
                    });
                    localMarker.addTo(map)
                }).fail(function (e) {
                    return console.error("1",e, e.stack);
                });
            }).fail(function (e) {
                return console.error("2",e, e.stack);
            });
        }).fail(function (e) {
            return console.error("3",e, e.stack);
        });
    }).fail(function (e) {
        return console.error("4",e, e.stack);
    });
    startIcon = NGR.icon({
        iconUrl: '../static/images/marker_start@2x.png',
        iconSize: [25, 32]
      });
    
      destIcon = NGR.icon({
        iconUrl: '../static/images/marker_dest@2x.png',
        iconSize: [25, 32]
      });
    localIcon = new NGR.Icon({
          iconUrl:"../static/images/cur_position@2x.png",
          iconSize:[24,40]
      })
    map.on('click', function(e) {
        // console.log("click e is",e)
        if (!fromMarker) {
            fromMarker = NGR.marker(e.latlng, {
            icon: startIcon,
            draggable: true
          });
          fromMarker.addTo(map);
          aliNaviMng.setStartPosition(e.latlng,map.currentFloor)
        } else if (!destMarker) {
          destMarker = NGR.marker(e.latlng, {
            icon: destIcon,
            draggable: true
          });
          destMarker.addTo(map);
          aliNaviMng.setEndPosition(e.latlng,map.currentFloor)
          $(".initNav").attr("disabled",false).siblings().attr("disabled",true)
        }
      });

$(".exitNav").click(()=>{
    map.removeLayer(fromMarker)
    map.removeLayer(destMarker)
    aliNaviMng.endNavigate()
    fromMarker = null
    destMarker = null 
    isNavi = false
    isDynavi = false
    $(".initNav").attr("disabled",true).siblings().attr("disabled",true)
})
$(".initNav").click(()=>{
    isNavi = true
    let options = {
        floorid :map.currentFloor,
        style:mapStyle,
        layerType:"Navi"
    }
  aliNaviMng.initNavi(options).then((naviInfo)=>{
    console.log("naviInfo is",naviInfo)
  })
    $(".initNav").attr("disabled",true).siblings().attr("disabled",false)
})  
$(".dyNavi").on("click",()=>{
    isDynavi = true
})
aliLocation.init({
    debug:false,
    uuids:["FDA50693-A4E2-4FB1-AFCF-C6EB07647825"],
    port:40000
})  
aliLocation.start()
let lastMessage
setInterval(()=>{
    let data = aliLocation.getLocation()
    data = {x:13508843.59299286,y:3661283.775377244,floor:1849233,dr:0.000849}
    if(data.x == 0){
        return
    }
    if(isDynavi){
        const options = {
            currentFloor:map.currentFloor,
            coord:data,
            maxRoadAttachDistance:5,
            maxDistanceReInitNavi:10,
            locMarker:localMarker
        }
       let dyNaviInfo =  aliNaviMng.dynamicNavi(options)
       console.log("dyNaviInfo is",dyNaviInfo)
        if(dyNaviInfo.messageInNavi.message != lastMessage){
            audioProvider.playMessage(dyNaviInfo.messageInNavi.message)
        }
        lastMessage = dyNaviInfo.messageInNavi.message 
    }else{
        let latlng =  NGR.CRS.EPSG3857.unproject([data.x,data.y])
        localMarker.setLatLng(latlng)
    }
},1000)
aliLocation.orient(function(e) {
    if(localMarker){
        localMarker.setStyle({
            rotate:e.angle / 180 * Math.PI
        })
    }
  });