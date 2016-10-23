import Utils from './utils';
import { CONSTANTS } from '../constants';

class AuthUtils extends Utils {
  authoriseApp(authPayload, config, authRes) {
    if (typeof authRes !== 'undefined') {
      this.registerAuthorisationListener(payload => {
        authRes ? this.approveAppAuthorisation(payload) :
          this.rejectAppAuthorisation(payload);
        this.removeAuthReqEvent();
      });
    }

    return this.sendRequest(this.HTTP_METHOD.POST, CONSTANTS.API.AUTH, null, authPayload, config);
  }

  revokeApp(authToken) {
    return this.sendRequest(this.HTTP_METHOD.DELETE, CONSTANTS.API.AUTH, authToken);
  }

  registerAndAuthorise(authPayload) {
    return this.registerRandomUser()
      .then(() => this.authoriseApp(authPayload || CONSTANTS.AUTH_PAYLOAD, {}, true))
      .then(res => res.data.token);
  }

  isAuthTokenValid(config) {
    return this.sendRequest(this.HTTP_METHOD.GET, CONSTANTS.API.AUTH, null, config);
  }
}

const authUtils = new AuthUtils();

export default authUtils;
