
class AudioProvider {
    constructor() {
        const dom = document.getElementById('audioProvider');
        dom && dom.remove();
		this._status = 'open';
        this._audioStack = [];
		this._audioDom = document.createElement('audio');
		this._audioDom.setAttribute("id","audioProvider")
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
        if (typeof msg !="string" || this._status === 'close') {
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

NGR.AudioProvider = AudioProvider