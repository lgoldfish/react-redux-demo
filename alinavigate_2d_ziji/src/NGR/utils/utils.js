import { isNumber } from './lang';

export function padBounds(bounds, bufferRatio) {
    const sw = bounds._sw;
    const ne = bounds._ne;
    
    const heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio;
    const widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

    return new mapboxgl.LngLatBounds(
        [sw.lng - widthBuffer, sw.lat - heightBuffer],
        [ne.lng + widthBuffer, ne.lat + heightBuffer]
    );
}

export function validLngLat(lngLat) {
    return lngLat && isNumber(lngLat.lng) && isNumber(lngLat.lat);
}

export function validCoord(coord) {
    return coord && isNumber(coord.x) && isNumber(coord.y);
}