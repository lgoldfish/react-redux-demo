if (!Promise) {
    throw new Error('your browser is not support Promise');
}

function request(url, options = {}, method = 'GET') {
    const xhr = new XMLHttpRequest();
    let requestUrl = url;
    if (options.query) {
        requestUrl = url.replace(/\?/, '');
        const arr = [];
        for (const key in options.query) {
            arr.push(`${key}=${options.query[key]}`);
        }
        requestUrl = `${requestUrl}?${arr.join('&')}`;
    }

    xhr.open(method.toUpperCase(), requestUrl, true);

    let data = null;
    if (options.json) {
        xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
        data = JSON.stringify(options.json);
    }

    if (options.form) {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
        data = options.form;
    }

    if (options.body) {
        data = options.body;
    }

    for (const key in options.headers) {
        xhr.setRequestHeader(key, options.headers[key]);
    }

    options.timeout && (xhr.timeout = options.timeout);

    xhr.send(data);

    return new Promise((resolve, reject) => {
        xhr.onload = () => {
            const resType = xhr.getResponseHeader('Content-Type') || '';
            if (resType.indexOf('application/json') !== -1) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                resolve(xhr.responseText);
            }
        };

        xhr.onerror = (err) => {
            reject(err);
        };

        xhr.ontimeout = () => {
            reject(new Error('timeout'));
        };

        xhr.onabort = () => {
            reject(new Error('abort'));
        };
    });
}

request.get = (url, options) => request(url, options, 'GET');

request.post = (url, options) => request(url, options, 'POST');

request.delete = (url, options) => request(url, options, 'DELETE');

export default request;
