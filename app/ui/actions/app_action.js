import ActionTypes from './action_types';
import sessionManager from '../../ffi/util/session_manager';

const authorisationResponse = (payload, status) => {
  window.msl.authResponse(payload, status);
};

export const updateAccountStorageSuccess = data => ({
  type: ActionTypes.UPDATE_ACCOUNT_STORAGE,
  data
});

export const showAppDetailPage = appId => {
  const currentAppLogs = window.msl.getAppActivityList(appId);
  return {
    type: ActionTypes.SHOW_APP_DETAIL_PAGE,
    appId,
    currentAppLogs
  };
};

export const hideAppDetailPage = () => ({
  type: ActionTypes.HIDE_APP_DETAIL_PAGE
});

export const showAuthRequest = (payload) => ({
  type: ActionTypes.SHOW_AUTH_REQUEST,
  payload
});

export const showNextAuthRequest = (payload, status) => {
  authorisationResponse(payload, status);
  return {
    type: ActionTypes.SHOW_NEXT_AUTH_REQUEST,
    payload
  };
};

export const hideAuthRequest = (payload, status) => {
  authorisationResponse(payload, status);
  return {
    type: ActionTypes.HIDE_AUTH_REQUEST
  };
};

export const addApplication = app => ({
  type: ActionTypes.ADD_APPLICATION,
  app
});

export const revokeApplication = appId => {
  window.msl.removeSession(appId);
  return {
    type: ActionTypes.REVOKE_APPLICATION,
    appId
  };
};

export const addActivity = activityLog => ({
  type: ActionTypes.ADD_ACTIVITY,
  activityLog
});

export const updateActivity = activityLog => ({
  type: ActionTypes.UPDATE_ACTIVITY,
  activityLog
});

export const setLogsFilter = fields => ({
  type: ActionTypes.SET_LOGS_FILTER,
  fields
});

export const resetLogsFilter = () => ({
  type: ActionTypes.RESET_LOGS_FILTER
});

export const setDownloadData = downloadData => ({
  type: ActionTypes.SET_DOWNLOAD_DATA,
  downloadData
});

export const setUploadData = uploadData => ({
  type: ActionTypes.SET_UPLOAD_DATA,
  uploadData
});

export const setUnAuthStateData = data => ({
  type: ActionTypes.SET_UNAUTH_STATE_DATA,
  data
});

export const setAuthStateData = data => ({
  type: ActionTypes.SET_AUTH_STATE_DATA,
  data
});

export const setDashGetCount = data => ({
  type: ActionTypes.SET_DASH_GET_COUNT,
  data
});

export const setDashPostCount = data => ({
  type: ActionTypes.SET_DASH_POST_COUNT,
  data
});

export const setDashDeleteCount = data => ({
  type: ActionTypes.SET_DASH_DELETE_COUNT,
  data
});

export const setDashPutCount = data => ({
  type: ActionTypes.SET_DASH_PUT_COUNT,
  data
});

export const fetchingAccountStorage = () => ({
  type: ActionTypes.FETCHING_ACCOUNT_STORAGE
});

export const updateAccountStorage = () => (
  dispatch => {
    dispatch(fetchingAccountStorage());
    sessionManager.getAccountInfo()
      .then(data => {
        dispatch(updateAccountStorageSuccess(data));
      })
      .catch(err => {
        console.error(err);
        // dispatch(updateAccountStorageSuccess({}))
      });
  }
);

export const decAccountUpdateTimeout = () => ({
  type: ActionTypes.DEC_ACCOUNT_UPDATE_TIMEOUT
});

export const setLastUpdateFromNow = () => ({
  type: ActionTypes.SET_LAST_UPDATE_FROM_NOW
});
