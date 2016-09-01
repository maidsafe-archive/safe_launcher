import { setNetworkDisconnected, setNetworkConnected, setNetworkConnecting } from './actions/network_status_action';
import { setProxy } from './actions/proxy_action';
import { showAuthRequest, addApplication, addActivity, updateActivity, setDownloadData, setUploadData,
  setUnAuthStateData, setAuthStateData, setDashGetCount, setDashPostCount, setDashDeleteCount, setDashPutCount, updateAccountStorage,
  fetchingAccountStorage } from './actions/app_action';

import { CONSTANT } from './constant';

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
    this.intervals.map(interval => {
      window.clearInterval(interval)
    })
  }

  onAuthFetchComplete(target, oldVal, newVal) {
    let self = this;
    self.authorisedData[target].oldVal = oldVal;
    self.authorisedData[target].newVal = newVal;
    console.log(target, oldVal, newVal);
    let temp = {};
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
    let self = this;

    self.intervals.push(window.setInterval(function () {
      window.msl.fetchGetsCount(function(err, data) {
        if (err) {
          return;
        }
        self.dispatch(setUnAuthStateData(data));
      });
    }, CONSTANT.FETCH_DELAY))
  }

  fetchStatsForAuthorisedClient() {
    let self = this;

    self.intervals.push(window.setInterval(function () {
      window.msl.fetchGetsCount(function(err, data) {
        if (err) {
          return;
        }
        self.completeCount++;
        self.onAuthFetchComplete('GET', self.state().user.dashData.getsCount, data);
        self.dispatch(setDashGetCount(data));
      });
      window.msl.fetchDeletesCount(function(err, data) {
        if (err) {
          return;
        }
        self.completeCount++;
        self.onAuthFetchComplete('DELETE', self.state().user.dashData.deletesCount, data);
        self.dispatch(setDashDeleteCount(data));
      });
      window.msl.fetchPostsCount(function(err, data) {
        if (err) {
          return;
        }
        self.completeCount++;
        self.onAuthFetchComplete('POST', self.state().user.dashData.postsCount, data);
        self.dispatch(setDashPostCount(data));
      });
      window.msl.fetchPutsCount(function(err, data) {
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
    let self = this;
    self.intervals.push(window.setInterval(() => {
      self.updateAccountStorage();
    }, CONSTANT.ACCOUNT_FETCH_INTERVAL));
  }

  handleNetworkEvents() {
    let self = this;

    window.msl.setNetworkStateChangeListener((status) => {
      switch (status) {
        case 0:
          self.dispatch(setNetworkConnecting());
          break;
        case 1:{
          self.dispatch(setProxy());
          if (!self.state().auth.authenticated) {
            self.fetchStatsForUnauthorisedClient();
          } else {
            self.clearIntervals();
            self.fetchStatsForAuthorisedClient();
            self.updateAccountStorage();
            self.fetchAccountStorage();
          }
          self.dispatch(setNetworkConnected());
          break;
        }
        case 2:
          self.dispatch(setNetworkDisconnected());
          break;
        default:
      }
    });
  }

  handleAPIServer() {
    window.msl.startServer();

    window.msl.onServerError((err) => {
      return console.error('API Server Error :: ', err);
    });

    window.msl.onServerStarted(() => {
      return console.log('API Server Started');
    });

    window.msl.onServerShutdown((data) => {
      return console.log('API Server Stopped :: ', data);
    });
  }

  handleProxyServer() {
    window.msl.onProxyStart(() => {
      return console.log('Proxy Server Started');
    });

    window.msl.onProxyError((err) => {
      return console.error('Proxy Server Error :: ', err);
    });

    window.msl.onProxyExit(() => {
      return console.log('Proxy Server Stopped');
    });
  }

  handleAppSession() {
    let self = this;

    window.msl.onSessionCreated((appData) => {
      self.dispatch(addApplication(appData));
    });

    window.msl.onSessionCreationFailed((err) => {
      return console.error('Failed to create App Session :: ', err);
    });

    window.msl.onSessionRemoved((data) => {
      return console.error('Removed App Session :: ', data);
    });
  }

  handleAuthRequest() {
    let self = this;
    window.msl.onAuthRequest((payload) => {
      window.msl.focusWindow();
      self.dispatch(showAuthRequest(payload));
    });
  }

  handleDataTransfer() {
    let self = this;
    window.msl.onUploadEvent(function(data) {
      if (!data) {
        return;
      }
      self.dispatch(setUploadData(data));
    });

    window.msl.onDownloadEvent(function(data) {
      if (!data) {
        return;
      }
      self.dispatch(setDownloadData(data));
    });
  }

  handleActivityEvents() {
    let self = this;
    window.msl.onNewAppActivity((data) => {
      if (!data) {
        return;
      }
      self.dispatch(addActivity(data));
    });

    window.msl.onUpdatedAppActivity((data) => {
      if (!data) {
        return;
      }
      self.dispatch(updateActivity(data));
    });
  }


  run() {
    this.handleNetworkEvents();
    this.handleAPIServer();
    this.handleProxyServer();
    this.handleAppSession();
    this.handleDataTransfer();
    this.handleActivityEvents();
    this.handleAuthRequest();
  }
}
