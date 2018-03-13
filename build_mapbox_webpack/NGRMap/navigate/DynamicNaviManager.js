import Geometry from '../geometry/Geometry';
import { isArray } from '../utils/lang';
import Segment from './Segment';

const defaultOptions = {
    autoMove: true,
    restRotateDistance: 0.5,
    rotateTime: 500,
};

class DynamicNaviManager {
    _segments = [];
    constructor(map, options = {}) {
        if (!map) {
            throw new Error('DynamicNaviManager: a NGRMap instance is required');
        }
        this._map = map;
        this._options = { ...defaultOptions, options };
    }

    setFeatureCollection({ features }) {
        if (!isArray(features)) {
            throw new Error('setFeatureCollection: a { type: "FeatureCollection", features: [] } is required');
        }

        this._reset();
        for (let i = 0; i < features.length; i += 1) {
            const segment = new Segment(features[i]);

            i > 0 && this._segments[i - 1].setNextSegment(segment);
            this._segments.push(segment);
        }
    }

    _reset() {
        this._segments.length = 0;
        this._crtIndex = 0;
        this._crtCoord = null;
    }

    findNearSegment(index, lngLat, isMove = true) {
        const oldIndex = this._crtIndex;
        const coord = Geometry.transToWgs(lngLat);
        this._crtCoord = coord;
        this._crtIndex = index;

        const { autoMove } = this._options;
        if (autoMove && isMove) {
            this.moveToSegment();
        }
    }

    moveToSegment() {
        if (this._segments.length === 0) {
            throw new Error('moveToSegment: please use it after setFeatureCollection');
        }

        let index = this._crtIndex;
        const restDistance = this.crtSegment.getRestDistance(this._crtCoord);
        const { restRotateDistance } = this._options;
        if (restDistance < restRotateDistance && index < this._segments.length - 1) {
            index = this._crtIndex + 1;
        }
        let bearing = this._map.mapView.getBearing();
        if (bearing < 0) {
            bearing = 360 + bearing;
        }

        if (bearing === this._segments[index]._rotate) {
            return;
        }

        this._map.easeTo({
            bearing: this._segments[index]._rotate,
            duration: this._options.rotateTime,
        });
    }

    getMessageInNavi() {
        return this.crtSegment.getMessageInNavi(this._crtCoord);
    }

    getMessageInList() {
        const arr = [];
        for (let i = 0; i < this._segments.length; i += 1) {
            arr.push(this._segments[i].getMessage());
        }

        return arr;
    }

    distanceToEnd(index, lngLat) {
        const coord = lngLat && Geometry.transToWgs(lngLat);
        let dis = this._segments[index].getRestDistance(coord);
        for (let i = index + 1; i < this._segments.length; i += 1) {
            dis += this._segments[i]._distance;
        }

        return dis;
    }

    get crtSegment() {
        return this._segments[this._crtIndex];
    }
}

export default DynamicNaviManager;
