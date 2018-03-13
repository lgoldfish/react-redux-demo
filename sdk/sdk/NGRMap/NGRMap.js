import mapboxgl from 'mapbox-gl';
import NCore from './core/NCore';
import { isString } from './utils/lang';
import { bindAll, getNumByStr, uniqueId, generatePointGeoJson } from './utils/utils';
import DataSource from './data/DataSource';
import Control from './control/Control';
import { loading, hideLoading, tip } from './utils/tool';
import AnimatorFactory from './animate/AnimatorFactory';

const defaultOptions = {
    defaultFloor: '',
    apiServer: 'https://apinagrand.ipalmap.com/',
    vectorServer: 'https://source.ipalmap.com/maps',
    background: '#F8FAFF',
    animateFps: 60,
};

class NGRMap extends NCore {
    _floorMap = {};
    _domControls = {};
    _plugins = {};
    _animateStack = [];
    _zoomConfig = {};
    _disableCategory = [];
    _isChangeReset = true;
    constructor(buildingId, options = {}) {
        super();
        if (!isString(buildingId)) {
            throw new Error('NGRMap: buildingId is required');
        }
        bindAll([
            '_execLoaded',
            '_clickHandle',
            '_moveEndHandle',
        ], this);

        this._buildingId = buildingId;
        this._options = { ...defaultOptions, ...options };
        // for animate fps
        AnimatorFactory.setFps(this._options.animateFps);
        this._res = new DataSource(this._options.apiServer);
    }

    _addSkewGesture() {
        if (!this.mapView) {
            throw new Error('_addSkewGesture: please use it after init');
        }
        let startY1;
        let startY2;
        let startX1;
        let startX2;
        let angle;
        const dom = this.mapView.getCanvas();
        dom.addEventListener('touchstart', (e) => {
            angle = Math.PI;
            if (e.touches.length >= 2) {
                startY1 = e.touches[0].clientY;
                startY2 = e.touches[1].clientY;
                startX1 = e.touches[0].clientX;
                startX2 = e.touches[1].clientX;
                const x = Math.abs(startX2 - startX1);
                const y = Math.abs(startY2 - startY1);
                angle = Math.abs(Math.atan2(y, x));
            }
        });

        dom.addEventListener('touchmove', (e) => {
            if (e.touches.length < 2 || angle > Math.PI / 3) {
                return;
            }

            const y1 = e.touches[0].clientY - startY1;
            const y2 = e.touches[1].clientY - startY2;
            let num = 0;
            if (y1 > 0 && y2 > 0) {
                num = this.mapView.getPitch() - 2.5;
            }

            if (y1 < 0 && y2 < 0) {
                num = this.mapView.getPitch() + 2.5;
            }

            num = num < 0 ? 0 : num;
            num > 0 && this.mapView.setPitch(num);

            startY1 = e.touches[0].clientY;
            startY2 = e.touches[1].clientY;
        });
    }

    async init(mapConfig, baseStyle) {
        if (!mapConfig || !baseStyle) {
            throw new Error('init: mapConfig and mapStyle is required');
        }
        this._baseStyle = baseStyle;
        this.mapView = new mapboxgl.Map({ zoom: 10, ...mapConfig });
        const canvasDom = this.mapView.getCanvas();
        canvasDom.style.background = this._options.background;

        this._addSkewGesture();
        // for domControl
        for (const key in this._domControls) {
            this._domControls[key].addTo(this);
        }

        // for plugins
        for (const key in this._plugins) {
            this._plugins[key].addTo(this);
        }

        this.mapView.on('load', this._execLoaded);

        this.mapView.on('click', this._clickHandle);

        this.mapView.on('moveend', this._moveEndHandle);

        // 在 加载floor前调用
        this._execLoading();

        await this._generateFloors();

        const floorId = this._options.defaultFloor || this._floors[0].flId;
        this.setCurrentFloor(floorId);
    }

    setClickDisableCategory(disableCategory) {
        this._disableCategory = disableCategory;
    }

