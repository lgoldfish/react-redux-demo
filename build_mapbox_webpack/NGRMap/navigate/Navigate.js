import NCore from '../core/NCore';
import CanvasMarker from '../marker/CanvasMarker';
import OverlayMarker from '../marker/OverlayMarker';
import NaviManager from './NaviManager';
import DynamicNaviManager from './DynamicNaviManager';
import AudioProvider from './AudioProvider';
import { tip, loading, hideLoading } from '../utils/tool';
import { bindAll } from '../utils/utils';
import { sleep } from '../utils/lang';
import AnimatorFactory from '../animate/AnimatorFactory';
import Geometry from '../geometry/Geometry';

import NGRMap from '../NGRMap';

const defaultOptions = {
    navi: {},
    restRotateDistance: 0.5,
    navigatingPitch: 60,
    navigatingZoom: 21.7,
    hideControlByNavigating: ['view', 'floor', 'locate'], // 导航时应当被隐藏的 domControl
    autoMove: true,
    // 路网吸附阈值
    maxRoadAttachDistance: 8,
    // 重新规划路线阈值
    maxDistanceReInitNavi: 10,
    // 终点到达阈值
    maxDistanceArriving: 6,
    // 终点提示阈值
    maxDistanceArriveTip: 15,
    changeFloorTime: 800,

    fitPadding: 120,
};

class Navigate extends NCore {
    _name = 'navigate';
    _markers = {};
    _navigateStatus = 'init';
    constructor(options = {}) {
        super();
        this._options = { ...defaultOptions, ...options };
        bindAll([
            'locationChange',
            '_onChangeFloor',
        ], this);
        this._audioProvider = new AudioProvider();
    }

    _onChangeFloor() {
        if (this._navigateStatus === 'init' && this._naviMng.hasNaviLine()) {
            const { lngLat, zoom } = this._naviMng.getFitByNavi(this._options.fitPadding);
            if (lngLat && zoom) {
                this._map.easeTo({ center: lngLat, zoom, bearing: 0, pitch: 0 });
            }
        }
    }

    addTo(map) {
        if (!(map instanceof NGRMap)) {
            throw new Error('addTo: a NRGMap instance is required');
        }
        this._map = map;
        this._map.on('changeFloor', this._onChangeFloor);
        const dynamicOptions = {
            autoMove: this._options.autoMove,
            restRotateDistance: this._options.restRotateDistance,
        };
        this._dynamicMng = new DynamicNaviManager(this._map, dynamicOptions);
        this._naviMng = new NaviManager(this._map, this._options.navi);
    }

    setPickMarker(floorId, lngLat, properties) {
        if (!floorId || !lngLat) {
            console.warn('setPickMarker: failed, floorId and lngLat is required');
            return;
        }
        this._setMarker('pick', floorId, lngLat);
        this.getMarker('pick').setProperties(properties);
    }

    setStartMarker(floorId, lngLat, properties) {
        if (!floorId || !lngLat) {
            console.warn('setStartMarker: failed, floorId and lngLat is required');
            return;
        }
        this._setMarker('start', floorId, lngLat);
        this.getMarker('start').setProperties(properties);
    }

    setEndMarker(floorId, lngLat, properties) {
        if (!floorId || !lngLat) {
            console.warn('setEndMarker: failed, floorId and lngLat is required');
            return;
        }
        this._setMarker('end', floorId, lngLat);
        this.getMarker('end').setProperties(properties);
    }

    _setMarker(name, floorId, lngLat) {
        const marker = this.getMarker(name);
        if (marker) {
            marker.setPosition(floorId, lngLat);
        } else {
            let tempMarker;
            const { url, options, type } = this.getMarkerConfig(name);
            if (type === 'layer') {
                tempMarker = new CanvasMarker(name, options);
            } else if (type === 'overlay') {
                tempMarker = new OverlayMarker(url, options);
            }
            tempMarker.addTo(this._map);
            tempMarker.setPosition(floorId, lngLat);
            this._markers[name] = tempMarker;
        }
    }

