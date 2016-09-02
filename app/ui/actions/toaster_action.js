import ActionTypes from './action_types';
import { CONSTANT } from '../constant';

export const nextToaster = () => {
  return {
    type: ActionTypes.SHOW_NEXT_TOASTER
  }
}

export const showToaster = (message, options) => {
  return {
    type: ActionTypes.SHOW_TOASTER,
    message: message,
    options: options
  }
}

export const hideToaster = () => {
  return {
    type: ActionTypes.HIDE_TOASTER
  }
}

export const showNextToaster = () => {
  return dispatch => {
    dispatch(hideToaster());
    setTimeout(() => {
      dispatch(nextToaster());
    }, CONSTANT.TOASTER_INTERVAL);
  }
}
