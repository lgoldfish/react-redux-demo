(function () {
    window.map = new NGR.View('map', {
        appKey: "c7bc846ea1a14e7dad270c979888e4a3"
    });
    window.dataSource = new NGR.DataSource({
        appKey: "c7bc846ea1a14e7dad270c979888e4a3"
    });

    window.layers = {};
    dataSource.requestMaps().then(function (maps) {
        dataSource.requestPOIChildren(maps.list[0].poi).then(function(floors) {
            return dataSource.requestPlanarGraph(floors[0].id).then(function (layerInfo) {
                return NGR.IO.fetch({
                    url: '../static/json/style.json',
                    onsuccess: JSON.parse
                }).then(function (style) {
                    console.log("style is",style)
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
}).call(this);
