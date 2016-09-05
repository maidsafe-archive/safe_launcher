import {
  setNetworkDisconnected,
  setNetworkConnected,
  setNetworkConnecting
} from './actions/network_status_action';
import { setProxy, setProxyError } from './actions/proxy_action';
import { showToaster } from './actions/toaster_action';
import {
  showAuthRequest,
  addApplication,
  addActivity,
  updateActivity,
  setDownloadData,
  setUploadData,
  setUnAuthStateData,
  setAuthStateData,
  setDashGetCount,
  setDashPostCount,
  setDashDeleteCount,
  setDashPutCount,
  updateAccountStorage
} from './actions/app_action';

import { CONSTANT, MESSAGES } from './constant';

export default class EventRegistry {
  constructor(store) {
    this.state = store.getState;
    this.dispatch = store.dispatch;
    this.intervals = [];
    this.completeCount = 0;
    this.authorisedData = {
      GET: {
        oldVal: 0,
        newVal: 0
      },
      POST: {
        oldVal: 0,
        newVal: 0
      },
      PUT: {
        oldVal: 0,
        newVal: 0
      },
      DELETE: {
        oldVal: 0,
        newVal: 0
      }
    };
  }

  clearIntervals() {
    this.intervals.map(interval => window.clearInterval(interval));
  }

  onAuthFetchComplete(target, oldVal, newVal) {
    const self = this;
    self.authorisedData[target].oldVal = oldVal;
    self.authorisedData[target].newVal = newVal;
    const temp = {};
    if (self.completeCount === 4) {
      temp.GET = self.authorisedData.GET.newVal - self.authorisedData.GET.oldVal;
      temp.POST = self.authorisedData.POST.newVal - self.authorisedData.POST.oldVal;
      temp.PUT = self.authorisedData.PUT.newVal - self.authorisedData.PUT.oldVal;
      temp.DELETE = self.authorisedData.DELETE.newVal - self.authorisedData.DELETE.oldVal;
      self.completeCount = 0;
      self.dispatch(setAuthStateData(temp));
    }
  }

  fetchStatsForUnauthorisedClient() {
    const self = this;
    self.intervals.push(window.setInterval(() => {
      window.msl.fetchGetsCount((err, data) => {
        if (err) {
          return;
        }
        self.dispatch(setUnAuthStateData(data));
      });
    }, CONSTANT.FETCH_DELAY));
  }

  fetchStatsForAuthorisedClient() {
    const self = this;

    self.intervals.push(window.setInterval(() => {
      window.msl.fetchGetsCount((err, data) => {
        if (err) {
          return;
        }
        self.completeCount++;
        self.onAuthFetchComplete('GET', self.state().user.dashData.getsCount, data);
        self.dispatch(setDashGetCount(data));
      });
      window.msl.fetchDeletesCount((err, data) => {
        if (err) {
          return;
        }
        self.completeCount++;
        self.onAuthFetchComplete('DELETE', self.state().user.dashData.deletesCount, data);
        self.dispatch(setDashDeleteCount(data));
      });
      window.msl.fetchPostsCount((err, data) => {
        if (err) {
          return;
        }
        self.completeCount++;
        self.onAuthFetchComplete('POST', self.state().user.dashData.postsCount, data);
        self.dispatch(setDashPostCount(data));
      });
      window.msl.fetchPutsCount((err, data) => {
        if (err) {
          return;
        }
        self.completeCount++;
        self.onAuthFetchComplete('PUT', self.state().user.dashData.putsCount, data);
        self.dispatch(setDashPutCount(data));
      });
    }, CONSTANT.FETCH_DELAY));
  }

  updateAccountStorage() {
    this.dispatch(updateAccountStorage());
  }

  fetchAccountStorage() {
    this.intervals.push(window.setInterval(() => {
      this.updateAccountStorage();
    }, CONSTANT.ACCOUNT_FETCH_INTERVAL));
  }

  handleNetworkEvents() {
    window.msl.setNetworkStateChangeListener((status) => {
      switch (status) {
        case 0:
          this.dispatch(setNetworkConnecting());
          break;
        case 1: {
          if (!this.state().auth.authenticated) {
            this.fetchStatsForUnauthorisedClient();
          } else {
            this.clearIntervals();
            this.fetchStatsForAuthorisedClient();
            this.updateAccountStorage();
            this.fetchAccountStorage();
          }
          this.dispatch(setNetworkConnected());
          this.dispatch(showToaster(MESSAGES.NETWORK_CONNECTED, { autoHide: true }));
          break;
        }
        case 2:
          this.dispatch(setNetworkDisconnected());
          this.dispatch(showToaster(MESSAGES.NETWORK_DISCONNECTED,
            { type: CONSTANT.TOASTER_OPTION_TYPES.NETWORK_RETRY, autoHide: false, error: true }));
          break;
        default:
      }
    });
  }

  handleAPIServer() {
    window.msl.startServer();

    window.msl.onServerError((err) => console.error('API Server Error :: ', err));

    window.msl.onServerStarted(() => console.warn('API Server Started'));

    window.msl.onServerShutdown((data) => console.warn('API Server Stopped :: ', data));
  }

  handleProxyServer() {
    window.msl.onProxyStart(() => console.warn('Proxy Server Started'));

    window.msl.onProxyError(err => {
      this.dispatch(showToaster(MESSAGES.PROXY_SERVER_ERROR, { autoHide: true, error: true }));
      this.dispatch(setProxyError());
      return console.error('Proxy Server Error :: ', err);
    });

    window.msl.onProxyExit(() => console.warn('Proxy Server Stopped'));
  }

  handleAppSession() {
    window.msl.onSessionCreated(appData => this.dispatch(addApplication(appData)));

    window.msl.onSessionCreationFailed(() => console.error('Failed to create App Session'));

    window.msl.onSessionRemoved(data => {
      this.dispatch(showToaster(MESSAGES.APP_REVOKED, { autoHide: true }));
      return console.error('Removed App Session :: ', data);
    });
  }

  handleAuthRequest() {
    window.msl.onAuthRequest(payload => {
      window.msl.focusWindow();
      this.dispatch(showAuthRequest(payload));
    });
  }

  handleDataTransfer() {
    window.msl.onUploadEvent((data) => {
      if (!data) {
        return;
      }
      this.dispatch(setUploadData(data));
    });

    window.msl.onDownloadEvent((data) => {
      if (!data) {
        return;
      }
      this.dispatch(setDownloadData(data));
    });
  }

  handleActivityEvents() {
    window.msl.onNewAppActivity(data => {
      if (!data) {
        return;
      }
      this.dispatch(addActivity(data));
    });

    window.msl.onUpdatedAppActivity(data => {
      if (!data) {
        return;
      }
      this.dispatch(updateActivity(data));
    });
  }


  run() {
    this.dispatch(setProxy());
    this.handleNetworkEvents();
    this.handleAPIServer();
    this.handleProxyServer();
    this.handleAppSession();
    this.handleDataTransfer();
    this.handleActivityEvents();
    this.handleAuthRequest();
  }
}
