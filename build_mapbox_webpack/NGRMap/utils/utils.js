export function bindAll(arr, context) {
    for (let i = 0; i < arr.length; i += 1) {
        context[arr[i]] = context[arr[i]].bind(context);
    }
}

export function getMaxByArray(arr) {
    let max = arr[0];
    for (let i = 1; i < arr.length; i += 1) {
        if (max < arr[i]) {
            max = arr[i];
        }
    }

    return max;
}

export function getMinByArray(arr) {
    let min = arr[0];
    for (let i = 0; i < arr.length; i += 1) {
        if (min > arr[i]) {
            min = arr[i];
        }
    }

    return min;
}

export function parseUrl(url) {
    const praStr = url.split('?')[1];
    if (!praStr) {
        return { };
    }
    const praArr = praStr.split('&');
    const res = {};
    for (let i = 0; i < praArr.length; i += 1) {
        const arr = praArr[i].split('=');
        res[arr[0]] = arr[1];
    }

    return res;
}

export function getNumByStr(str) {
    const reg = /[0-9]/ig;
    const matchRes = str.match(reg);
    if (matchRes) {
        return Number(matchRes.join(''));
    }

    return '';
}
