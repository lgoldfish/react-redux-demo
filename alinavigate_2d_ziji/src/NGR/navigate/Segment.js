import Geometry from '../geometry/Geometry';
import DynamicNaviRule from './DynamicNaviRule';

class Segment {
    constructor(feature) {
        this._line = feature.geometry.coordinates;
        this._properties = feature.properties;
        this._rotate = Geometry.getAngle([[0, 0], [0, 1]], this._line);
        const dis = Geometry.getDistance(this._line[0], this._line[1]);
        this._distance = Math.round(dis);
    }

    setNextSegment(nextSegment) {
        this._nextSegment = nextSegment;
        if(this._properties.floor === nextSegment._properties.floor) {
            this._direction = DynamicNaviRule.getDirection(nextSegment._rotate - this._rotate);
        } else {
            const nextAltitude = nextSegment._properties.altitude;
            const altitude = this._properties.altitude;
            this._direction = nextAltitude > altitude? 'top': 'bottom';

            const facilityType = DynamicNaviRule.getFacilityType(this._properties.category);
            this._properties.facilityType = this.facilityType = facilityType;
        }
    }

    getNaviTip() {
        if (!this._nextSegment) {
            return '到达终点';
        }
        const { facilityType } = this._properties;
        const { floorAddress } = this._nextSegment._properties;
        switch (this._direction) {
            case 'leftrear':
            return '左后方前行';
            case 'left':
                return '左转';
            case 'leftfront':
                return '左前方前行';
            case 'rightfront':
                return '右前方前行';
            case 'right':
                return '右转';
            case 'rightrear':
                return '右后方前行';
            case 'top':
                return `乘${facilityType}上行至${floorAddress}层`;
            case 'bottom':
                return `乘${facilityType}下行至${floorAddress}层`;
            default:
                return '';
        }
    }

    getMessageInNavi(coord) {
        let disToCurEnd = this._distance;
        if(coord) {
            disToCurEnd = Geometry.getDistance([coord.x, coord.y], this._line[1]);
        }
        disToCurEnd = Math.round(disToCurEnd);
        
        let message;
        const isWillChange = disToCurEnd < 5;
        if (disToCurEnd < 2) {
            message = this.getNaviTip();
        } else if (disToCurEnd < 5) {
            message = `前方, ${this.getNaviTip()}`;
        } else {
            message = `直行${disToCurEnd}米后, ${this.getNaviTip()}`;
        }
        
        return { 
            isWillChange, 
            message, 
            distance: disToCurEnd, 
            direction: this._direction,
            facilityType: this.facilityType
        };
    }

    getMessage() {
        let message;
        if (this._nextSegment) {
            message = `直行${this._distance}米后, ${this.getNaviTip()}`;
        } else {
            message = `直行${this._distance}米后, 到达终点`;
        }

        return {
            message,
            direction: this._direction,
            facilityType: this._properties.facilityType,
        };
    }

    getDirection() {
        return this._direction;
    }
    /**
     * 判断点是否在这条线段上
     * @param {*{ x: number, y: number }} coord 
     */
    isInLine(coord) {
        return Geometry.isInLine([coord.x, coord.y], this._line);
    }

    /**
     * 判断剩余距离
     * @param {*} coord 
     */
    getRestDistance(coord) {
        return Geometry.getDistance([coord.x, coord.y], this._line[1]);
    }
}

export default Segment;