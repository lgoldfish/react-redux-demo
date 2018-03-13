import Control from './Control';
import { createElement } from '../dom/DOM';
import { bindAll } from '../utils/utils';
import styles from '../ngr.css';

const defaultOptions = {
    position: 'bottom-right',
};

class ZoomControl extends Control {
    constructor(options = {}) {
        const opts = { ...defaultOptions, ...options };
        super('zoom', opts);

        bindAll([
            '_onUpdate',
        ], this);

        this._container = createElement('div', { className: styles.zoom });

        this._zoomInBtn = createElement('button', { className: styles.zoomInBtn });
        this._zoomInBtn.addEventListener('click', () => {
            this.mapView.zoomIn();
        });
        this._zoomInBtn.appendChild(createElement('img', { src: require('../assets/zoom-in.png') }));

        this._zoomOutBtn = createElement('button', { className: styles.zoomOutBtn });
        this._zoomOutBtn.addEventListener('click', () => {
            this.mapView.zoomOut();
        });
        this._zoomOutBtn.appendChild(createElement('img', { src: require('../assets/zoom-out.png') }));
        this._container.appendChild(this._zoomInBtn);
        this._container.appendChild(this._zoomOutBtn);
    }

    _onUpdate() {
        const maxZoom = this.mapView.getMaxZoom();
        const minZoom = this.mapView.getMinZoom();

        const curZoom = this.mapView.getZoom();

        this._zoomInBtn.disabled = false;
        this._zoomOutBtn.disabled = false;

        if (Math.ceil(curZoom) >= maxZoom) {
            this._zoomInBtn.disabled = true;
        }

        if (Math.floor(curZoom) <= minZoom) {
            this._zoomOutBtn.disabled = true;
        }
    }

    addTo(map) {
        super.addTo(map);

        this.mapView.on('zoomend', this._onUpdate);
        this._map.on('loading', this._onUpdate);
    }

    destroy() {
        super.destroy();

        this.mapView.off('zoomend', this._onUpdate);
        this._map.off('loading', this._onUpdate);
        delete this._map;
    }

}

export default ZoomControl;
