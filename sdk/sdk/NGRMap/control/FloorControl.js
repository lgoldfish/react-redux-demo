import Control from './Control';
import { bindAll } from '../utils/utils';
import { createElement } from '../dom/DOM';
import styles from '../ngr.css';
import AnimatorFactory from '../animate/AnimatorFactory';

const defaultOptions = {
    position: 'bottom-left',
};

class FloorControl extends Control {
    _floors = [];
    _isShow = true;
    constructor(options = {}) {
        const opts = { ...defaultOptions, ...options };
        super('floor', opts);

        bindAll([
            '_onGetFloors',
            '_onChangeFloor',
        ], this);

        this._container = createElement('div', { className: styles.floorControl });
        this._list = createElement('ul', { className: styles.floorList });

        this._container.appendChild(this._list);
    }

    _onGetFloors(floors) {
        this._floors = floors.reverse();
        this._list.innerHTML = '';
        for (let i = 0; i < floors.length; i += 1) {
            const liDom = createElement('li', {
                textContent: floors[i].nameEn,
                className: styles.floorItem,
            });

            liDom.addEventListener('click', () => {
                this.fire('change', {
                    from: this._map.currentFloor,
                    to: floors[i].flId,
                });
            });

            this._list.appendChild(liDom);
        }
    }

    _onChangeFloor() {
        const floorId = this._map.currentFloor;
        let index = -1;
        const childrenList = this._list.children;
        if (!this._isShow) {
            for (let i = 0; i < this._floors.length; i += 1) {
                if (this._floors[i].flId === floorId) {
                    childrenList[0].textContent = this._floors[i].nameEn;
                    return;
                }
            }
        }

        for (let i = 0; i < childrenList.length; i += 1) {
            if (this._floors[i].flId === floorId) {
                index = i;
                childrenList[i].classList.add(styles.active);
            } else {
                childrenList[i].classList.remove(styles.active);
            }
        }

        index !== -1 && this._animateScrollByIndex(index);
    }

    _animateScrollByIndex(index) {
        if (this._list.children.length === 0) {
            return;
        }
        this._animator && this._animator.stop();
        const item = this._list.children[0];
        const itemHeight = item.offsetHeight;
        const start = this._list.scrollTop;
        let end = itemHeight * (index - 1);
        end = end < 0 ? 0 : end;
        if (start === end) {
            return;
        }
        this._animator = AnimatorFactory.getInstance().ofNumber(start, end, 300);

        this._animator.on('update', ({ num }) => {
            this._list.scrollTop = num;
        }).on('complete', () => {
            delete this._animator;
        }).start();
    }

    hide() {
        this._isShow = false;
        this._list.innerHTML = '';
        for (let i = 0; i < this._floors.length; i += 1) {
            if (this._floors[i].flId === this._map.currentFloor) {
                const liDom = createElement('li', {
                    textContent: this._floors[i].nameEn,
                    className: `${styles.floorItem} ${styles.active}`,
                });

                this._list.appendChild(liDom);
            }
        }
    }

    show() {
        this._isShow = true;

        this._onGetFloors(Array.from(this._floors).reverse());
        this._onChangeFloor();
    }


    addTo(map) {
        super.addTo(map);

        this._map.on('getFloors', this._onGetFloors);
        this._map.on('changeFloor', this._onChangeFloor);
    }

    destroy() {
        super.destroy();

        this._map.off('getFloors', this._onGetFloors);
        this._map.off('changeFloor', this._onChangeFloor);

        delete this._map;
    }
}

export default FloorControl;
