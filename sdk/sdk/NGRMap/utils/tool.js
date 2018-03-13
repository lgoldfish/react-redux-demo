import * as DOM from '../dom/DOM';
import { isString, isArray } from './lang';
import styles from './style.css';
import { Spinner } from './spin.min.js'; 

const spinner = new Spinner();

export function loading() {
    const dom = DOM.createElement('div', {
        className: styles.loading,
        id: 'tool-loading',
    });
    spinner.spin(dom);
    document.body.appendChild(dom);
}

export function hideLoading() {
    spinner.stop();
    const dom = document.getElementById('tool-loading');
    dom && dom.remove();
}

export function hideTip() {
    const dom = document.getElementById('tool-tip');

    dom && dom.remove();
}

export function tip(text, time = 2000) {
    const dom = DOM.createElement('div', {
        className: styles.tipContainer,
        id: 'tool-tip',
    });

    const tipContent = DOM.createElement('div', {
        className: styles.tipContent,
    });

    let arr = [];
    if (isString(text)) {
        arr.push(text);
    } else if (isArray(text)) {
        arr = text;
    }

    for (let i = 0; i < arr.length; i += 1) {
        const textSpan = DOM.createElement('span', {
            className: 'textSpan',
            textContent: arr[i].toString(),
        });
        const br = DOM.createElement('br');
        tipContent.appendChild(textSpan);
        tipContent.appendChild(br);
    }

    dom.appendChild(tipContent);

    document.body.appendChild(dom);
    if (time !== 0) {
        setTimeout(hideTip, time);
    }
}
