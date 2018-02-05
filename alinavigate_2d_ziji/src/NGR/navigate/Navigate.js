import NCore from '../core/NCore';
import NavigateManager from './NavigateManager';
import DynamicNaviManager from './DynamicNaviManager';
import Geometry from '../geometry/Geometry';
import { validLngLat, validCoord } from '../utils/utils';
import { tip, loading, hideLoading } from '../utils/tool';
import { sleep } from '../utils/lang';
import AudioProvider from './AudioProvider';
import CanvasMarker from '../marker/CanvasMarker';
import AnimatorFactory from '../animate/AnimatorFactory';


const defaultOptions = {
    autoMove: true,
    autoPlay: true,

    simMarker: 'static/assets/my_position.png',
    simSpeed: 4,
    //路网吸附阈值
	maxRoadAttachDistance: 8,
	//重新规划路线阈值
	maxDistanceReInitNavi: 10,
	//终点到达阈值
	maxDistanceArriving: 6,
	//终点提示阈值
    maxDistanceArriveTip: 15
}

class Navigate extends NCore {
    constructor(ngrMap, options = {}) {
        if(!ngrMap ) {
            throw new Error('a NGRMap instance is required');
        }
        super();
        this._ngrMap = ngrMap;
        this._options = { ...defaultOptions, ...options };
        this._audioProvider = new AudioProvider();

        this._naviMng = new NavigateManager(this._ngrMap);
        this._dynamicNaviMng = new DynamicNaviManager(this.mapView, this._options);

        const img = document.createElement('img');
        img.src = this._options.simMarker;

        if(!this._options.autoPlay) {
            this._audioProvider.close();
        }

        window.navi = this;
        // if(process.env.NODE_ENV === 'development') {
        //     this.mapView.on('click', (e) => {
            
        //         !this.simMarker && this.setMarker(this.mapView.currentFloor, e.lngLat, 'simMarker');
        //         this.simMarker.setPosition(this.mapView.currentFloor, e.lngLat, true);
        //     })
        // }
    }

    setStartPosition(floorId, lngLat) {
        if(!floorId || !validLngLat(lngLat) ) {
            console.error('setStartPosition: failed');
            return ;
        }
        this._startPosition = { currentFloor: floorId, lngLat };
    }

    setEndPosition(floorId, lngLat) {
        if(!floorId || !validLngLat(lngLat) ) {
            console.error('setStartPosition: failed');
            return ;
        }
        this._endPosition = { currentFloor: floorId, lngLat };
    }

    /**
     * 渲染导航线进行校验
     */
    validNavi() {
        if(!this._startPosition || !this._endPosition) {
            console.error('initNavi: please use it after set(Start & End)Position');
            return ;
        }

        return this._naviMng.validNavi(this._startPosition, this._endPosition);
    }

    /**
     * 渲染导航线
     */
    async initNavi() {
        if(!this._startPosition || !this._endPosition) {
            console.error('initNavi: please use it after set(Start & End)Position');
            return ;
        }
        this.isInInitNavi = true;
        this._naviIndex = null;
        loading();
        try {
            await this._naviMng.renderNavi(this._startPosition, this._endPosition);
        } catch (e) {
            this.fire('initNaviFail', e);
        }
        hideLoading();
        const rawFC = this._naviMng.getRawFC();
        this._dynamicNaviMng.setFeatureCollection(rawFC);
        this.isInInitNavi = false;
    }

