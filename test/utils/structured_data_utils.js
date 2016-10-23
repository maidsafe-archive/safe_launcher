import Utils from './utils';
import { CONSTANTS } from '../constants';

class StructUtils extends Utils {
  create(token, name, typeTag, cipherOpts, data, version, config) {
    const body = {};
    if (name) {
      body.name = name;
    }
    if (typeTag) {
      body.typeTag = typeTag;
    }
    if (cipherOpts) {
      body.cipherOpts = cipherOpts;
    }
    if (data) {
      body.data = data;
    }
    if (version) {
      body.version = version;
    }
    return this.sendRequest(this.HTTP_METHOD.POST, CONSTANTS.API.STRUCT, token, body, config);
  }
  getHandle(token, dataHandleId, config) {
    const url = `${CONSTANTS.API.STRUCT}handle/${dataHandleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  getMetadata(token, handleId, config) {
    const url = `${CONSTANTS.API.STRUCT}metadata/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  asDataId(token, handleId, config) {
    const url = `${CONSTANTS.API.STRUCT}data-id/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  update(token, handleId, cipherOpts, data, config) {
    const url = `${CONSTANTS.API.STRUCT}${handleId}`;
    const body = {};
    if (cipherOpts) {
      body.cipherOpts = cipherOpts;
    }
    if (data) {
      body.data = data;
    }
    return this.sendRequest(this.HTTP_METHOD.PATCH, url, token, body, config);
  }

  read(token, handleId, version, config) {
    const url = `${CONSTANTS.API.STRUCT}${handleId}/${version || ''}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  delete(token, handleId, config) {
    const url = `${CONSTANTS.API.STRUCT}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }

  serialise(token, handleId, config) {
    const url = `${CONSTANTS.API.STRUCT}serialise/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  deserialise(token, body, config) {
    const url = `${CONSTANTS.API.STRUCT}deserialise`;
    return this.sendRequest(this.HTTP_METHOD.POST, url, token, body, config);
  }

  isSizeValid(token, handleId, config) {
    const url = `${CONSTANTS.API.STRUCT}validate-size/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.GET, url, token, config);
  }

  put(token, handleId, config) {
    const url = `${CONSTANTS.API.STRUCT}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.PUT, url, token, null, config);
  }

  post(token, handleId, config) {
    const url = `${CONSTANTS.API.STRUCT}${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.POST, url, token, null, config);
  }

  dropHandle(token, handleId, config) {
    const url = `${CONSTANTS.API.STRUCT}handle/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }

  makeStructuredDataUnclaimable(token, handleId, config) {
    const url = `${CONSTANTS.API.STRUCT}unclaim/${handleId}`;
    return this.sendRequest(this.HTTP_METHOD.DELETE, url, token, config);
  }
}

const structUtils = new StructUtils();

export default structUtils;
