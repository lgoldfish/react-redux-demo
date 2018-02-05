import Geometry from '../geometry/Geometry';
import { isArray } from '../utils/lang';
import Segment from './Segment';
import NCore from '../core/NCore';
import AnimatorFactory from '../animate/AnimatorFactory';

const defaultOptions = {
    autoMove: true, //保持定位点在视野中央, 以及地图旋转,
};

class DynaminNaviManager extends NCore {
    _segments = [];
    _crtIndex = 0;
    _floorMap = { }; //对应楼层的segments
    _isOperate = false; //用户是否在操作地图
    constructor(mapView, options = {}) {
        if(! mapView instanceof mapboxgl.Map) {
            throw new Error('DynamicNaviManager: init failed');
        }
        super();
        this._mapView = mapView;
        // let timer;
        // this._mapView.on('touchstart', () => {
        //     timer && clearTimeout(timer);
        //     this._isOperate = true;
        //     timer = setTimeout(() => {
        //         this._isOperate = false;
        //     }, 5 * 1000);
        // });
        this._options = { ...defaultOptions, ...options };
    }

    /**
     * 根据导航线原始数据生成导航线所需数据
     * @param {*} { type: "FeatureCollection", features: [] } 
     */
    setFeatureCollection({ features = [] }) {
        if(!isArray(features)) {
            throw new Error('setFeatureCollection: failed a array is required');
        }

        this._reset();
        
        for(let i = 0; i<features.length; i++) {
            const segment = new Segment(features[i]);
            i > 0 && this._segments[i - 1].setNextSegment(segment);
            this._segments.push(segment);
            const floorId = features[i].properties.floor;
            //生成floorMap
            if(!this._floorMap[floorId]) {
                this._floorMap[floorId] = [segment];
            } else {
                this._floorMap[floorId].push(segment);
            }
        }
    }

    _reset() {
        this._segments.length = [];
        this._crtIndex = 0;
        this._audioIndex = 0;
        this._crtCoord = null;
    }

    /**
     * 根据定位结果找到最近的segment
     * @param {*} floorId 
     * @param {*} lngLat 
     */
    findNearSegment(floorId, lngLat) {
        const coord = Geometry.transToWgs(lngLat);
        this._crtCoord = coord;
        let oldIndex = this._crtIndex;
        this._crtIndex = this._getCurSegmentIndex(floorId, coord);
        const restDis = this.crtSegment.getRestDistance(coord);
        if(restDis <= 3) {
            if(this._crtIndex + 1 < this._segments.length) {
                this._audioIndex = this._crtIndex + 1;
            }
        } else {
            this._audioIndex = this._crtIndex;
        }
        const { autoMove } = this._options;
        if(autoMove && (oldIndex !== this._crtIndex || this._crtIndex === 0)) {
            this.moveToSegment();
        }
    }

    getMessageInNavi() {
        return this._segments[this._audioIndex].getMessageInNavi(this._crtCoord);
    }

    /**
     * 根据定位结果获取当前segment
     * @param {*} floorId 
     * @param {*} coord 
     */
    _getCurSegmentIndex(floorId, coord) {
        for(let i=0; i<this._segments.length; i++) {
            const isCurFloor = floorId === this._segments[i]._properties.floor;
            if(isCurFloor && this._segments[i].isInLine(coord)) {
                const curRestDis = this._segments[i].getRestDistance(coord);
                if(curRestDis <= 1 && i<(this._segments.length - 1) && !this._segments[i].facilityType) {
                    return i + 1;
                }
                return i;
            } 
        }

        if(process.env.NODE_ENV === 'development'){
            alert('error: not find cur segment');
            this._errorCoord = coord;
        }

        return 0;
    }

    /**
     * 移动到对应的segment
     */
    moveToSegment() {

        if(this._isOperate) {
            return ;
        }
        if(this._segments.length === 0) {
            throw new Error('moveToSegment: please use it after setFeatureCollection');
        }
        
        let end = this.crtSegment._rotate;

        const start = this._mapView.getBearing();
      
        end = Math.abs(start - end) > 180 ? -(360 - end) : end;
        if(start === end) {
            return ;
        }
        
        this.animator && this.animator.stop();

        this.animator = AnimatorFactory.getInstance().ofNumber(start, end, 300);
        this.animator.on('update', ({ num }) => {
            !this._isOperate && this._mapView.setBearing(num);
        }).on('complete', () => {
            delete this.animator;
        }).start();
    }

    /**
     * 计算到终点的距离
     * @param {*} floorId 
     * @param {*} lngLat 
     */
    distanceToEnd(floorId, lngLat) {
        const coord = Geometry.transToWgs(lngLat);
        const index = this._getCurSegmentIndex(floorId, coord);
        let dis = this._segments[index].getRestDistance(coord);
        for(let i=index+1; i<this._segments.length; i++) {
            dis += this._segments[i]._distance;
        }
        return dis;
    }

    /**
     * 获取所有的导航信息
     */
    getMessageInList() {
        const arr = [];
        for(let i=0; i<this._segments.length; i++) {
            arr.push({ 
                direction: this._segments[i].getDirection(),
                message: this._segments[i].getMessage()
            });
        }
        
        return arr;
    }

    get crtSegment() {
        return this._segments[this._crtIndex];
    }

}

export default DynaminNaviManager;