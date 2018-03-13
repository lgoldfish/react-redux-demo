import request from '../request/request';
import { bindAll, getMinByArray, getMaxByArray } from '../utils/utils';
import Geometry from '../geometry/Geometry';
import NGRMap from '../NGRMap';

const defaultOptions = {
    layerName: 'naviLine',
    walkedLayerName: 'naviLineWalked',
};

class NaviManager {
    constructor(map, options = {}) {
        if (!(map instanceof NGRMap)) {
            throw new Error('Navi: a NGRMap instance is required');
        }
        this._options = { ...defaultOptions, ...options };
        this._options.server = `${map._options.apiServer}navi`;

        this._map = map;

        bindAll([
            '_onChangeFloor',
        ], this);

        this._map.on('changeFloor', this._onChangeFloor);
    }

    _onChangeFloor() {
        if (!this._rawFC) {
            return;
        }
        const data = this._getNaviRouteByFloorId(this._map.currentFloor);
        this._addLayer(data, { type: 'FeatureCollection', features: [] });
    }

    validNavi(startPosition, endPosition) {
        const { currentFloor: startFloor, lngLat: startLngLat } = startPosition;
        const { currentFloor: endFloor, lngLat: endLngLat } = endPosition;
        if (startFloor !== endFloor) {
            return true;
        }

        const startP = this.mapView.project(startLngLat);
        const startFeatures = this.mapView.queryRenderedFeatures(startP, {
            layers: ['Area'],
        });
        startFeatures.sort((a, b) => b.properties.shapelevel - a.properties.shapelevel);
        const startFeature = startFeatures[0];

        const endP = this.mapView.project(endLngLat);
        const endFeatures = this.mapView.queryRenderedFeatures(endP, {
            layers: ['Area'],
        });
        endFeatures.sort((b, a) => b.properties.shapelevel - a.properties.shapelevel);
        const endFeature = endFeatures[0];

        return (
            !startFeature ||
            !endFeatures ||
            startFeatures.properties.id !== endFeature.properties.id
        );
    }

    /**
     * 获取导航线的中心点和适合其大小的zoom层级
     */
    getFitByNavi(padding) {
        if (!this._rawFC) {
            return {};
        }
        const lines = this.getLines(this._map.currentFloor);
        // get center lngLat
        const xAxis = [];
        const yAxis = [];
        for (let i = 0; i < lines.length; i += 1) {
            const coordinates = lines[i];
            for (let j = 0; j < coordinates.length; j += 1) {
                xAxis.push(coordinates[j][0]);
                yAxis.push(coordinates[j][1]);
            }
        }
        const minX = getMinByArray(xAxis);
        const maxX = getMaxByArray(xAxis);
        const minY = getMinByArray(yAxis);
        const maxY = getMaxByArray(yAxis);
        const x = (minX + maxX) / 2;
        const y = (minY + maxY) / 2;
        const lngLat = Geometry.transToLngLat({ x, y });
        const zoom = this._getFitZoom({ minX, minY, maxX, maxY }, padding);
        return { lngLat, zoom };
    }

    _getFitZoom({ minX, minY, maxX, maxY }, padding = 0) {
        // 西北 左上
        const leftTop = Geometry.transToLngLat({ x: minX, y: maxY });
        const rightBottom = Geometry.transToLngLat({ x: maxX, y: minY });
        const tr = this.mapView.transform;
        const nw = tr.project(leftTop);
        const se = tr.project(rightBottom);
        const size = se.sub(nw);
        const scaleX = (tr.width - (padding * 2)) / size.x;
        const scaleY = (tr.height - (padding * 2)) / size.y;
        if (scaleX < 0 || scaleY < 0) {
            return this.mapView.getZoom();
        }
        const maxZoom = this.mapView.getMaxZoom();
        return Math.min(tr.scaleZoom(tr.scale * Math.min(scaleX, scaleY)), maxZoom);
    }

