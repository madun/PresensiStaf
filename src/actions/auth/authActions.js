import * as actionType from './authType';

export const setIsLoggedIn = (status) => ({
  type: actionType.SET_ISLOGGEDIN,
  status: status,
});
