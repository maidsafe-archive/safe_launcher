import ActionTypes from './action_types';
import { CONSTANT } from '../constant';

export const nextToaster = () => (
  {
    type: ActionTypes.SHOW_NEXT_TOASTER
  }
);

export const showToaster = (message, options) => (
  {
    type: ActionTypes.SHOW_TOASTER,
    message,
    options
  }
);

export const hideToaster = () => (
  {
    type: ActionTypes.HIDE_TOASTER
  }
);

export const showNextToaster = () => (
  dispatch => {
    dispatch(hideToaster());
    let timer = setTimeout(() => {
      dispatch(nextToaster());
      clearTimeout(timer);
    }, CONSTANT.TOASTER_INTERVAL);
  }
);
