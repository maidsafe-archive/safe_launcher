import ActionTypes from '../actions/action_types';

const ToasterQueue = [];
const initialState = {
  active: false,
  hasNext: false,
  message: '',
  options: {}
};

const toaster = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.SHOW_TOASTER: {
      const currentPath = window.location.hash.split('?')[0];
      // Don't show toaster at splash screen
      if (currentPath === '#/') {
        return state;
      }
      ToasterQueue.unshift(action);
      if (state.active) {
        return { ...state, hasNext: true };
      }
      const currentToast = ToasterQueue.pop();
      return {
        ...state,
        active: true,
        message: currentToast.message,
        options: currentToast.options,
        hasNext: (ToasterQueue.length !== 0)
      };
    }
    case ActionTypes.SHOW_NEXT_TOASTER: {
      const currentToast = ToasterQueue.pop();
      if (!currentToast) {
        return state;
      }
      return {
        ...state,
        active: true,
        message: currentToast.message,
        options: currentToast.options,
        hasNext: (ToasterQueue.length !== 0)
      };
    }
    case ActionTypes.HIDE_TOASTER: {
      return {
        ...state,
        active: false,
        message: '',
        options: {},
        hasNext: (ToasterQueue.length !== 0)
      };
    }
    default:
      return state;
  }
};

export default toaster;
