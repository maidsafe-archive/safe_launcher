import Utils from './utils';
import { CONSTANTS } from '../constants';

class CipherUtils extends Utils {
  getHandle(token, encType, keyHandle, config) {
    const url = `${CONSTANTS.API.CIPHER}${encType}/${keyHandle || ''}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  dropHandle(token, handleId, config) {
    const url = `${CONSTANTS.API.CIPHER}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }
}

const cipherUtils = new CipherUtils();

export default cipherUtils;
