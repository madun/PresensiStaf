import {combineReducers} from 'redux';
import auth from './auth';

export default combineReducers({
  authReducer: auth,
});
