import Utils from './utils';
import { CONSTANTS } from '../constants';

class DataIdUtils extends Utils {
  getDataIdForStructuredData(token, name, typeTag, config) {
    const url = `${CONSTANTS.API.DATA_ID}structured-data`;
    const body = {
      name,
      typeTag
    };
    return this.sendRequest(this.HTTP_METHOD.POST, url, token, body, config);
  }
  getDataIdForAppendableData(token, name, isPrivate, config) {
    const url = `${CONSTANTS.API.DATA_ID}appendable-data`;
    const body = {
      name,
      isPrivate
    };
    return this.sendRequest(this.HTTP_METHOD.POST, url, token, body, config);
  }
  dropHandle(token, handleId, config) {
    const url = `${CONSTANTS.API.DATA_ID}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }
}

const dataIdUtils = new DataIdUtils();

export default dataIdUtils;
