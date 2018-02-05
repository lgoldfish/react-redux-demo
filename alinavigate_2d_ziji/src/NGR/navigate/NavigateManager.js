import request from "../request/request";
import { bindAll } from "../utils/lang";
import Geometry from "../geometry/Geometry";
import GenerateId from "../core/GenerateId";

const defaultOptions = {
    // server: 'http://10.0.25.20:9093/navi'
    server: "https://apitingche.ipalmap.com:9094/navi",
    naviMarkerUrl: ''
};

class NavigateManage {
    /**
     * 构造器
     * @param {*} mapView
     * @param {*} options { server: '' }
     */
    constructor(ngrMap, options = {}) {
        if (!ngrMap) {
            throw new Error("NavigateManager: a NGRMap instance is require for init");
        }

        bindAll(["_onChangeFloor"], this);

        this._options = { ...defaultOptions, ...options };

        this._ngrMap = ngrMap;
        this._mapView = this._ngrMap.map;
        this._ngrMap.on("changeFloor", this._onChangeFloor);

        this._layerId = GenerateId.getId() + "naviLayer";
    }

    _onChangeFloor() {
        if (!this._isHasLayer) {
            return;
        }

        const routes = this._getNaviRouteByFloorId(this._mapView.currentFloor);
        this._addLayer(routes);
    }

    /**
     * 检测两点是否能渲染导航线（是否在同一个poi内）
     * @param {*} startPosition {currentFloor: number, lngLat: LngLat}
     * @param {*} endPosition {currentFloor: number, lngLat: LngLat}
     */
    validNavi(startPosition, endPosition) {
        const { currentFloor: startFloor, lngLat: startLngLat } = startPosition;
        const { currentFloor: endFloor, lngLat: endLngLat } = endPosition;
        if (startFloor !== endFloor) {
            return true;
        }

        const startP = this._mapView.project(startLngLat);
        const startFeatures = this._mapView.queryRenderedFeatures(startP, {
            layers: ["Area-Car-Spot"]
        });
        startFeatures.sort(
            (a, b) => b.properties.shapelevel - a.properties.shapelevel
        );
        const startFeature = startFeatures[0];

        const endP = this._mapView.project(endLngLat);
        const endFeatures = this._mapView.queryRenderedFeatures(endP, {
            layers: ["Area-Car-Spot"]
        });
        endFeatures.sort(
            (a, b) => b.properties.shapelevel - a.properties.shapelevel
        );
        const endFeature = endFeatures[0];

        return (
            !startFeature ||
            !endFeature ||
            startFeature.properties.id !== endFeature.properties.id
        );
    }

    /**
     * 渲染导航线
     * @param {*} starPosition
     * @param {*} endPosition
     */
    async renderNavi(startPosition, endPosition) {
        let { currentFloor: startFloor, lngLat: startLngLat } = startPosition;
        let { currentFloor: endFloor, lngLat: endLngLat } = endPosition;

        if (!startFloor || !startLngLat || !endFloor || !endLngLat) {
            console.warn("renderNavi: 缺少参数");
            return;
        }

        const startCoord = Geometry.transToWgs(startLngLat);
        const endCoord = Geometry.transToWgs(endLngLat);

        this._rawFC = await request.get(this._options.server, {
            query: {
                from_x: startCoord.x,
                from_y: startCoord.y,
                from_floor: startFloor,
                to_x: endCoord.x,
                to_y: endCoord.y,
                to_floor: endFloor
            }
        });
        const routes = this._getNaviRouteByFloorId(this._mapView.currentFloor);
        await this._addLayer(routes);
    }
    /**
     * 获取导航线的总距离
     */
    getWholeDistance() {
        if (!this._rawFC) {
            throw new Error(
                "Navi: getClosePoint failed, please use it after renderNavi"
            );
        }
        const { features } = this._rawFC;
        let distance = 0;
        for (let i = 0; i < features.length; i++) {
            const { coordinates } = features[i].geometry;
            distance += Geometry.getDistance(coordinates[0], coordinates[1]);
        }

        return distance;
    }

    /**
     * 获取导航线上最近的点
     * @param {*} floorId
     * @param {*} lngLat
     */
    getClosestPoint(floorId, lngLat) {
        if (!this._rawFC) {
            throw new Error(
                "Navi: getClosePoint failed, please use it after renderNavi"
            );
        }
        const { features } = this._getNaviRouteByFloorId(floorId, "wgs");
        const point = Geometry.transToWgs(lngLat);
        const result = [];
        for (let i = 0; i < features.length; i++) {
            if (features[i].properties.floor === floorId) {
                const { coordinates } = features[i].geometry;
                result.push(
                    Geometry.getProjection([point.x, point.y], coordinates)
                );
            }
        }
        result.sort((a, b) => a.dis - b.dis);
        return {
            lngLat: Geometry.transToLngLat(result[0].coord),
            coord: result[0].coord
        };
    }

