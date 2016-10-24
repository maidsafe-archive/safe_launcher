import Utils from './utils';
import { CONSTANTS } from '../constants';

class AppendabelDataUtils extends Utils {
  create(token, name, isPrivate, filterType, filterKeys, config) {
    const body = {};
    if (name) {
      body.name = name;
    }
    if (isPrivate) {
      body.isPrivate = isPrivate;
    }
    if (filterType) {
      body.filterType = filterType;
    }
    if (filterKeys) {
      body.filterKeys = filterKeys;
    }
    return this.sendRequest(this.HTTP_METHOD.POST, CONSTANTS.API.APPEND, token, body, config);
  }

  getMetadata(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}metadata/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  getHandle(token, dataIdHandle, config) {
    const url = `${CONSTANTS.API.APPEND}handle/${dataIdHandle}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  serialise(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}serialise/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  getDataIdHandle(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}data-id/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  isSizeValid(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}validate-size/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  getSigningKeyFromDeletedData(token, handleId, index, config) {
    const url = `${CONSTANTS.API.APPEND}sign-key/deleted-data/${handleId}/${index}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  getSigningKey(token, handleId, index, config) {
    const url = `${CONSTANTS.API.APPEND}sign-key/${handleId}/${index}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  getDeletedDataIdAt(token, handleId, index, config) {
    const url = `${CONSTANTS.API.APPEND}deleted-data/${handleId}/${index}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  getSignKeyFromFilter(token, handleId, index, config) {
    const url = `${CONSTANTS.API.APPEND}filter/${handleId}/${index}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  getDataIdAt(token, handleId, index, config) {
    const url = `${CONSTANTS.API.APPEND}${handleId}/${index}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  toggleFilter(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}toggle-filter/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.PUT, url, token, null, config);
  }

  addToFilter(token, handleId, keys, config) {
    const url = `${CONSTANTS.API.APPEND}filter/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.PUT, url, token, keys, config);
  }

  append(token, handleId, dataIdHandle, config) {
    const url = `${CONSTANTS.API.APPEND}${handleId}/${dataIdHandle}`;
    return this.sendRequest(this.HTTP_METHOD.PUT, url, token, null, config);
  }

  restore(token, handleId, index, config) {
    const url = `${CONSTANTS.API.APPEND}restore/${handleId}/${index}`;
    return this.sendRequest(this.HTTP_METHOD.PUT, url, token, null, config);
  }

  put(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.PUT, url, token, null, config);
  }

  removeFromFilter(token, handleId, keys, config) {
    const url = `${CONSTANTS.API.APPEND}filter/${handleId}`;
    let configuration = {};
    if (keys) {
      if (!configuration) {
        configuration = {};
      }
      configuration.data = keys;
    }
    configuration = Object.assign({}, configuration, config);
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, configuration);
  }

  removeDeletedData(token, handleId, index, config) {
    const url = `${CONSTANTS.API.APPEND}deleted-data/${handleId}/${index}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }

  clearData(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}clear-data/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }

  clearDeletedData(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}clear-deleted-data/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }

  dropHandle(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}handle/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }

  removeAt(token, handleId, index, config) {
    const url = `${CONSTANTS.API.APPEND}${handleId}/${index}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }

  deserialise(token, body, config) {
    const url = `${CONSTANTS.API.APPEND}deserialise`;
    return this.sendRequest(this.HTTP_METHOD.POST, url, token, body, config);
  }

  getEncryptKey(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}encrypt-key/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  dropEncryptKeyHandle(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}encrypt-key/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }

  post(token, handleId, config) {
    const url = `${CONSTANTS.API.APPEND}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.POST, url, token, null, config);
  }
}

const appendableDataUtils = new AppendabelDataUtils();

export default appendableDataUtils;
