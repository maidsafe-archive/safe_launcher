import ActionTypes from '../actions/action_types';

let ToasterQueue = [];

let initialState = {
  active: false,
  hasNext: false,
  message: null,
  options: null
};

const toaster = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.SHOW_TOASTER: {
      ToasterQueue.unshift(action);
      if (state.active) {
        return { ...state, hasNext: true };
      }
      let currentToast = ToasterQueue.pop();
      return { ...state, active: true, message: currentToast.message, options: currentToast.options, hasNext: (ToasterQueue.length !== 0) };
      break;
    }
    case ActionTypes.SHOW_NEXT_TOASTER:
      let currentToast = ToasterQueue.pop();
      if (!currentToast) {
        return state;
      }
      return { ...state, active: true, message: currentToast.message, options: currentToast.options, hasNext: (ToasterQueue.length !== 0) };
      break;
    case ActionTypes.HIDE_TOASTER: {
      return { ...state, active: false, message: null, options: null };
      break;
    }
    default:
      return state;
  }
};

export default toaster;
