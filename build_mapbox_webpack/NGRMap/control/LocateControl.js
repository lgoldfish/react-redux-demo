import { createElement } from '../dom/DOM';
import Control from './Control';
import { bindAll } from '../utils/utils';
import { sleep } from '../utils/lang';
import { tip } from '../utils/tool';
import styles from '../ngr.css';

const defaultOptions = {
    position: 'bottom-left',
    tipDuration: 4000,
    animateDuration: 500,
};

class LocateControl extends Control {
    _locateStatus = 'normal';
    constructor(options = {}) {
        const opts = { ...defaultOptions, ...options };
        super('locate', opts);
        bindAll([
            '_onMove',
        ], this);
        this._container = createElement('div', { className: styles.locate });
        this._container.addEventListener('click', async () => {
            const location = this._map.getPlugin('location');
            location.setAutoChange(true);
            location._isTipTimeout = false;
            if (location.hasPosition()) {
                const { currentFloor, lngLat } = location.getPosition();
                if (currentFloor !== this._map.currentFloor) {
                    this._map.setCurrentFloor(currentFloor);
                    await sleep(500);
                }

                switch (this._locateStatus) {
                    case 'normal':
                        this._map.easeTo({
                            center: lngLat,
                            duration: this._options.animateDuration,
                        });
                        this._locateStatus = 'center';
                        this._container.classList.remove(styles.locate3d);
                        this._container.classList.add(styles.locateCenter);
                        break;
                    case 'center':
                        this._map.easeTo({
                            bearing: (location.locationMarker.getRotate() || 0),
                            pitch: 60,
                        });
                        this._locateStatus = '3d';
                        this._container.classList.add(styles.locate3d);
                        this._container.classList.remove(styles.locateCenter);
                        break;
                    case '3d':
                        this._map.easeTo({
                            bearing: 0,
                            pitch: 0,
                        });
                        this._locateStatus = 'normal';
                        this._container.classList.remove(styles.locate3d);
                        this._container.classList.remove(styles.locateCenter);
                        break;
                    default:
                        break;
                }
            } else {
                tip(
                    [
                        '暂未获取到定位信息',
                        '1.确认蓝牙是否已打开',
                        '2.确认是否在该建筑物内',
                        '3.当前信号可能较弱,请稍后再试',
                    ],
                    this._options.tipDuration,
                );
            }
        });
    }

    _onMove() {
        this._locateStatus = 'normal';
        this._container.classList.remove(styles.locate3d);
        this._container.classList.remove(styles.locateCenter);
    }

    addTo(map) {
        super.addTo(map);
        this.mapView.on('touchstart', this._onMove);
    }

    destroy() {
        super.destroy();
        this.mapView.off('touchstart', this._onMove);
        delete this._map;
    }
}

export default LocateControl;
