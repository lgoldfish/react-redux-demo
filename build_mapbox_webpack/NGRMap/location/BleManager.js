import wx from 'wx';
import request from '../request/request';
import { isFunction } from '../utils/lang';
import { tip } from '../utils/tool';
import { bindAll } from '../utils/utils';

class BleManager {
    _beaconsCb = () => { };
    constructor(config = {}) {
        const { signatureUrl, appId, appSecret } = config;
        if (!signatureUrl || !appId) {
            throw new Error('BleManager: init failed');
        }

        bindAll([
            '_initWx',
        ], this);
        window.addEventListener('beforeunload', () => {
            wx.stop();
        });

        this._signatureUrl = signatureUrl;
        this._appId = appId;
        this._appSecret = appSecret;

        this._wxConfig();
    }

    onSearchBeacons(cb) {
        isFunction(cb) && (this._beaconsCb = cb);
    }

    async _wxConfig() {
        const params = {
            appId: this._appId,
            url: encodeURIComponent(location.href.split('#')[0]),
            secret: this._appSecret,
        };
        let result;
        try {
            result = await request.get(this._signatureUrl, { query: params });
        } catch (e) {
            tip('签名认证失败');
            throw e;
        }
        wx.config({
            debug: false,
            appId: this._appId,
            timestamp: result.timestamp,
            nonceStr: result.nonceStr,
            signature: result.signature,
            jsApiList: [
                'checkJsApi',
                'startSearchBeacons',
                'onSearchBeacons',
                'stopSearchBeacons',
                'startRecord',
                'stopRecord',
                'translateVoice',
                'scanQRCode',
                'onMenuShareAppMessage',
            ],
        });

        wx.ready(this._initWx);
    }

    _initWx() {
        wx.startSearchBeacons({
            complete: (argv) => {
                const status = argv.errMsg;
                console.log(status);
                if (status === 'startSearchBeacons:bluetooth power off') {
                    tip('请开启蓝牙功能');
                    return;
                }
                if (status === 'startSearchBeacons:location service disable') {
                    tip('请开始gps定位权限');
                    return;
                }
                if (status === 'startSearchBeacons:system unsupported') {
                    tip('微信版本太低, 请升级');
                    return;
                }
                if (status === 'startSearchBeacons:already started') {
                    wx.stopSearchBeacons({
                        complete: () => {
                            setTimeout(() => {
                                this._initWx();
                            }, 1000);
                        },
                    });
                    return;
                }
                if (status !== 'startSearchBeacons:ok') {
                    return;
                }
                // this.timer = setTimeout(() => {
                //     tip('扫不到蓝牙或您不在定位区域内', 3 * 1000);
                //     this._initWx();
                // }, this._isRestartEd ? 15 * 1000 : 10 * 1000);
                // this._isRestartEd = true;
                wx.onSearchBeacons({
                    complete: ({ beacons }) => {
                        if (this.timer) {
                            clearTimeout(this.timer);
                            delete this.timer;
                        }
                        this._beaconsCb(BleManager.processBeacons(beacons));
                    },
                });
            },
        });
    }

    static processBeacons(beacons) {
        const arr = [];
        for (let i = 0; i < beacons.length; i += 1) {
            Number(beacons[i].rssi) !== 0 && arr.push(beacons[i]);
        }
        arr.sort((a, b) => Number(a.accuracy) - Number(b.accuracy));
        return arr.slice(0, 10);
    }
}

export default BleManager;
