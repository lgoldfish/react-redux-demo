export function isString(str) {
    return typeof str === 'string';
}

export function isNumber(num) {
    return typeof num === 'number';
}

export function isArray(arr) {
    return Array.isArray(arr);
}

export async function sleep(ms = 0) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function isFunction(fun) {
    return typeof fun === 'function';
}

export function isUndefined(pra) {
    return typeof pra === 'undefined';
}

export function bindAll(fns, context) {
    if(isArray(fns) && context) {
        for(let i =0; i<fns.length; i++) {
            context[fns[i]] = context[fns[i]].bind(context);
        }
    } else {
        console.error('bindAll: failed');
    }
}