import NCore from '../core/NCore';
import { bindAll } from '../utils/utils';

const TWEEN = require('./Tween.min').TWEEN;

class Animator extends NCore {
    constructor(start, end, duration, fps) {
        super();
        this._fps = fps;
        bindAll([
            '_animateLoop',
        ], this);
        this._t = new TWEEN.Tween(start).to(end, duration);
        // start
        this._t.onStart(() => {
            this.fire('start');
        });

        // update
        this._t.onUpdate((value) => {
            this.fire('update', value);
        });

        // complete
        this._t.onComplete(() => {
            this.fire('complete');
            if (!this._fps || this._fps === 60) {
                cancelAnimationFrame(this._timer);
            } else {
                clearInterval(this._timer);
            }
        });

        // stop
        this._t.onStop(() => {
            this.fire('stop');
            if (!this._fps || this._fps === 60) {
                cancelAnimationFrame(this._timer);
            } else {
                clearInterval(this._timer);
            }
        });
    }

    _animateLoop(time) {
        this._timer = requestAnimationFrame(this._animateLoop);
        TWEEN.update(time);
    }

    start() {
        this._t.start();
        if (!this._fps || this._fps === 60) {
            this._timer = requestAnimationFrame(this._animateLoop);
        } else {
            this._timer = setInterval(() => {
                TWEEN.update();
            }, 1000 / this._fps);
        }

        return this;
    }

    easing(animFun) {
        this._t.easing(animFun);

        return this;
    }

    stop() {
        this._t.stop();

        return this;
    }

    get Easing() {
        return TWEEN.Easing;
    }
}

export default Animator;