    async renderNavi(startPosition, endPosition) {
        const { currentFloor: startFloor, lngLat: startLngLat } = startPosition;
        const { currentFloor: endFloor, lngLat: endLngLat } = endPosition;

        if (!startFloor || !startLngLat || !endFloor || !endLngLat) {
            console.warn('renderNavi: 缺少参数');
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
                to_floor: endFloor,
            },
        });

        const data = this._getNaviRouteByFloorId(this._map.currentFloor);
        this._addLayer(data, { type: 'FeatureCollection', features: [] });
    }

    _addLayer(data, walkedData) {
        if (!data) {
            return;
        }
        const layer = this.mapView.getLayer(this._options.layerName);
        const source = this.mapView.getSource(layer.source);
        source.setData(data);

        const walkedLayer = this.mapView.getLayer(this._options.walkedLayerName);
        const walkedSource = this.mapView.getSource(walkedLayer.source);
        walkedSource.setData(walkedData);
    }

    _getNaviRouteByFloorId(floorId) {
        if (!this._rawFC) {
            return { type: 'FeatureCollection', features: [] };
        }
        const { features } = this._rawFC;
        const arr = [];
        for (let i = 0; i < features.length; i += 1) {
            const item = features[i];
            if (item.properties.floor === floorId) {
                const { coordinates } = item.geometry;
                const coord1 = coordinates[0];
                const lngLat1 = Geometry.transToLngLat({ x: coord1[0], y: coord1[1] });
                const coord2 = coordinates[1];
                const lngLat2 = Geometry.transToLngLat({ x: coord2[0], y: coord2[1] });
                arr.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [lngLat1.lng, lngLat1.lat],
                            [lngLat2.lng, lngLat2.lat],
                        ],
                    },
                });
            }
        }

        return { type: 'FeatureCollection', features: arr };
    }

    setWalkedLngLat(floorId, lngLat, index) {
        const { features: list } = this._getNaviRouteByFloorId(floorId);
        const walkedFeatures = list.slice(0, index);
        walkedFeatures.push({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [list[index].geometry.coordinates[0], [lngLat.lng, lngLat.lat]],
            },
        });
        const features = list.slice(index + 1);

        features.unshift({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [[lngLat.lng, lngLat.lat], list[index].geometry.coordinates[1]],
            },
        });

        this._addLayer(
            { type: 'FeatureCollection', features },
            { type: 'FeatureCollection', features: walkedFeatures },
        );
    }

    setAllWalked() {
        const floorOrder = this.getFloorOrder();
        const { features } = this._getNaviRouteByFloorId(floorOrder[floorOrder.length - 1]);
        this._addLayer(
            { type: 'FeatureCollection', features: [] },
            { type: 'FeatureCollection', features },
        );
    }

    getClosestLngLat(floorId, lngLat) {
        if (!this._rawFC) {
            throw new Error('please ues it after renderNavi');
        }
        const coord = Geometry.transToWgs(lngLat);
        const arr = [];
        const { features } = this._rawFC;
        for (let i = 0; i < features.length; i += 1) {
            if (features[i].properties.floor === floorId) {
                const line = features[i].geometry.coordinates;
                const projection = Geometry.getProjection([coord.x, coord.y], line);
                arr.push({ ...projection, index: i });
            }
        }

        arr.sort((a, b) => a.dis - b.dis);
        const closestLngLat = Geometry.transToLngLat(arr[0].coord);
        // this.setWalkedLngLat(floorId, closestLngLat, arr[0].index);

        return { lngLat: closestLngLat, index: arr[0].index, coord: arr[0].coord };
    }

    getFloorOrder() {
        if (!this._rawFC) {
            return [];
        }
        const { features } = this._rawFC;
        const map = {};
        const arr = [];
        for (let i = 0; i < features.length; i += 1) {
            const floorId = features[i].properties.floor;
            if (!map[floorId]) {
                arr.push(floorId);
                map[floorId] = true;
            }
        }

        return arr;
    }

    removeLayer() {
        const layer = this.mapView.getLayer(this._options.layerName);
        const source = this.mapView.getSource(layer.source);
        const emptyData = { type: 'FeatureCollection', features: [] };
        source.setData(emptyData);

        const walkedLayer = this.mapView.getLayer(this._options.walkedLayerName);
        const walkedSource = this.mapView.getSource(walkedLayer.source);
        walkedSource.setData(emptyData);

        delete this._rawFC;
    }

    getRawFC() {
        return this._rawFC && { ...this._rawFC };
    }

    getLines(floorId) {
        if (!this._rawFC) {
            return [];
        }

        const { features } = this._rawFC;
        const arr = [];
        for (let i = 0; i < features.length; i += 1) {
            if (features[i].properties.floor === floorId) {
                arr.push(features[i].geometry.coordinates);
            }
        }

        return arr;
    }

    hasNaviLine() {
        return Boolean(this._rawFC);
    }

    destroy() {
        this._map.off('changeFloor', this._onChangeFloor);

        delete this._map;
    }

    get mapView() {
        return this._map.mapView;
    }
}

export default NaviManager;
