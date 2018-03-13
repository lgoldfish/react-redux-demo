import request from '../request/request';
import { isString } from '../utils/lang';

class DataSource {
    constructor(apiBaseUrl) {
        if (!isString(apiBaseUrl)) {
            throw new Error('DataSource: apiBaseUrl is required');
        }
        this._server = apiBaseUrl;
    }

    requestFloors(buildingId) {
        const url = `${this._server}floor/bybuilding/${buildingId}`;
        return request.get(url);
    }

    searchPOI(id, keyword) {
        const url = `${this._server}poi/search`;
        return request.get(url, { query: { Id: id, keyword } });
    }
}

export default DataSource;