    getWholeDistance() {
        let dis = 0;
        const segments = this._dynamicMng._segments;
        for (let i = 0; i < segments.length; i += 1) {
            dis += segments[i]._distance;
        }
        return dis;
    }

    _preNavigating() {
        const { hideControlByNavigating } = this._options;
        for (let i = 0; i < hideControlByNavigating.length; i += 1) {
            this._map.hideDomControl(hideControlByNavigating[i]);
        }
        this._map.setIsReset(false);
    }

    async simulateNavigate() {
        if (!this._naviMng.hasNaviLine()) {
            throw new Error('simulateNavigate: please use it after initNavi');
        }
        this._navigateStatus = 'simulateNavigate';
        // 隐藏定位点
        this.playMessage('模拟导航开始');
        this._fireNavigatingInfo(0);

        this._preNavigating();
        const floorOrder = this._naviMng.getFloorOrder();
        if (this._map.currentFloor !== floorOrder[0]) {
            this._map.setCurrentFloor(floorOrder[0]);
            await sleep(this._options.changeFloorTime);
        }
        this._locationMng && this._locationMng.hide();
        const lines = this._naviMng.getLines(floorOrder[0]);
        const firstLngLat = Geometry.transToLngLat({ x: lines[0][0][0], y: lines[0][0][1] });
        this._setMarker('sim', floorOrder[0], firstLngLat);
        this._map.easeTo({
            center: firstLngLat,
            zoom: this._options.navigatingZoom,
            pitch: this._options.navigatingPitch,
            bearing: this._dynamicMng.crtSegment._rotate,
            duration: 3000,
        });

        await sleep(3000);

        this._simNavigate(floorOrder);
    }

    async _simNavigate(floorOrder) {
        const lines = this._naviMng.getLines(this._map.currentFloor);
        const { features } = this._naviMng.getRawFC();
        let beforeIndex = 0;
        for (let i = 0; i < features.length; i += 1) {
            if (features[i].properties.floor === this._map.currentFloor) {
                beforeIndex = i;
                break;
            }
        }
        let index = 0;
        const animate = () => {
            if (this._navigateStatus !== 'simulateNavigate') {
                return;
            }
            const p1 = { x: lines[index][0][0], y: lines[index][0][1] };
            const p2 = { x: lines[index][1][0], y: lines[index][1][1] };
            const startLngLat = Geometry.transToLngLat(p1);
            const endLngLat = Geometry.transToLngLat(p2);
            const distance = this._dynamicMng._segments[index]._distance;
            let speed = 2;
            if (distance <= 8) {
                speed = 1;
            }
            const time = Math.round(distance / speed) * 1000;

            let lastTime = Date.now();
            this._dynamicMng.findNearSegment(index + beforeIndex, startLngLat);
            const msg = this._fireNavigatingInfo(index, startLngLat);
            this._audioProvider.playMessage(msg.message, true);

            this.animator = AnimatorFactory.getInstance().ofObject(p1, p2, time);
            // speed === 4 && this.animator.easing(this.animator.Easing.Quadratic.InOut);
            this._map.easeTo({
                duration: time - 16,
                center: endLngLat,
                easing: (e) => {
                    this._navigateStatus !== 'simulateNavigate' && this._map.stop();
                    return e;
                },
            });
            this.animator.on('update', (value) => {
                if (this._navigateStatus !== 'simulateNavigate') {
                    return;
                }
                const lngLat = Geometry.transToLngLat(value);
                this._naviMng.setWalkedLngLat(this._map.currentFloor, lngLat, index);
                this.getMarker('sim').setPosition(this._map.currentFloor, lngLat);
                // for navigating info
                if (Date.now() - lastTime > 1000) {
                    lastTime = Date.now();
                    this._dynamicMng.findNearSegment(index + beforeIndex, lngLat, false);
                    this._fireNavigatingInfo(index, lngLat);
                    const info = this._dynamicMng.getMessageInNavi();
                    if (info.isWillChange && !this._isPlayWill) {
                        this._audioProvider.playMessage(info.message);
                        this._isPlayWill = true;
                    }
                }
            }).on('complete', async () => {
                delete this.animator;
                this._isPlayWill = false;
                if (this._navigateStatus !== 'simulateNavigate') {
                    return;
                }
                index += 1;
                if (lines[index]) {
                    // 旋转地图到下一段导航线
                    this._map.stop();
                    this._dynamicMng.findNearSegment(index + beforeIndex, endLngLat);
                    this._fireNavigatingInfo(index, endLngLat);
                    sleep(600).then(animate);
                } else if (floorOrder[floorOrder.length - 1] === this._map.currentFloor) {
                    this._endNavigate(true);
                } else {
                    for (let i = 0; i < floorOrder.length; i += 1) {
                        if (floorOrder[i] === this._map.currentFloor) {
                            if (this._navigateStatus !== 'simulateNavigate' || !floorOrder[i + 1]) {
                                return;
                            }
                            this._map.setCurrentFloor(floorOrder[i + 1]);
                            const nextLines = this._naviMng.getLines(floorOrder[i + 1]);
                            const nextCoord = { x: nextLines[0][0][0], y: nextLines[0][0][1] };
                            this.mapView.setZoom(this._options.navigatingZoom);
                            this.mapView.setPitch(this._options.navigatingPitch);
                            const nextLngLat = Geometry.transToLngLat(nextCoord);
                            this.mapView.setCenter(nextLngLat);
                            sleep(this._options.changeFloorTime).then(() => {
                                this._simNavigate(floorOrder);
                                this._locationMng && this._locationMng.hide();
                            });

                            return;
                        }
                    }
                }
            }).start();
        };

        animate();
    }

