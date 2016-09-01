import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import networkStatus from './network_status_reducer';
import proxy from './proxy_reducer';
import auth from './auth_reducer';
import user from './user_reducer';

const rootReducer = combineReducers({
  networkStatus,
  proxy,
  auth,
  user,
  routing
});

export default rootReducer;
