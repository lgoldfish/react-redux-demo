import NCore from '../core/NCore';
import styles from '../ngr.css';

class Control extends NCore {
    constructor(name, options) {
        super();
        this._name = name;
        this._options = options;
    }

    getName() {
        return this._name;
    }

    hide() {
        this._container && (this._container.style.display = 'none');
    }

    addTo(map) {
        this._map = map;
        this.mapView.addControl(this);
    }

    onAdd() {
        this._container.classList.add(styles.ngrCtrl);
        return this._container;
    }

    show() {
        this._container && (this._container.style.display = '');
    }

    destroy() {
        this._container && this._container.remove();
    }

    getDefaultPosition() {
        return this._options.position;
    }

    get mapView() {
        return this._map.mapView;
    }

}

export default Control;
