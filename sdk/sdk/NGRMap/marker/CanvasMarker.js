import mapboxgl from 'mapbox-gl';
import { isNumber } from '../utils/lang';
import { bindAll } from '../utils/utils';

class CanvasMarker {
    constructor(name, options = {}) {
        if (!name) {
            throw new Error('CanvasMarker: init failed');
        }

        bindAll([
            '_onChangeFloor',
        ], this);

        this._options = options;

        this._name = name;
    }

    _onChangeFloor() {
        this.setPosition(this.currentFloor, this._lngLat);
    }

    addTo(map) {
        this._map = map;
        if (!this.mapView.getLayer(this._name)) {
            console.warn(`addTo: please config this ${this.name} layer in your style`);
            return;
        }

        this._map.on('changeFloor', this._onChangeFloor);
        this.setRotate(this._rotate);
        this.setPosition(this.currentFloor, this._lngLat);

        this.mapView.setLayoutProperty(this._name, 'icon-allow-overlap', true);
        this.mapView.setLayoutProperty(this._name, 'icon-ignore-placement', true);
        const { size } = this._options;
        if (size) {
            this.mapView.setLayoutProperty(this._name, 'icon-size', size);
        }
    }

    _setLngLat(lngLat) {
        if (!lngLat) {
            return;
        }

        const layer = this.mapView.getLayer(this._name);
        const source = this.mapView.getSource(layer.source);

        source.setData({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lngLat.lng, lngLat.lat],
                },
            }],
        });
    }

    setPosition(floorId, lngLat) {
        if (!floorId || !lngLat) {
            return;
        }

        this.currentFloor = floorId;
        this._lngLat = new mapboxgl.LngLat(lngLat.lng, lngLat.lat);
        if (!this._map) {
            return;
        }

        if (this.currentFloor === this._map.currentFloor) {
            this._setLngLat(lngLat);
        } else {
            this._hideLayer();
        }
    }

    getPosition() {
        return {
            currentFloor: this.currentFloor,
            lngLat: this._lngLat && this._lngLat.wrap(),
        };
    }

    setProperties(properties) {
        this._properties = properties;
    }

    getProperties() {
        return this._properties;
    }

    setRotate(rotate) {
        if (!isNumber(rotate)) {
            return;
        }

        this._rotate = rotate;
        if (!this._map) {
            return;
        }

        this.mapView.setLayoutProperty(this._name, 'icon-rotate', rotate);
    }

    getRotate() {
        return this._rotate;
    }

    _hideLayer() {
        const layer = this.mapView.getLayer(this._name);
        const source = this.mapView.getSource(layer.source);

        source.setData({
            type: 'FeatureCollection',
            features: [],
        });
    }

    remove() {
        this._hideLayer();

        this._map.off('changeFloor', this._onChangeFloor);
    }

    get mapView() {
        return this._map.mapView;
    }

}

export default CanvasMarker;
