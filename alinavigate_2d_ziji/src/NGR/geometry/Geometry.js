import { validLngLat, validCoord } from '../utils/utils';
/**
 * point: [x, y]
 * line: [point, point] 
 * coord: { x: number, y: number }
 * lngLat: { lng: number, lat: number }
 */

const OFFSET = 0.001;

class Geometry {
    /**
     * 墨卡托转化为经纬度
     * @param {*} coord 
     */
    static transToLngLat(coord) {
        if(!validCoord(coord)) {
            console.error('error: expect an object {x: number, y: number}');
            return ;
        }
    
        let x = coord.x / 20037508.34 * 180;
        let y = coord.y / 20037508.34 * 180;
    
        y = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2);
    
        return { lng: x, lat: y };
    }

    /**
     * 经纬度转化为墨卡托
     * @param {*} lngLat 
     */
    static transToWgs(lngLat) {
        if(!validLngLat(lngLat)) {
            console.error('error: expect an object {lng: number, lat: number}');
            return ;
        }

        let x = lngLat.lng * 20037508.34 / 180;
        let y = Math.log(Math.tan((90 + lngLat.lat) * Math.PI / 360 )) / (Math.PI / 180);

        y = y * 20037508.34 / 180;

        return { x, y };

    }

    /**
     * 获取点到线段的最短距离 以及投影点
     * @param {*} point 
     * @param {*} line 
     */
    static getProjection(point, line) {
        const x = point[0], y = point[1];
        const x1 = line[0][0], y1 = line[0][1];
        const x2 = line[1][0], y2 = line[1][1];
        const xMax = Math.max(x1, x2) + OFFSET;
        const xMin = Math.min(x1, x2) - OFFSET;
        const yMax = Math.max(y1, y2) + OFFSET;
        const yMin = Math.min(y1, y2) - OFFSET;
        //斜率不存在
        if(x1 === x2) {
            if(yMin <= y && y <= yMax) {
                return { dis: Math.abs(x1 - x), coord: { x: x1, y: y } };
            } else {
                let dis1 = Geometry.getDistance(point, line[0]);
                let dis2 = Geometry.getDistance(point, line[1]);
                if(dis1 <= dis2) {
                    return { dis: dis1, coord: { x: x1, y: y1 } };
                } else {
                    return { dis: dis2, coord: { x: x2, y: y2 } };
                }
            }    
        }
        //斜率为 0
        const k = (y2 - y1) / ( x2 - x1);
        const b = y1 - k * x1;
        if(k === 0) {
            if(xMin <= x && x<= xMax) {
                return { dis: Math.abs(y1 - y), coord: { x: x, y: y1 } };
            } else {
                let dis1 = Geometry.getDistance(point, line[0]);
                let dis2 = Geometry.getDistance(point, line[1]);
                if(dis1 <= dis2) {
                    return { dis: dis1, coord: { x: x1, y: y1 } };
                } else {
                    return { dis: dis2, coord: { x: x2, y: y2 } };
                }
            }
        } 
        //斜率存在不为0
        const k1 = -1 / k;
        const b1 = y - k1 * x;

        const x0 = (b1 - b) / (k - k1);
        const y0 = k * x0 + b;

        if(xMin <= x0 && x0 <= xMax &&
            yMin <= y0 && y0 <=yMax) {

            return { dis: Geometry.getDistance([x0, y0], [x, y]), coord: { x: x0, y: y0 } };
        } else {
            let dis1 = Geometry.getDistance(point, line[0]);
            let dis2 = Geometry.getDistance(point, line[1]);
            if(dis1 <= dis2) {
                return { dis: dis1, coord: { x: x1, y: y1 } };
            } else {
                return { dis: dis2, coord: { x: x2, y: y2 } };
            }
        }
    }

    /**
     * 获取两点之间的距离
     * @param {*} p1 
     * @param {*} p2 
     */
    static getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
    }

    /**
     * 获取线偏离的夹角
     * @param {*} line [[], []]
     */
    static getAngle(line1, line2) {
        //获取单位向量
        const m_a = Geometry.getDistance(line1[0], line1[1]);
        const vector_a = { x: (line1[1][0] - line1[0][0]) , y: (line1[1][1] - line1[0][1]) };

        const m_b = Geometry.getDistance(line2[0], line2[1]);
        const vector_b = { x: (line2[1][0] - line2[0][0]) , y: (line2[1][1] - line2[0][1]) };
  
        
        const angle = Math.acos((vector_a.x * vector_b.x + vector_a.y * vector_b.y) / (m_a * m_b)) / Math.PI * 180;
        const isLess = vector_b.x / m_b - vector_a.x / m_a < 0;
        return isLess ? 360 - angle : angle;
    }

    /**
     * 判断点是否在线段上
     * @param {*} point 
     * @param {*} line 
     */
    static isInLine(point, line) {
        const vector_a = { x: point[0] - line[0][0], y: point[1] - line[0][1] };
        const vector_b = { x: line[1][0] - line[0][0], y: line[1][1] - line[0][1] };
        const xMax = Math.max(line[0][0], line[1][0]) + OFFSET;
        const xMin = Math.min(line[0][0], line[1][0]) - OFFSET;
        const yMax = Math.max(line[0][1], line[1][1]) + OFFSET;
        const yMin = Math.min(line[0][1], line[1][1]) - OFFSET;
        if(vector_b.x !== 0 && vector_b.y !== 0) {
            const t = Math.abs(vector_a.x / vector_b.x - vector_a.y / vector_b.y);
            return  t < OFFSET && xMin <= point[0] && point[0] <= xMax && yMin <=point[1] && point[1] <= yMax;
        } else if(vector_b.x === 0) {
            return Math.abs(vector_a.x) <= OFFSET && yMin <=point[1] && point[1] <= yMax;
        } else if(vector_b.y === 0) {
            return Math.abs(vector_a.y) <= OFFSET && xMin <= point[0] && point[0] <= xMax;
        }
    }

    /**
     * 根据区域坐标 获取缩放等级
     * @param {* 东北点} ne 
     * @param {* 西南点} sw 
     */
    static getZoomLevel(sw,ne){
        if(!validCoord(ne)|| !validCoord(sw)) {
            console.error('error: ne and sw expect an object {x: number, y: number}');
            return ;
        }

        if(!window.screen){
            console.error('error: no screen parameter here');
            return;
        }

        let height = window.screen.height;
        let width = window.screen.width;

        let deltaX = ne.x - sw.x;
        let deltaY = ne.y - sw.y;

        let pixelX = (ne.x - sw.x)/width;
        let pixelY = (ne.y - sw.y)/height;

        let level = 24;
        if(pixelX > pixelY){
            level -= Math.log2(deltaX);
        }else{
            level -= Math.log2(deltaY);
        }

        return level;
    }
}

window.Geometry = Geometry;

export default Geometry;