    _clickHandle(e) {
        const features = this.mapView.queryRenderedFeatures(e.point, { layers: ['Area'] });
        features.sort((a, b) => b.properties.shapelevel - a.properties.shapelevel);
        // console.log(features);
        const filterArr = [];
        for (let i = 0; i < features.length; i += 1) {
            const categoryId = features[i].properties.categoryid;
            if (this._disableCategory.indexOf(categoryId) === -1) {
                filterArr.push(features[i]);
            }
        }
        const clickEvent = {
            features: filterArr,
            lngLat: e.lngLat,
            point: e.point,
            type: e.type,
        };
        this.fire('click', clickEvent);
    }

    _moveEndHandle() {
        if (this._animateStack.length === 0) {
            return;
        }
        const animate = this._animateStack.shift();
        switch (animate.method) {
            case 'ease':
                this.mapView.easeTo(animate);
                break;
            case 'fly':
                this.mapView.flyTo(animate);
                break;
            default:
                break;
        }
    }

    async _generateFloors() {
        let floors;
        try {
            floors = await this._res.requestFloors(this._buildingId);
        } catch (e) {
            this._execError(e);
        }

        if (!floors || floors.length === 0) {
            return;
        }
        this._floors = floors.filter(item => item.nameEn !== 'F0');
        this._floors.sort((a, b) => a.altitude - b.altitude);

        for (let i = 0; i < this._floors.length; i += 1) {
            this._floorMap[this._floors[i].flId] = this._floors[i];
        }

        this.fire('getFloors', Array.from(this._floors));
    }

    setCurrentFloor(floorId) {
        if (!isString(floorId) || floorId === this.currentFloor) {
            return;
        }
        this.currentFloor = floorId;
        const center = this._floorMap[floorId].center.coordinates;

        const baseStyle = this.mapView.getStyle() || { ...this._baseStyle };
        baseStyle.sources.dataSource = {
            type: 'vector',
            url: `${this._options.vectorServer}/${floorId}/tilejsons.json`,
        };
        this.mapView.setCenter(center);
        this.mapView.setStyle(baseStyle);
        // this.mapView.setMaxBounds(this._floorMap[floorId].bounds);
        const { maxZoom, minZoom, zoom } = this.getFloorZoomConfig(this.currentFloor);
        if (this._isChangeReset) {
            maxZoom && this.mapView.setMaxZoom(maxZoom);
            minZoom && this.mapView.setMinZoom(minZoom);
            zoom && this.mapView.setZoom(zoom);
        }

        this.fire('changeFloor');
    }

    setZoomConfig(zoomConfig) {
        this._zoomConfig = zoomConfig;
    }

    setIsReset(isReset) {
        this._isChangeReset = isReset;
    }

    getFloorZoomConfig(floorId) {
        return this._zoomConfig[floorId] || this._zoomConfig.default || {};
    }

    addDomControl(control) {
        if (!(control instanceof Control)) {
            throw new Error('addDomControl: failed, control is a instance of Control');
        }

        const name = control.getName();
        if (this.getDomControl(name)) {
            return;
        }
        this._domControls[name] = control;
        this.mapView && control.addTo(this);

        if (name === 'floor') {
            control.on('change', ({ to }) => {
                this.setCurrentFloor(to);
                const location = this.getPlugin('location');
                location && location.setAutoChange(false);
            });
        }
    }

    getDomControl(name) {
        return this._domControls[name];
    }

    removeDomControl(name) {
        const control = this.getDomControl(name);

        if (control) {
            control.destroy();
            delete this._domControls[name];
        } else {
            console.warn('removeDomControl: this control is not exit');
        }
    }

    showDomControl(name) {
        const control = this.getDomControl(name);
        control && control.show();
    }

    hideDomControl(name) {
        const control = this.getDomControl(name);
        control && control.hide();
    }

    addPlugin(plugin) {
        const name = plugin.getName();
        this._plugins[name] = plugin;
        this.mapView && plugin.addTo(this);
    }

    getPlugin(name) {
        return this._plugins[name];
    }

    removePlugin(name) {
        const plugin = this.getPlugin(name);

        if (plugin) {
            plugin.destroy();
            delete this._plugins[name];
        } else {
            console.warn('removePlugin: this plugin is not exit');
        }
    }