    _fireNavigatingInfo(index, lngLat) {
        const msg = this._dynamicMng.getMessageInNavi();
        const distanceToEnd = this._dynamicMng.distanceToEnd(index, lngLat);
        this.fire('navigatingInfo', { ...msg, distanceToEnd });

        return msg;
    }

    locationChange({ floorId, lngLat }) {
        if (this._navigateStatus === 'navigating') {
            // 处于动态导航
            this._dynamicNavigate(floorId, lngLat);
            return;
        }
        if (this._navigateStatus !== 'simulateNavigate') {
            // 正常模式下
            this._locationMng.setPosition(floorId, lngLat);
        }
    }

    _dynamicNavigate(floorId, lngLat) {
        if (!floorId || !lngLat) {
            return;
        }

        if (this._isInitNavi) {
            this._locationMng.setPosition(floorId, lngLat);
            return;
        }

        if (floorId !== this._map.currentFloor) {
            this._map.setCurrentFloor(floorId);
            return;
        }
        const floorOrder = this._naviMng.getFloorOrder();
        if (floorOrder.indexOf(floorId) === -1) {
            this._reInitNavi({ currentFloor: floorId, lngLat });
        }

        const {
            coord: closestCoord,
            lngLat: closestLngLat,
            index: closestIndex,
        } = this._naviMng.getClosestLngLat(floorId, lngLat);

        const distanceToEnd = this._dynamicMng.distanceToEnd(closestIndex, closestLngLat);
        // 判断导航是否结束
        if (distanceToEnd < this._options.maxDistanceArriving) {
            const { features } = this._naviMng.getRawFC();
            const [endX, endY] = features[features.length - 1].geometry.coordinates[1];
            const endLngLat = Geometry.transToLngLat({ x: endX, y: endY });
            // 触发导航结束事件
            this._endNavigate(true);
            this._locationMng.setPosition(floorId, endLngLat, true);
            this._map.easeTo({ center: endLngLat, duration: 300 });
            this._naviMng.setAllWalked();
            return;
        }

        if (distanceToEnd < this._options.maxDistanceArriveTip && !this._isTipEnd) {
            const message = '您已接近目的地，请留意';
            tip(message);
            this._audioProvider.playMessage(message);
            this._isTipEnd = true;
        }
        const coord = Geometry.transToWgs(lngLat);
        const distance = Geometry.getDistance([coord.x, coord.y], [closestCoord.x, closestCoord.y]);
        if (distance <= this._options.maxRoadAttachDistance) {
            // 正常吸附
            const oldIndex = this._dynamicMng._crtIndex;
            this._dynamicMng.findNearSegment(closestIndex, closestLngLat);
            const naviInfo = this._dynamicMng.getMessageInNavi();
            if (oldIndex !== this._dynamicMng._crtIndex) {
                this._audioProvider.playMessage(naviInfo.message);
                this._isPlayWill = false;
            } else if (naviInfo.isWillChange && !this._isPlayWill) {
                this._audioProvider.playMessage(naviInfo.message);
                this._isPlayWill = true;
            }
            this.fire('navigatingInfo', { ...naviInfo, distanceToEnd });
            this._locationMng.setPosition(floorId, closestLngLat, true);
            this._map.easeTo({ center: closestLngLat, duration: 300 });
            this._naviMng.setWalkedLngLat(floorId, closestLngLat, closestIndex);
        } else if (distance <= this._options.maxDistanceReInitNavi) {
            // 提示偏航
            const message = '您已偏离路线请留意';
            tip(message);
            this._audioProvider.playMessage(message);
            this.fire('navigatingInfo', { message, distanceToEnd });
            this._locationMng.setPosition(floorId, lngLat, true);
            this._map.easeTo({ center: lngLat, duration: 300 });
        } else {
            // 重新规划
            this._reInitNavi({ currentFloor: floorId, lngLat });
            this._locationMng.setPosition(floorId, lngLat, true);
            this._map.easeTo({ center: lngLat, duration: 300 });
        }
    }

