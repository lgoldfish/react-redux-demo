export function isDom(dom) {
    return dom instanceof HTMLElement;
}

export function createElement(tagName, attrs = {}) {
    if (!tagName || !attrs) {
        return null;
    }

    const dom = document.createElement(tagName);
    for (const key in attrs) {
        dom[key] = attrs[key];
    }

    return dom;
}

export function addClass(dom, className) {
    if (!isDom(dom) || !className) {
        return;
    }

    dom.classList.add(className);
}

export function removeClass(dom, className) {
    if (!isDom(dom) || !className) {
        return;
    }

    dom.classList.remove(className);
}

export function siblings(dom) {
    if (!isDom(dom)) {
        return [];
    }

    const list = dom.parentElement.children;
    const arr = [];
    for (let i = 0; i < list.length; i += 1) {
        if (list[i] !== dom) {
            arr.push(list[i]);
        }
    }

    return arr;
}

export function setStyle(dom, style) {
    if (!isDom(dom) || !style) {
        return;
    }

    for (const key in style) {
        dom.style[key] = style[key];
    }
}

export function setAttribute(dom, attrs) {
    if (!isDom(dom) || !attrs) {
        return;
    }
    for (const key in attrs) {
        dom.setAttribute(key, attrs[key]);
    }
}

export function empty(dom) {
    if (!isDom(dom)) {
        return;
    }

    dom.innerHTML = '';
}
