import Control from './Control';
import styles from '../ngr.css';
import { createElement } from '../dom/DOM';
import { bindAll } from '../utils/utils';
import imgIcon from '../assets/ic_map_compass.png';

const defaultOptions = {
    position: 'top-left',
    isAutoHide: true,
};

class CompassControl extends Control {
    constructor(options = {}) {
        const opts = { ...defaultOptions, ...options };
        super('compass', opts);
        bindAll([
            '_onUpdate',
        ], this);
        this._container = createElement('div', { className: styles.compass });
        this._icon = createElement('img', { src: imgIcon });

        this._icon.addEventListener('click', () => {
            this._map.easeTo({ bearing: 0 });
        });

        this._container.appendChild(this._icon);

        this.hide();
    }

    hide() {
        this._options.isAutoHide && super.hide();
    }

    _onUpdate() {
        const rotate = this.mapView.getBearing();

        this._icon.style.transform = `rotate(${-rotate}deg)`;

        if (rotate === 0) {
            this.hide();
        } else {
            this.show();
        }
    }

    addTo(map) {
        super.addTo(map);

        this.mapView.on('rotate', this._onUpdate);
        this._map.once('loading', this._onUpdate);
    }

    destroy() {
        super.destroy();

        this.mapView.off('rotate', this._onUpdate);
        this._map.off('loading', this._onUpdate);
    }
}

export default CompassControl;