    async _reInitNavi(startPosition) {
        const endPosition = this.getMarker('end').getPosition();
        const message = '您已偏离路线，正在为您重新规划路线';
        tip(message);
        this._audioProvider.playMessage(message);
        await this._renderNavi(startPosition, endPosition);

        this._dynamicNavigate(startPosition.currentFloor, startPosition.lngLat);
    }

    validNavi() {
        const startMarker = this.getMarker('start');
        const endMarker = this.getMarker('end');

        if (!startMarker || !endMarker) {
            throw new Error('validNavi: please use it after set start and end marker');
        }

        const startPosition = startMarker.getPosition();
        const endPosition = endMarker.getPosition();

        return this._naviMng.validNavi(startPosition, endPosition);
    }

    async initNavi() {
        const startMarker = this.getMarker('start');
        const endMarker = this.getMarker('end');

        if (!startMarker || !endMarker) {
            throw new Error('initNavi: please use it after set start and end marker');
        }
        const startPosition = startMarker.getPosition();
        const endPosition = endMarker.getPosition();

        await this._renderNavi(startPosition, endPosition);

        const { lngLat, zoom } = this._naviMng.getFitByNavi(this._options.fitPadding);
        this._map.easeTo({ center: lngLat, zoom, bearing: 0, pitch: 0 });
    }

    async _renderNavi(startPosition, endPosition) {
        this._isInitNavi = true;
        loading();
        try {
            await this._naviMng.renderNavi(startPosition, endPosition);
            this._dynamicMng.setFeatureCollection(this._naviMng.getRawFC());
        } catch (error) {
            tip('渲染导航线失败，请您重试！');
            throw error;
        } finally {
            this._isInitNavi = false;
            hideLoading();
        }
    }

    setLocationManager(locationMng) {
        this._locationMng = locationMng;
        this._locationMng.on('locationChange', this.locationChange);
    }

    removeLocationManager() {
        if (!this._locationMng) {
            return;
        }
        this._locationMng.off('locationChange', this.locationChange);
        delete this._locationMng;
    }

