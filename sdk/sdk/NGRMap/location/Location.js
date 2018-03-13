import mapboxgl from 'mapbox-gl';
import NCore from '../core/NCore';
import OverlayMarker from '../marker/OverlayMarker';
import { bindAll } from '../utils/utils';
import AnimatorFactory from '../animate/AnimatorFactory';
import BleManager from './BleManager';
import request from '../request/request';
import { tip } from '../utils/tool';
import { isFunction } from '../utils/lang';
import Geometry from '../geometry/Geometry';

const defaultOptions = {
    appId: '',
    signatureUrl: '',
    bleType: 'wx',
    locationUrl: '',
    markerUrl: 'assets/marker/ic_position.svg',
    markerSize: [60, 60],
    markerOffset: [0, 0],
};

const userIdName = 'medical_hash_userIdName';

let userId;
if (localStorage[userIdName]) {
    userId = localStorage[userIdName];
} else {
    userId = Date.now().toString(16) + Math.random().toString().slice(2);
    localStorage[userIdName] = userId;
}

class Location extends NCore {
    _name = 'location';
    _zeroNum = 0; // 定位结果为 0 的次数
    _locationRes = { floorId: 0, lngLat: { lng: 0, lat: 0 } };
    isCanAutoChangeFloor = true;
    constructor(options = {}) {
        super();
        bindAll([
            '_serverLocation',
        ], this);
        this._options = { ...defaultOptions, ...options };
        this._bleMng = new BleManager(this._options);
        this._bleMng.onSearchBeacons(this._serverLocation);

        // 惯导
        window.addEventListener('devicemotion', (e) => {
            const { x, y, z } = e.acceleration;
            if (x && y && z) {
                const num = Math.sqrt((x * x) + (y * y) + (z * z));
                if (num < 0.48) {
                    this.move = 0;
                } else {
                    this.move = 1;
                }
            }
        }, false);

        this.rotateTime = Date.now();
        window.addEventListener('deviceorientation', (e) => {
            // 确保是在地图加载完成后 旋转

            if (Date.now() - this.rotateTime <= 16) {
                return;
            }

            this.rotateTime = Date.now();
            let angle;
            if (e.webkitCompassHeading) {
                angle = e.webkitCompassHeading;
            } else {
                angle = 360 - e.alpha;
            }
            this.setRotate(angle);
        });


        // is ios or android
        const { userAgent } = navigator;
        if (userAgent.toLowerCase().indexOf('iphone') !== -1) {
            this.terminalType = 1;
        } else {
            this.terminalType = 0;
        }
    }

    async _serverLocation(beacons) {
        const ble = [];
        for (let i = 0; i < beacons.length; i += 1) {
            ble.push({
                mac: `${beacons[i].major}:${beacons[i].minor}`,
                rssi: beacons[i].rssi,
                accuracy: beacons[i].accuracy,
                txpower: beacons[i].txpower,
            });
        }
        this.fire('beacons', ble);
        if (ble.length === 0) {
            return;
        }
        const json = { ble, userid: userId, move: this.move, sys: this.terminalType };
        const { locationUrl } = this._options;
        if (this.timer) {
            clearTimeout(this.timer);
            delete this.timer;
        }
        this.timer = setTimeout(() => {
            tip('检测到您附近蓝牙信号弱');
        }, 10 * 1000);
        let locationRes;
        try {
            locationRes = await request.post(locationUrl, { json, timeout: 1000 });
        } catch (error) {
            console.error(error);
            if (!this._isTipTimeout) {
                this._isTipTimeout = true;
                // tip('您当前网络环境较差，定位延时较大');
            }
        }
        if (locationRes.floor === '0') {
            this._zeroNum += 1;
            // 连续 5 次定位结果为 0
            if (this._zeroNum >= 5) {
                this._zeroNum = 0;
                this._locationRes = {
                    floorId: 0,
                    lngLat: { lng: 0, lat: 0 },
                };
            }
        } else {
            this._zeroNum = 0;
            this._locationRes = {
                floorId: locationRes.floor,
                lngLat: Geometry.transToLngLat({
                    x: Number(locationRes.x),
                    y: Number(locationRes.y),
                }),
            };
        }
        this.fire('locationChange', this._locationRes || {});
    }

    addTo(map) {
        this._map = map;
    }

    destroy() {
        delete this._bleMng;
        delete this._map;
    }

    setPosition(floorId, lngLat, isAnimate) {
        if (!this._map) {
            throw new Error('setPosition: please use it after addTo map');
        }
        if (floorId === '0' || !lngLat || !lngLat.lng || !lngLat.lat) {
            this.removeLayer();
            return;
        }
        if (floorId !== this._map.currentFloor) {
            this.isCanAutoChangeFloor && this._map.setCurrentFloor(floorId);
        }
        this._animator && this._animator.stop();
        const oldLngLat = this._lngLat;
        this._lngLat = new mapboxgl.LngLat(lngLat.lng, lngLat.lat);
        if (!this.locationMarker) {
            const markerOptions = {
                size: this._options.markerSize,
                offset: this._options.markerOffset,
            };
            this.locationMarker = new OverlayMarker(this._options.markerUrl, markerOptions);
            this.locationMarker.addTo(this._map);
        }
        if (isAnimate && oldLngLat) {
            this._animator = AnimatorFactory.getInstance().ofObject(oldLngLat, this._lngLat, 300);
            this._animator.on('update', (value) => {
                this.locationMarker.setPosition(floorId, value);
            }).on('complete', () => {
                delete this._animator;
            }).start();
        } else {
            this.locationMarker.setPosition(floorId, lngLat);
        }
    }

    hide() {
        this.locationMarker && this.locationMarker.hide();
    }

    show() {
        this.locationMarker && this.locationMarker.show();
    }

    getPosition() {
        if (this.locationMarker) {
            return this.locationMarker.getPosition();
        }
        return {
            currentFloor: 0,
            lngLat: { lng: 0, lat: 0 },
        };
    }

    setAutoChange(isCanAutoChange) {
        this.isCanAutoChangeFloor = isCanAutoChange;
    }

    hasPosition() {
        return Boolean(this.locationMarker);
    }

    setRotate(angle) {
        if (!angle || !this.locationMarker) {
            return;
        }
        const bearing = this.mapView.getBearing();
        this.locationMarker.setRotate(angle - bearing);
    }

    removeLayer() {
        if (this.locationMarker) {
            this.locationMarker.remove();
            delete this.locationMarker;
        }
    }

    getName() {
        return this._name;
    }

    get mapView() {
        return this._map.mapView;
    }
}

export default Location;
