import Control from './Control';
import { createElement } from '../dom/DOM';
import styles from '../ngr.css';
import { bindAll } from '../utils/utils';
import logoIcon from '../assets/logo.png';

const defaultOptions = {
    position: 'bottom-left',
    maxWidth: 100,
};

class ScaleControl extends Control {
    constructor(options = {}) {
        const opts = { ...defaultOptions, ...options };
        super('scale', opts);

        bindAll([
            '_onUpdate',
        ], this);

        this._container = createElement('div', { className: styles.scaleControl });

        this._scale = createElement('div', { className: styles.scale });
        this._scaleImg = createElement('img', { src: logoIcon });

        this._container.appendChild(this._scale);
        this._container.appendChild(this._scaleImg);
    }

    _onUpdate() {
        if (this._timer) {
            clearTimeout(this._timer);
            delete this._timer;
        }
        const { maxWidth } = this._options;
        const y = this.mapView._container.clientHeight / 2;
        const p1 = this.mapView.unproject([0, y]);
        const p2 = this.mapView.unproject([maxWidth, y]);
        const maxMeters = ScaleControl.getDistance(p1, p2);
        this._setScale(maxMeters);

        this._scale.style.display = '';
        this._scaleImg.style.display = 'none';
        this._timer = setTimeout(() => {
            this._scaleImg.style.display = '';
            this._scale.style.display = 'none';
        }, 1 * 1000);
    }

    _setScale(maxDistance) {
        const { maxWidth } = this._options;
        let distance = ScaleControl.getRoundNum(maxDistance);
        const ratio = distance / maxDistance;
        let unit = 'm';
        if (distance > 1000) {
            unit = 'km';
            distance /= 1000;
        }

        this._scale.style.width = `${maxWidth * ratio}px`;
        this._scale.textContent = distance + unit;
    }

    addTo(map) {
        super.addTo(map);

        this.mapView.on('move', this._onUpdate);
        this._map.once('loading', this._onUpdate);
    }

    destroy() {
        super.destroy();

        this.mapView.off('move', this._onUpdate);
        this._map.off('loading', this._onUpdate);
    }
    /* eslint-disable */
    static getDistance(latlng1, latlng2) {
        const R = 6371000;

        const rad = Math.PI / 180,
            lat1 = latlng1.lat * rad,
            lat2 = latlng2.lat * rad,
            a = Math.sin(lat1) * Math.sin(lat2) +
                Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);

        const maxMeters = R * Math.acos(Math.min(a, 1));
        return maxMeters;
    }

    static getRoundNum(num) {
        const pow10 = Math.pow(10, (`${Math.floor(num)}`).length - 1);
        let d = num / pow10;
    
        d = d >= 10 ? 10 :
            d >= 5 ? 5 :
            d >= 3 ? 3 :
            d >= 2 ? 2 : 1;
    
        return pow10 * d;
    }
}

export default ScaleControl;