    async searchByKeyword(keyword) {
        if (!keyword) {
            return [];
        }
        loading();
        let res;
        try {
            res = await this._res.searchPOI(this._buildingId, keyword);
        } catch (error) {
            throw error;
        } finally {
            hideLoading();
        }
        if (!res) {
            return [];
        }
        // 第一次对楼层进行排序
        const map = {};
        for (let i = 0; i < res.length; i += 1) {
            if (!map[res[i].flId]) {
                map[res[i].flId] = [];
            }
            map[res[i].flId].push(res[i]);
        }
        const sortArr = [];
        for (const key in map) {
            sortArr.push(map[key]);
        }
        sortArr.sort((a, b) => a[0].altitude - b[0].altitude);
        // 对字符串进行排序
        const reg = /[0-9]/ig;
        let resultArr = [];
        for (let i = 0; i < sortArr.length; i += 1) {
            sortArr[i].sort((a, b) => {
                const aNum = getNumByStr(a.display) || 0;
                const bNum = getNumByStr(b.display) || 0;
                if (a.display.charCodeAt() === b.display.charCodeAt()) {
                    return aNum - bNum;
                }
                return a.display.charCodeAt() - b.display.charCodeAt();
            });
            resultArr = resultArr.concat(sortArr[i]);
        }
        return resultArr;
    }

    setControlTop(topStyle) {
        let dom = document.getElementsByClassName('mapboxgl-ctrl-top-left')[0];
        dom.style.top = topStyle;

        dom = document.getElementsByClassName('mapboxgl-ctrl-top-right')[0];
        dom.style.top = topStyle;
    }

    setControlBottom(bottomStyle) {
        let dom = document.getElementsByClassName('mapboxgl-ctrl-bottom-left')[0];
        dom.style.bottom = bottomStyle;

        dom = document.getElementsByClassName('mapboxgl-ctrl-bottom-right')[0];
        dom.style.bottom = bottomStyle;
    }
    
    setLayerVisible(layers, visible) {
        if (this.mapStatus !== 'loaded') {
            return;
        }
        if (Array.isArray(layers)) {
            for (let i = 0; i < layers.length; i += 1) {
                this.mapView.setLayoutProperty(layers[i], 'visibility', visible);
            }
        } else if (isString(layers)) {
            this.mapView.setLayoutProperty(layers, 'visibility', visible);
        }
    }

    addIcons(arr) {
        if (this.mapStatus !== 'loaded') {
            this.once('loaded', () => this.addIcons(arr));
            return;
        }

        for (let i = 0; i < arr.length; i += 1) {
            if (arr[i].icon && arr[i].lngLat) {
                const id = `nag-${uniqueId()}`;
                this.mapView.loadImage(arr[i].icon, (err, img) => {
                    if (err) throw err;
                    this.mapView.addImage(id, img);
                    this.mapView.addLayer({
                        id,
                        type: 'symbol',
                        source: generatePointGeoJson(arr[i].lngLat),
                        layout: {
                            'icon-image': id,
                            ...(arr[i].options || {}),
                        },
                    });
                });
            }
        }
    }

    _execLoading() {
        this.mapStatus = 'loading';
        this.fire('loading');
    }

    _execLoaded() {
        this.mapStatus = 'loaded';
        this.fire('loaded');
    }

    _execError(err) {
        this.fire('error', err);
    }

    stop() {
        if (!this.mapView.isMoving()) {
            return;
        }
        this.mapView.stop();
        if (this.mapView.isMoving()) {
            this.stop();
        }
    }

    easeTo(animate) {
        if (!this.mapView || !animate) {
            return;
        }
        if (this.mapView.isMoving()) {
            animate.method = 'ease';
            this._animateStack.push(animate);
            return;
        }

        this.mapView.easeTo(animate);
    }

    flyTo(animate) {
        if (!this.mapView || !animate) {
            return;
        }
        if (this.mapView.isMoving()) {
            animate.method = 'fly';
            this._animateStack.push(animate);
            return;
        }
        this.mapView.flyTo(animate);
    }

}

export default NGRMap;
