const offset = 0.0000001;
/* eslint-disable */

function transToLngLat(coord) {
    let x = coord.x / 20037508.34 * 180;
    let y = coord.y / 20037508.34 * 180;

    y = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2);

    return { lng: x, lat: y };
}

function transToWgs(lngLat) {
    let x = lngLat.lng * 20037508.34 / 180;
    let y = Math.log(Math.tan((90 + lngLat.lat) * Math.PI / 360)) / (Math.PI / 180);

    y = y * 20037508.34 / 180;

    return { x, y };
}

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

function getProjection(point, line) {
    const x = point[0], y = point[1];
    const x1 = line[0][0], y1 = line[0][1];
    const x2 = line[1][0], y2 = line[1][1];
    const xMax = Math.max(x1, x2) + offset;
    const xMin = Math.min(x1, x2) - offset;
    const yMax = Math.max(y1, y2) + offset;
    const yMin = Math.min(y1, y2) - offset;
    if (x1 === x2) {
        if (yMin <= y && y <= yMax) {
            return { dis: Math.abs(x1 - x), coord: { x: x1, y: y } };
        } else {
            let dis1 = getDistance(point, line[0]);
            let dis2 = getDistance(point, line[1]);
            if (dis1 <= dis2) {
                return { dis: dis1, coord: { x: x1, y: y1 } };
            } else {
                return { dis: dis2, coord: { x: x2, y: y2 } };
            }
        }
    }

    const k = (y2 - y1) / (x2 - x1);
    const b = y1 - k * x1;
    if (k === 0) {
        if (xMin <= x && x <= xMax) {
            return { dis: Math.abs(y1 - y), coord: { x: x, y: y1 } };
        } else {
            let dis1 = getDistance(point, line[0]);
            let dis2 = getDistance(point, line[1]);
            if (dis1 <= dis2) {
                return { dis: dis1, coord: { x: x1, y: y1 } };
            } else {
                return { dis: dis2, coord: { x: x2, y: y2 } };
            }
        }
    }

    const k1 = -1 / k;
    const b1 = y - k1 * x;

    const x0 = (b1 - b) / (k - k1);
    const y0 = k * x0 + b;

    if (xMin <= x0 && x0 <= xMax &&
        yMin <= y0 && y0 <= yMax) {

        return { dis: getDistance([x0, y0], [x, y]), coord: { x: x0, y: y0 } };
    } else {
        let dis1 = getDistance(point, line[0]);
        let dis2 = getDistance(point, line[1]);
        if (dis1 <= dis2) {
            return { dis: dis1, coord: { x: x1, y: y1 } };
        } else {
            return { dis: dis2, coord: { x: x2, y: y2 } };
        }
    }
}

function getAngle(line1, line2) {
    const m_a = getDistance(line1[0], line1[1]);
    const vector_a = { x: (line1[1][0] - line1[0][0]), y: (line1[1][1] - line1[0][1]) };

    const m_b = getDistance(line2[0], line2[1]);
    const vector_b = { x: (line2[1][0] - line2[0][0]), y: (line2[1][1] - line2[0][1]) };


    const angle = Math.acos((vector_a.x * vector_b.x + vector_a.y * vector_b.y) / (m_a * m_b)) / Math.PI * 180;
    const isLess = vector_b.x / m_b - vector_a.x / m_a < 0;

    return isLess ? 360 - angle : angle;
}

function isInLine(point, line) {
    const vector_a = { x: point[0] - line[0][0], y: point[1] - line[0][1] };
    const vector_b = { x: line[1][0] - line[0][0], y: line[1][1] - line[0][1] };
    const xMax = Math.max(line[0][0], line[1][0]) + offset;
    const xMin = Math.min(line[0][0], line[1][0]) - offset;
    const yMax = Math.max(line[0][1], line[1][1]) + offset;
    const yMin = Math.min(line[0][1], line[1][1]) - offset;
    if (vector_b.x !== 0 && vector_b.y !== 0) {
        const t = Math.abs(vector_a.x / vector_b.x - vector_a.y / vector_b.y);
        return t < offset && xMin <= point[0] && point[0] <= xMax && yMin <= point[1] && point[1] <= yMax;
    } else if (vector_b.x === 0) {
        return Math.abs(vector_a.x) <= offset && yMin <= point[1] && point[1] <= yMax;
    } else if (vector_b.y === 0) {
        return Math.abs(vector_a.y) <= offset && xMin <= point[0] && point[0] <= xMax;
    }
}

export default {
    transToLngLat,
    transToWgs,
    getDistance,
    getProjection,
    getAngle,
    isInLine
};
