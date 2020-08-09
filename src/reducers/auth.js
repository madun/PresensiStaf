import * as actionType from '../actions/auth/authType';

const initialState = {
  isLoggedIn: false,
};

const auth = (state = initialState, action) => {
  switch (action.type) {
    case actionType.SET_ISLOGGEDIN:
      return {
        ...state,
        isLoggedIn: action.status,
      };
    default:
      return state;
  }
};

export default auth;