    _addLayer(data) {
        return new Promise((resolve, reject) => {
            if (this._isHasLayer) {
                const source = this._mapView.getSource(this._layerId);    
                source && source.setData(data);
                resolve();
            } else {
                let ic_naviUrl = require("../../assets/images/jiantou@2x.png");
                this._mapView.loadImage(ic_naviUrl, (err, image) => {
                    if (err) reject(err);
                    this._mapView.addImage(this._layerId, image);
                    this._mapView.addLayer({
                        id: this._layerId,
                        type: "line",
                        source: {
                            type: "geojson",
                            data
                        },
                        layout: {
                            "line-cap": "round",
                            "line-join": "round"
                          
                        },
                        paint: {
                            "line-color": "#29ccac",
                            "line-width": {
                                stops:[
                                    [18, 8],
                                    [20, 16],
                                    [22, 32],
                                ]
                            },
                            "line-pattern": this._layerId
                        }
                    });
                    this._isHasLayer = true;
                    this._mapView.fire("addNaviLayer");
                    resolve();
                });
            }
        });
        
    }

    /**
     * 根据flooId获取对应楼层的导航线 ()
     * @param {*} floorId
     * @param {*} type 数据格式 lngLat | wgs 默认为lngLat
     */
    _getNaviRouteByFloorId(floorId, type = "lngLat") {
        const { features } = this._rawFC;
        const arr = [];
        for (let i = 0; i < features.length; i++) {
            const item = features[i];
            if (item.properties.floor === floorId) {
                if (type === "lngLat") {
                    const { coordinates } = item.geometry;
                    const coord1 = coordinates[0];
                    const lngLat1 = Geometry.transToLngLat({
                        x: coord1[0],
                        y: coord1[1]
                    });
                    const coord2 = coordinates[1];
                    const lngLat2 = Geometry.transToLngLat({
                        x: coord2[0],
                        y: coord2[1]
                    });
                    arr.push({
                        type: "Feature",
                        properties: item.properties,
                        geometry: {
                            type: "LineString",
                            coordinates: [
                                [lngLat1.lng, lngLat1.lat],
                                [lngLat2.lng, lngLat2.lat]
                            ]
                        }
                    });
                } else {
                    arr.push({
                        type: "Feature",
                        properties: item.properties,
                        geometry: item.geometry
                    });
                }
            }
        }
        return { type: "FeatureCollection", features: arr };
    }

    /**
     * 获取楼层经停顺序
     * @param {*} floorId
     */
    getFloorOrder() {
        const { features } = this._rawFC;
        const map = {},
            arr = [];
        for (let i = 0; i < features.length; i++) {
            const floorId = features[i].properties.floor;
            if (!map[floorId]) {
                arr.push(floorId);
                map[floorId] = true;
            }
        }

        return arr;
    }

    /**
     * 移除导航线
     */
    removeLayer() {
        if (this._isHasLayer) {
            this._mapView.removeLayer(this._layerId);
            this._mapView.removeSource(this._layerId);
            this._mapView.removeImage(this._layerId);
            //remove event listener
            this._mapView.off("changeFloor", this._onChangeFloor);

            this._isHasLayer = false;
            this._rawFC = null;
        }
    }

    /**
     * 获取原始定位数据
     */
    getRawFC() {
        return this._rawFC;
    }

    /**
     * 获取导航线区域的范围与中心点
     */
    getNaviLineRange(){
        const { features } = this._rawFC;
        let min = {};
        let max = {};
        if(!features||features.length === 0){
            return;
        }

        
        const coord = features[0] && features[0].geometry && features[0].geometry.coordinates;
        if(!coord){
            return;
        }

        const startCoord = coord[0];
        if(!startCoord|| startCoord.length < 2){
            return;
        }

        max.x = min.x = startCoord[0];
        max.y = min.y = startCoord[1];

        features.forEach(value => {
            let coord = value.geometry.coordinates[1];
            if(max.x < coord[0]){
                max.x = coord[0];
            }else if(min.x > coord[0]){
                min.x = coord[0];
            }

            if(max.y < coord[1]){
                max.y = coord[1];
            }else if(min.y > coord[1]){
                min.y = coord[1];
            }
        });

        let center = {x: (min.x + max.x)/2, y: (max.y + min.y)/2 };
        return { min, max , center};
    }

    /**
     * 获取导航线的点
     */
    getLngLats(floorId) {
        const arr = [];
        const { features } = this._rawFC;
        for (let i = 0; i < features.length; i++) {
            const point = features[i].geometry.coordinates[0];
            if(features[i].properties.floor !== floorId) {
                continue;
            }
            arr.push(Geometry.transToLngLat({ x: point[0], y: point[1] }));
            if(i === features.length - 1 || features[i + 1].properties.floor !== floorId) {
                const point2 = features[i].geometry.coordinates[1];
                arr.push(Geometry.transToLngLat({ x: point2[0], y: point2[1] }));
            }
        }
        return arr;
    }

    /**
     * 判断是否渲染导航线
     */
    hasNaviLine() {
        return this._isHasLayer;
    }
}

export default NavigateManage;
