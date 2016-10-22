import mockApp from '../mock_app';

export default class Utils {
  HTTP_METHOD = {
    POST: 'post',
    GET: 'get',
    PUT: 'put',
    DELETE: 'delete',
    HEAD: 'head',
    PATCH: 'patch'
  };

  registerRandomUser() {
    return mockApp.registerRandomUser();
  }

  sendRequest(method, url, authToken, ...arg) {
    const reqHeaders = {};
    let body = null;
    let config = {};

    if (authToken) {
      reqHeaders.Authorization = `Bearer ${authToken}`;
    }

    switch (method) {
      case this.HTTP_METHOD.POST:
        body = arg[0];
        config = Object.assign(config, arg[1] || {});
        config.headers = Object.assign(config.headers || {}, reqHeaders);
        return mockApp.axios.post(url, body, config);
      case this.HTTP_METHOD.GET:
        config = Object.assign(config, arg[0] || {});
        config.headers = Object.assign(config.headers || {}, reqHeaders);
        return mockApp.axios.get(url, config);
      case this.HTTP_METHOD.DELETE:
        config = Object.assign(config, arg[0] || {});
        config.headers = Object.assign(config.headers || {}, reqHeaders);
        return mockApp.axios.delete(url, config);
      case this.HTTP_METHOD.PUT:
        body = arg[0];
        config = Object.assign(config, arg[1] || {});
        config.headers = Object.assign(config.headers || {}, reqHeaders);
        return mockApp.axios.put(url, body, config);
      case this.HTTP_METHOD.PATCH:
        body = arg[0];
        config = Object.assign(config, arg[1] || {});
        config.headers = Object.assign(config.headers || {}, reqHeaders);
        return mockApp.axios.patch(url, body, config);
      case this.HTTP_METHOD.HEAD:
        config = Object.assign(config, arg[0] || {});
        config.headers = Object.assign(config.headers || {}, reqHeaders);
        return mockApp.axios.head(url, config);
      default:
        throw new Error('Invalid method');
    }
  }

  registerAuthorisationListener(callback) {
    mockApp.registerAuthorisationListener(callback);
  }

  approveAppAuthorisation(payload) {
    mockApp.approveAppAuthorisation(payload);
  }

  rejectAppAuthorisation(payload) {
    mockApp.rejectAppAuthorisation(payload);
  }

  removeAuthReqEvent() {
    mockApp.removeAuthReqEvent();
  }
}
