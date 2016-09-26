import moment from 'moment';
import ActionTypes from '../actions/action_types';
import { CONSTANT } from '../constant';
import { LOG_STATUS } from '../utils/app_utils';

const AuthRequestQueue = [];
const LOG_FILTER_INITIAL = [
  LOG_STATUS[0].code,
  LOG_STATUS[1].code,
  LOG_STATUS['-1'].code
];

const initialState = {
  appList: {},
  appLogs: [],
  logFilter: LOG_FILTER_INITIAL,
  appDetailPageVisible: false,
  revokedAppList: {},
  currentApp: null,
  currentAppLogs: [],
  showAuthRequest: false,
  authRequestPayload: {},
  authRequestHasNext: false,
  unAuthGET: [],
  authHTTPMethods: [],
  accountStorage: {
    fetching: false,
    lastUpdated: null,
    lastUpdatedFromNow: null,
    updateTimeout: 0,
    used: 0,
    available: 0
  },
  dashData: {
    getsCount: 0,
    putsCount: 0,
    postsCount: 0,
    deletesCount: 0,
    upload: 0,
    download: 0
  }
};

const user = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.SHOW_APP_DETAIL_PAGE: {
      const currentAppLogs = action.currentAppLogs.slice();
      currentAppLogs.sort((a, b) => b.beginTime - a.beginTime);
      const app = state.appList[action.appId];
      return {
        ...state,
        appDetailPageVisible: true,
        currentAppLogs,
        currentApp: {
          ...app,
          permissions: app.permissions.slice(),
          status: {
            ...app.status
          }
        }
      };
    }
    case ActionTypes.HIDE_APP_DETAIL_PAGE: {
      return { ...state, appDetailPageVisible: false, currentApp: null, currentAppLogs: [] };
    }
    case ActionTypes.SHOW_AUTH_REQUEST: {
      AuthRequestQueue.unshift(action.payload);
      if (state.showAuthRequest) {
        return { ...state, authRequestHasNext: true };
      }
      const currentReq = AuthRequestQueue.pop();
      return {
        ...state,
        showAuthRequest: true,
        authRequestPayload: currentReq,
        authRequestHasNext: (AuthRequestQueue.length !== 0)
      };
    }
    case ActionTypes.SHOW_NEXT_AUTH_REQUEST: {
      const currentReq = AuthRequestQueue.pop();
      return {
        ...state,
        showAuthRequest: true,
        authRequestPayload: currentReq,
        authRequestHasNext: (AuthRequestQueue.length !== 0)
      };
    }
    case ActionTypes.HIDE_AUTH_REQUEST: {
      return { ...state, showAuthRequest: false, authRequestPayload: Object.assign({}) };
    }
    case ActionTypes.ADD_APPLICATION: {
      const appList = { ...state.appList };
      appList[action.app.id] = {
        id: action.app.id,
        name: action.app.info.appName,
        version: action.app.info.appVersion,
        vendor: action.app.info.vendor,
        permissions: action.app.info.permissions.list,
        status: {
          beginTime: (new Date()).getTime(),
          activityName: 'Authorisation',
          activityStatus: 1
        },
        lastActive: (new Date()).getTime()
      };
      return { ...state, appList };
    }
    case ActionTypes.REVOKE_APPLICATION: {
      const appList = {};
      let list = null;
      let key = null;
      for (key of Object.keys(state.appList)) {
        list = state.appList[key];
        appList[key] = {
          ...list,
          status: { ...list.status },
          permissions: list.permissions.slice()
        };
      }
      const revokedAppList = { ...state.revokedAppList };
      revokedAppList[action.appId] = appList[action.appId].name;

      delete appList[action.appId];
      return {
        ...state,
        appList,
        appDetailPageVisible: false,
        currentApp: null,
        revokedAppList
      };
    }
    case ActionTypes.LOGOUT: {
      return initialState;
    }
    case ActionTypes.ADD_ACTIVITY: {
      const newActivity = {
        ...action.activityLog.activity,
        app: action.activityLog.app,
        appName: action.activityLog.appName
      };
      const appLogs = state.appLogs.slice();
      appLogs.unshift(newActivity);
      return { ...state, appLogs };
    }
    case ActionTypes.UPDATE_ACTIVITY: {
      const appLogs = state.appLogs.slice();
      const activityIndex = appLogs.map(obj => obj.activityId)
        .indexOf(action.activityLog.activity.activityId);
      appLogs.splice(activityIndex, 1);
      const activity = {
        ...action.activityLog.activity,
        app: action.activityLog.app,
        appName: action.activityLog.appName
      };
      appLogs.unshift(activity);

      const currentAppLogs = state.currentAppLogs.slice();
      if (state.appDetailPageVisible && (state.currentApp.id === action.activityLog.app)) {
        const currentAppActivityIndex = currentAppLogs.map(obj => obj.activityId)
          .indexOf(action.activityLog.activity.activityId);
        if (currentAppActivityIndex !== -1) {
          currentAppLogs.splice(currentAppActivityIndex, 1);
        }
        currentAppLogs.unshift(activity);
      }

      const appList = {};
      let list = null;
      let key = null;
      for (key of Object.keys(state.appList)) {
        list = state.appList[key];
        appList[key] = {
          ...list,
          status: { ...list.status },
          permissions: list.permissions.slice()
        };
      }
      if (action.activityLog.app) {
        appList[action.activityLog.app].status.activityName = activity.activityName;
        appList[action.activityLog.app].status.beginTime = activity.beginTime;
        appList[action.activityLog.app].status.activityStatus = activity.activityStatus;
      }
      return { ...state, appLogs, currentAppLogs, appList };
    }
    case ActionTypes.SET_LOGS_FILTER: {
      return { ...state, logFilter: action.fields };
    }
    case ActionTypes.RESET_LOGS_FILTER: {
      return { ...state, logFilter: LOG_FILTER_INITIAL.slice() };
    }
    case ActionTypes.SET_UPLOAD_DATA: {
      return {
        ...state,
        dashData: {
          ...state.dashData,
          upload: action.uploadData
        }
      };
    }
    case ActionTypes.SET_DOWNLOAD_DATA: {
      return {
        ...state,
        dashData: {
          ...state.dashData,
          download: action.downloadData
        }
      };
    }
    case ActionTypes.SET_UNAUTH_STATE_DATA: {
      const unAuthGET = state.unAuthGET.slice();
      unAuthGET.push(action.data - state.dashData.getsCount);
      if (unAuthGET.length > 50) {
        unAuthGET.splice(0, 1);
      }
      return {
        ...state,
        unAuthGET,
        dashData: {
          ...state.dashData,
          getsCount: action.data
        }
      };
    }
    case ActionTypes.SET_AUTH_STATE_DATA: {
      let authHTTPMethods = [];
      authHTTPMethods = state.authHTTPMethods.map(obj => Object.assign(obj));
      authHTTPMethods.push(action.data);
      if (authHTTPMethods.length > 50) {
        authHTTPMethods.splice(0, 1);
      }
      return { ...state, authHTTPMethods, dashData: { ...state.dashData } };
    }
    case ActionTypes.SET_DASH_GET_COUNT: {
      return {
        ...state,
        dashData: {
          ...state.dashData,
          getsCount: action.data
        }
      };
    }
    case ActionTypes.SET_DASH_POST_COUNT: {
      return {
        ...state,
        dashData: {
          ...state.dashData,
          postsCount: action.data
        }
      };
    }
    case ActionTypes.SET_DASH_DELETE_COUNT: {
      return {
        ...state,
        dashData: {
          ...state.dashData,
          deletesCount: action.data
        }
      };
    }
    case ActionTypes.SET_DASH_PUT_COUNT: {
      return {
        ...state,
        dashData: {
          ...state.dashData,
          putsCount: action.data
        }
      };
    }
    case ActionTypes.FETCHING_ACCOUNT_STORAGE:
      return {
        ...state,
        accountStorage: {
          ...state.accountStorage,
          fetching: true,
          disableUpdate: true
        }
      };
    case ActionTypes.UPDATE_ACCOUNT_STORAGE: {
      const accountInfoLastUpdated = (new Date()).toLocaleString();
      return {
        ...state,
        accountStorage: {
          ...state.accountStorage,
          fetching: false,
          used: isNaN(action.data.used) ? 0 : action.data.used,
          available: isNaN(action.data.available) ? 0 : action.data.available,
          lastUpdated: accountInfoLastUpdated,
          updateTimeout: CONSTANT.ACCOUNT_UPDATE_TIMEOUT
        }
      };
    }
    case ActionTypes.SET_LAST_UPDATE_FROM_NOW:
      return {
        ...state,
        accountStorage: {
          ...state.accountStorage,
          lastUpdatedFromNow: moment(state.accountStorage.lastUpdated).fromNow()
        }
      };
    case ActionTypes.DEC_ACCOUNT_UPDATE_TIMEOUT:
      return {
        ...state,
        accountStorage: {
          ...state.accountStorage,
          updateTimeout: state.accountStorage.updateTimeout !== 0 ?
          state.accountStorage.updateTimeout - 1 : 0,
        }
      };
    default:
      return state;
  }
};

export default user;
