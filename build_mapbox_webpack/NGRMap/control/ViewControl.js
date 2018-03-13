import Control from './Control';
import { bindAll } from '../utils/utils';
import { createElement } from '../dom/DOM';
import styles from '../ngr.css';

const defaultOptions = {
    position: 'top-right',
};

class ViewControl extends Control {
    constructor(options = {}) {
        const opts = { ...defaultOptions, ...options };
        super('view', opts);

        bindAll([
            '_onUpdate',
        ], this);

        this._container = createElement('div', {
            className: styles.view,
            textContent: '2D',
        });

        this._container.addEventListener('click', () => {
            const pitch = this.mapView.getPitch();

            this._map.easeTo({ pitch: pitch >= 45 ? 0 : 60 });
        });
    }

    _onUpdate() {
        const pitch = this.mapView.getPitch();
        this._container.textContent = pitch >= 45 ? '3D' : '2D';
    }

    addTo(map) {
        super.addTo(map);

        this.mapView.on('pitch', this._onUpdate);
        this._map.on('loading', this._onUpdate);
    }

    destroy() {
        this.mapView.off('pitch', this._onUpdate);
        this._map.off('loading', this._onUpdate);
        delete this._map;
    }

}

export default ViewControl;
