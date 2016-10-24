import Utils from './utils';
import { CONSTANTS } from '../constants';

class SignKeysUtils extends Utils {
  serialise(token, handleId, config) {
    const url = `${CONSTANTS.API.SIGN_KEY}serialise/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  deserialise(token, data, config) {
    const url = `${CONSTANTS.API.SIGN_KEY}deserialise`;
    return this.sendRequest(this.HTTP_METHOD.POST, url, token, data, config);
  }

  dropHandle(token, handleId, config) {
    const url = `${CONSTANTS.API.SIGN_KEY}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }
}

const signKeysUtils = new SignKeysUtils();

export default signKeysUtils;
