import mapboxgl from 'mapbox-gl';
import { createElement } from '../dom/DOM';
import { bindAll } from '../utils/utils';

const defaultOptions = {
    offset: [0, 0],
    size: [50, 50],
    isPlane: true,
};

class OverlayMarker {
    _lngLat = new mapboxgl.LngLat(0, 0);
    constructor(iconUrl, options) {
        this._options = { ...defaultOptions, ...options };
        bindAll([
            '_onPitch',
            '_onChangeFloor',
        ], this);
        const domContainer = createElement('div');
        this._iconDom = createElement('img', {
            src: iconUrl,
        });
        this._iconDom.style.width = `${this._options.size[0]}px`;
        this._iconDom.style.height = `${this._options.size[1]}px`;
        domContainer.appendChild(this._iconDom);

        this._marker = new mapboxgl.Marker(domContainer, this._options);
        this._marker.setLngLat(this._lngLat);
    }

    _onPitch() {
        const pitch = this.mapView.getPitch();
        this.setPitch(pitch);
    }

    _onChangeFloor() {
        this.setPosition(this.currentFloor, this._lngLat);
    }

    addTo(map) {
        this._map = map;
        this._map.on('changeFloor', this._onChangeFloor);
        this._marker.addTo(this.mapView);

        if (this._options.isPlane) {
            this.setPitch(this.mapView.getPitch());
            this.mapView.on('pitch', this._onPitch);
        }
    }

    remove() {
        this._map.off('changeFloor', this._onChangeFloor);
        if (this._options.isPlane) {
            this.mapView.off('pitch', this._onPitch);
        }
        this._marker.remove();

        delete this._marker;
        delete this._map;
    }

    setPosition(floorId, lngLat) {
        if (!floorId || !lngLat) {
            return;
        }

        this.currentFloor = floorId;
        this._lngLat = new mapboxgl.LngLat(lngLat.lng, lngLat.lat);

        if (floorId === this._map.currentFloor) {
            this.show();
            this._marker.setLngLat(lngLat);
        } else {
            this.hide();
        }
    }

    setProperties(properties) {
        this._properties = properties;
    }

    getProperties() {
        return this._properties;
    }

    hide() {
        this._marker.getElement().style.display = 'none';
    }

    show() {
        this._marker.getElement().style.display = '';
    }

    setRotate(angle) {
        this._rotate = angle;
        this._iconDom.style.transform = `rotateX(${this._pitch || 0}deg) rotateZ(${this._rotate || 0}deg) `;
    }

    getRotate() {
        return this._rotate;
    }

    setPitch(pitch) {
        this._pitch = pitch;
        this._iconDom.style.transform = `rotateX(${this._pitch || 0}deg) rotateZ(${this._rotate || 0}deg) `;
    }

    getPitch() {
        return this._pitch;
    }

    getPosition() {
        return {
            currentFloor: this.currentFloor,
            lngLat: this._lngLat.wrap(),
        };
    }

    get mapView() {
        return this._map.mapView;
    }
}

export default OverlayMarker;