    /**
     * 定位点改变
     * @param {*} floorId 
     * @param {*} coord { x: number, y: number } wgs坐标
     */
    locateChange(floorId, coord) {
        //判断参数
        if(!floorId || !validCoord(coord)) {
            console.error('参数异常');
            return ;
        }

        //判断是否有导航线
        if(!this._naviMng.hasNaviLine()) {
            console.error('please use it after initNavi');
            return ;
        }

        const lngLat = Geometry.transToLngLat(coord);
        //判断楼层
        if(this.mapView.currentFloor !== floorId) {
            this._ngrMap.changeFloor(floorId);
            return lngLat;
        }

        //判断是否在initNavi
        if(this.isInInitNavi) {
            return lngLat;
        }

        const floorOrder = this._naviMng.getFloorOrder();
        if(floorOrder.indexOf(floorId) === -1) {
            this._startPosition.lngLat = lngLat;
            this.reInitNavi();
            return lngLat;
        }
  
        //导航吸附
        const { 
            coord: closestCoord, 
            lngLat: closestLngLat 
        } = this._naviMng.getClosestPoint(floorId, lngLat);
        const distanceToEnd = this._dynamicNaviMng.distanceToEnd(floorId, closestLngLat);
        if(distanceToEnd < this._options.maxDistanceArriving) {
            this.fire('navigateEnd');
            this._audioProvider.playMessage('您已到达目的地附近导航结束');
            this.endNavigate();
            return closestLngLat;
        }

        const distance = Geometry.getDistance([coord.x, coord.y], [closestCoord.x, closestCoord.y]);
        if(distance <= this._options.maxRoadAttachDistance) {
            //正常吸附
            this._dynamicNaviMng.findNearSegment(floorId, closestLngLat);
            const naviInfo = this._dynamicNaviMng.getMessageInNavi();
            // if(naviInfo.isWillChange) {
            //     this._audioProvider.playMessage(naviInfo.message);
            // } else {
            //     if(this._naviIndex !== this._dynamicNaviMng._crtIndex) {
            //         this._audioProvider.playMessage(naviInfo.message);
            //         this._naviIndex = this._dynamicNaviMng._crtIndex;
            //     }
            // }
            if(this._naviIndex !== this._dynamicNaviMng._audioIndex) {
                this._audioProvider.playMessage(naviInfo.message);
                this._naviIndex = this._dynamicNaviMng._audioIndex;
            }

            this.fire('navigating', naviInfo);

            return closestLngLat;
        } else if(distance <= this._options.maxDistanceReInitNavi) {
            const message = '您已偏离路线，请留意！'
            tip(message);
            this._audioProvider.playMessage(message);
            this.fire('navigating', message);
            return lngLat;
        } else {
            this._startPosition.lngLat = lngLat;
            this.reInitNavi();
            return lngLat;
        }
        return closestLngLat;
    }

    async reInitNavi() {
        const message = '您已偏离路线，正在为您重新规划路线';
        tip(message);
        this._audioProvider.playMessage(message);
        await this.initNavi();

    }

