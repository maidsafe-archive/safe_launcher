import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import networkStatus from './network_status_reducer';
import auth from './auth_reducer';
import user from './user_reducer';
import toaster from './toaster_reducer';

const rootReducer = combineReducers({
  networkStatus,
  auth,
  user,
  toaster,
  routing
});

export default rootReducer;
