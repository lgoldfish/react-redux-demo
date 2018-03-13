import Animator from './Animator';
import { isNumber } from '../utils/lang';

let instance;

class AnimatorFactory {

    ofNumber(start, end, duration) {
        if (!isNumber(start) || !isNumber(end) || !isNumber(duration)) {
            throw new Error('ofNumber: params is at least 3');
        }

        return new Animator({ num: start }, { num: end }, duration, AnimatorFactory._lockFps);
    }

    ofObject(start, end, duration) {
        if (!start || !end || !isNumber(duration)) {
            throw new Error('ofObject: params is at least 3');
        }

        return new Animator({ ...start }, { ...end }, duration, AnimatorFactory._lockFps);
    }

    static getInstance() {
        if (!instance) {
            instance = new AnimatorFactory();
        }
        return instance;
    }

    static setFps(fps) {
        if (isNumber(fps)) {
            AnimatorFactory._lockFps = fps;
        } else {
            console.warn('setFps: failed a number is required');
        }
    }
}

export default AnimatorFactory;
