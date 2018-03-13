import { isString } from '../utils/lang';
import { createElement } from '../dom/DOM';

class AudioProvider {
    _status = 'open';
    _audioStack = [];
    constructor() {
        const dom = document.getElementById('audioProvider');
        dom && dom.remove();

        this._audioDom = createElement('audio', { id: 'audioProvider' });
        this._audioDom.onplaying = () => {
            this._isPlaying = true;
        };

        this._audioDom.onended = () => {
            this._isPlaying = false;
            this.playMessage(this._audioStack.shift());
        };

        document.body.appendChild(this._audioDom);
    }

    playMessage(msg, isForce) {
        if (!isString(msg) || this._status === 'close') {
            return;
        }

        if (this._isPlaying) {
            isForce && this._audioStack.push(msg);
            return;
        }

        this._audioDom.src = `https://apiexternal.ipalmap.com:10010/speech?tex=${msg}`;
        this._audioDom.play();

        this._isPlaying = true;
    }

    close() {
        this._status = 'close';
        this._audioDom.muted = true;
    }

    open() {
        this._status = 'open';
        this._audioDom.muted = false;
    }
}

export default AudioProvider;
