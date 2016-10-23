import Utils from './utils';
import { CONSTANTS } from '../constants';

class ImmutUtils extends Utils {
  getWriterHandle(token, config) {
    const url = `${CONSTANTS.API.IMMUT}writer`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  getReaderHandle(token, handleId, config) {
    const url = `${CONSTANTS.API.IMMUT}reader/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  read(token, handleId, config) {
    const url = `${CONSTANTS.API.IMMUT}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  write(token, handleId, body, config) {
    const url = `${CONSTANTS.API.IMMUT}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.POST, url, token, body, config);
  }

  closeWriter(token, handleId, cipherOptsHandle, config) {
    const url = `${CONSTANTS.API.IMMUT}${handleId}/${cipherOptsHandle}`;
    return this.sendRequest(this.HTTP_METHOD.PUT, url, token, null, config);
  }

  dropWriter(token, handleId, config) {
    const url = `${CONSTANTS.API.IMMUT}writer/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }

  dropReader(token, handleId, config) {
    const url = `${CONSTANTS.API.IMMUT}reader/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }
}

const immutUtils = new ImmutUtils();

export default immutUtils;
