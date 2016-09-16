import { browserHistory } from 'react-router'
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
import sessionManager from '../ffi/util/session_manager';
import { CONSTANT, MESSAGES } from './constant';

export default class EventRegistry {
  constructor(store, history) {
    this.state = store.getState;
    this.dispatch = store.dispatch;
    this.history = history;
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
  }

  fetchStatsForUnauthorisedClient() {
    const self = this;
    self.intervals.push(window.setInterval(() => {
      const updateGetsCount = async () => {
        try {
          const count = await sessionManager.getClientGetsCount();
          self.dispatch(setUnAuthStateData(count));
        } catch(e) {
          console.error(e);
        }
      }
      updateGetsCount();
    }, CONSTANT.FETCH_DELAY));
  }

  fetchStatsForAuthorisedClient() {
    const self = this;
    self.intervals.push(window.setInterval(() => {
      const fetchCounts = async () => {
        try {
          console.log('Update Client stats');
          const getsCount = await sessionManager.getClientGetsCount();
          const putsCount = await sessionManager.getClientPutsCount();
          const postsCount = await sessionManager.getClientPostsCount();
          const deletesCount = await sessionManager.getClientDeletesCount();
          self.onAuthFetchComplete('GET', self.state().user.dashData.getsCount, getsCount);
          self.onAuthFetchComplete('DELETE', self.state().user.dashData.deletesCount, deletesCount);
          self.onAuthFetchComplete('POST', self.state().user.dashData.postsCount, postsCount);
          self.onAuthFetchComplete('PUT', self.state().user.dashData.putsCount, putsCount);
          let temp = {};
          temp.GET = self.authorisedData.GET.newVal - self.authorisedData.GET.oldVal;
          temp.POST = self.authorisedData.POST.newVal - self.authorisedData.POST.oldVal;
          temp.PUT = self.authorisedData.PUT.newVal - self.authorisedData.PUT.oldVal;
          temp.DELETE = self.authorisedData.DELETE.newVal - self.authorisedData.DELETE.oldVal;
          self.dispatch(setAuthStateData(temp));
          self.dispatch(setDashGetCount(getsCount));
          self.dispatch(setDashPostCount(postsCount));
          self.dispatch(setDashDeleteCount(deletesCount));
          self.dispatch(setDashPutCount(putsCount));
        } catch(e) {
          console.error(e);
        }
      };
      fetchCounts()
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
    const showNetworkToaster = (msg, opt) => {
      const currentPath = window.location.hash.split('?')[0];
      if (currentPath === '#/') {
        return;
      }
      console.log('show')
      return this.dispatch(showToaster(msg, opt));
    };

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
          showNetworkToaster(MESSAGES.NETWORK_CONNECTED, { autoHide: true });
          break;
        }
        case 2:
          this.dispatch(setNetworkDisconnected());
          console.log('test');

          showNetworkToaster(MESSAGES.NETWORK_DISCONNECTED,
            { type: CONSTANT.TOASTER_OPTION_TYPES.NETWORK_RETRY, autoHide: false, error: true });
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

    window.msl.onSessionRemoved(appId => {
      const appName = this.state().user.appList[appId] ?
        this.state().user.appList[appId].name : this.state().user.revokedAppList[appId].name;
      this.dispatch(showToaster(`${MESSAGES.APP_REVOKED} ${appName}`, { autoHide: true }));
      return console.log('Removed App Session :: ', appId);
    });
  }

  handleAuthRequest() {
    window.msl.onAuthRequest(payload => {
      if (this.state().auth.authenticated) {
        window.msl.focusWindow();
        this.history.push('/account_app_list');
        this.dispatch(showAuthRequest(payload));
      } else {
        window.msl.authResponse(payload, false);
      }
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
