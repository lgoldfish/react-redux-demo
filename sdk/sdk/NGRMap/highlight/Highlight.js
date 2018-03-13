import Geometry from '../geometry/Geometry';
import { bindAll } from '../utils/utils';

const defaultOptions = {
    layerName: 'highlight',
};

class Highlight {
    _floorDataMap = { };
    _name = 'highlight';
    constructor(options = {}) {
        this._option = { ...defaultOptions, ...options };
        bindAll([
            '_onChangeFloor',
        ], this);
    }

    _onChangeFloor() {
        const floorId = this._map.currentFloor;

        this._setHighlightData(this._floorDataMap[floorId]);
    }

    _setHighlightData(data = []) {
        if (this._map.mapStatus !== 'loaded') {
            return;
        }
        const layer = this.mapView.getLayer(this._option.layerName);
        const source = this.mapView.getSource(layer.source);
        source && source.setData({ type: 'FeatureCollection', features: data });
    }

    addTo(map) {
        this._map = map;
        this._map.on('changeFloor', this._onChangeFloor);
    }

    destroy() {
        this._map.off('changeFloor', this._onChangeFloor);

        delete this._map;
    }

    highlight(lngLat) {
        if (!this._map) {
            throw new Error('highlight: please use it after addTo');
        }
        if (!lngLat) {
            return;
        }
        const point = this.mapView.project(lngLat);
        const features = this.mapView.queryRenderedFeatures(point, { layers: ['Area'] });
        features.sort((a, b) => b.properties.shapelevel - a.properties.shapelevel);
        if (features.length === 0) {
            return;
        }
        const feature = features[0].toJSON();
        const data = {
            type: feature.type,
            properties: feature.properties,
            geometry: feature.geometry,
        };
        const arr = this._floorDataMap[this._map.currentFloor] || [];
        arr.push(data);
        this._floorDataMap[this._map.currentFloor] = arr;
        this._setHighlightData(arr);
        this.curHighlightId = feature.properties.id;
    }

    cancel(id) {
        if (!id) {
            this._setHighlightData([]);
            this._floorDataMap = {};
        } else {
            for (const key in this._floorDataMap) {
                const arr = this._floorDataMap[key];
                for (let i = arr.length - 1; i >= 0; i -= 1) {
                    if (arr[i].properties.id === id) {
                        arr.splice(i, 1);
                    }
                }
            }

            this._setHighlightData(this._floorDataMap[this._map.currentFloor]);
        }
    }

    getIds() {
        return this._highlightIds;
    }

    getName() {
        return this._name;
    }

    get mapView() {
        return this._map.mapView;
    }

}

export default Highlight;