    setMarkerConfig(markerConfig) {
        this._markerConfig = markerConfig;
    }

    getMarkerConfig(name) {
        if (this._markerConfig) {
            return this._markerConfig[name] || {};
        }

        return { type: 'layer', options: {} };
    }

    async startNavigate() {
        if (!this._locationMng) {
            throw new Error('startNavigate: please use it after setLocationManager');
        }

        if (!this._naviMng.hasNaviLine()) {
            throw new Error('startNavigate: initNavi is necessary use before');
        }

        this._preNavigating();
        const { currentFloor: startFloor } = this.getMarker('start').getPosition();
        if (startFloor !== this._map.currentFloor) {
            this._map.setCurrentFloor(startFloor);
            await sleep(this._options.changeFloorTime);
        }
        const [x, y] = this._naviMng.getLines(this._map.currentFloor)[0][0];
        const curPosition = this._locationMng.getPosition();
        this._map.easeTo({
            center: Geometry.transToLngLat({ x, y }),
            zoom: this._options.navigatingZoom,
            pitch: this._options.navigatingPitch,
            bearing: this._dynamicMng.crtSegment._rotate,
            duration: 1000,
        });
        const info = this._dynamicMng.getMessageInNavi();
        this._audioProvider.playMessage(`开始导航，${info.message}`);
        this._dynamicNavigate(curPosition.currentFloor, curPosition.lngLat);
        await sleep(1000);
        this._navigateStatus = 'navigating';
    }

    getMarker(name) {
        return this._markers[name];
    }

    removeMarker(name) {
        const marker = this.getMarker(name);
        if (marker) {
            marker.remove();
            delete this._markers[name];
        }
    }

    updateMarker(oldName, newName) {
        const oldMarker = this.getMarker(oldName);
        if (!oldMarker) {
            throw new Error('updateMarker: oldMarker is not exit');
        }

        const position = oldMarker.getPosition();
        const properties = oldMarker.getProperties();

        this._setMarker(newName, position.currentFloor, position.lngLat);
        this.removeMarker(oldName);
        this.getMarker(newName).setProperties(properties);
    }

    reset() {
        this.removeMarker('pick');
        this.removeMarker('start');
        this.removeMarker('end');
        this.removeMarker('sim');
        this._naviMng.removeLayer();

        this.fire('reset');
    }

    _endNavigate(isCompleteNavigate) {
        // 恢复状态位
        this._isPlayWill = false; // 判断拐点处信息是否提示
        this._isTipEnd = false; // 判断是否提示用户快要到达终点
        this._navigateStatus = 'init';
        const { hideControlByNavigating } = this._options;
        for (let i = 0; i < hideControlByNavigating.length; i += 1) {
            this._map.showDomControl(hideControlByNavigating[i]);
        }
        this._map.setIsReset(true);
        if (isCompleteNavigate) {
            this.fire('navigateEnd');
            this._audioProvider.playMessage('您已到达目的地，导航结束！');
        }

        const { lngLat, zoom } = this._naviMng.getFitByNavi(this._options.fitPadding);
        if (lngLat && zoom) {
            this._map.easeTo({ center: lngLat, zoom, bearing: 0, pitch: 0 });
        } else {
            this._map.easeTo({ bearing: 0, pitch: 0 });
        }
    }

    endNavigate() {
        // 移除图标
        this.reset();
        this._endNavigate();
        // 显示定位点
        this._locationMng && this._locationMng.show();
        if (this.animator) {
            this.animator.stop();
            delete this.animator;
        }
    }

    getName() {
        return this._name;
    }

    destroy() {
        this._naviMng.destroy();
        this.removeLocationManager();
        delete this._naviMng;
        delete this._map;
    }

    closeAudio() {
        this._audioProvider.close();
    }

    openAudio() {
        this._audioProvider.open();
    }

    playMessage(msg) {
        this._audioProvider.playMessage(msg);
    }

    get mapView() {
        return this._map.mapView;
    }
}

export default Navigate;