    async simulateNavigate(isNotChange) {
        if(!this._naviMng.hasNaviLine()) {
            throw new Error('simulateNavigate: please use it after initNavi');
        }

        const floorOrder = this._naviMng.getFloorOrder();
        if(this.mapView.currentFloor !== floorOrder[0] && !isNotChange) {
            //change floor;
            this._ngrMap.changeFloor(floorOrder[0]);
            await sleep(16);    
        }
        const lngLats = this._naviMng.getLngLats(this.mapView.currentFloor);
        this._isInSimulate = true;
        if(lngLats.length < 2) {
            return ;
        }
        //第一次调用；
        this.fire('navigating', this._dynamicNaviMng.getMessageInNavi());

        await this.setMarker(floorOrder[0], lngLats[0], 'simMarker');
        this.mapView.flyTo({ 
            center: lngLats[0], 
            zoom: zoom.navigating,
            pitch: 60,
            duration: 3000,
            bearing: this._dynamicNaviMng._segments[0]._rotate
        });
        await sleep(3000);
        let index = 0, lastTime = Date.now();        

        const animate = () => {
            if(!this._isInSimulate) {
                return ;
            }
            
            const p1 = Geometry.transToWgs(lngLats[index]);
            const p2 = Geometry.transToWgs(lngLats[index + 1]);
            const distance = Geometry.getDistance([p1.x, p1.y], [p2.x, p2.y]);
            let speed = 4;
            if(distance <= 8) {
                speed = 1;
            }
            const time = Math.round(distance / speed) * 1000; 
            this.mapView.easeTo({
                center: lngLats[index + 1],
                duration: time
            });
            this.animator = AnimatorFactory.getInstance().ofObject(p1, p2, time);
        
            speed === 4 && this.animator.easing(this.animator.Easing.Quadratic.InOut);
            this.animator.on('update', (coord) => {
                if(!this._isInSimulate) {
                    return ;
                }
                const value = Geometry.transToLngLat(coord);
                this.simMarker.setPosition(this.mapView.currentFloor, value);
                this.mapView.setCenter(value);
                if(Date.now() - lastTime > 1000) {
                    this._dynamicNaviMng.findNearSegment(this.mapView.currentFloor, value);
                    const info = this._dynamicNaviMng.getMessageInNavi();
                    if(this._naviIndex !== this._dynamicNaviMng._audioIndex) {                
                        this._audioProvider.playMessage(info.message, true);
                        this._naviIndex = this._dynamicNaviMng._audioIndex;
                    }
                    this.fire('navigating', info);

                    lastTime = Date.now();
                }

            }).on('complete', () => {
                if(!this._isInSimulate) {
                    return ;
                }
                this._dynamicNaviMng.findNearSegment(this.mapView.currentFloor, lngLats[index + 1]);
                index ++;
                if( lngLats[index] && lngLats[index + 1]) {
                    //for rotate
                    sleep(300).then(animate);
                } else if(floorOrder[floorOrder.length - 1] === this.mapView.currentFloor) {
                    this.fire('navigateEnd');
                    this._audioProvider.playMessage('您已到达终点附近，模拟导航结束, 祝您驾车愉快！', true);
                    this.cancelSimNavigate();
                } else {
                    for(let i=0; i<floorOrder.length; i++) {
                        if(floorOrder[i] === this.mapView.currentFloor) {
                            if(!this._isInSimulate || !floorOrder[i + 1]) {
                                return ;
                            }
                            //切换到下一楼层
                            this._ngrMap.changeFloor(floorOrder[i + 1]);
                            return sleep(1000).then(() => this.simulateNavigate(true));
                        }
                    }
                }
            }).start();
        }

        animate();

    }

    /**
     * 取消模拟导航
     */
    cancelSimNavigate() {
        this._isInSimulate = false;
        this.removeMarker('simMarker');
        const rawFC = this._naviMng.getRawFC();
        rawFC && this._dynamicNaviMng.setFeatureCollection(rawFC);
        if(this.animator) {
            this.animator.clear(); //移除所有的事件
            
            this.animator.stop(); //停止动画
            
            delete this.animator;
        }
        
    }

     /**
     * 结束导航http://0.0.0.0
     */
    endNavigate() {
        this._naviMng.removeLayer();

        this._startPosition = null;
        this._endPosition = null;

        this._isInSimulate = false;

    }

    async setMarker(floorId, lngLat, markerName) {
        if(!this[markerName]) {
            const iconUrl = this._options[markerName];
            this[markerName] = new CanvasMarker(iconUrl, { anchor: 'center', plane: true});
            await this[markerName].addTo(this.mapView);
        }

        this[markerName].setPosition(floorId, lngLat);
    }

    removeMarker(markerName) {
        if(this[markerName]) {
            this[markerName].removeLayer();
            delete this[markerName];
        }
    }

    getLngLats() {
        return this._naviMng.getLngLats();
    }

    getNaviRange(){
        return this._naviMng.getNaviLineRange();
    }

    playMessage(msg) {
        this._audioProvider.playMessage(msg);
    }

    openAudio() {
        this._audioProvider.open();
    }

    closeAudio() {
        this._audioProvider.close();
    }

    get mapView() {
        return this._ngrMap.map;
    }
}

export default Navigate;