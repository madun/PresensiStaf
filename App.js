/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import reducers from './src/reducers';
import AppRoute from './src/router';

function App() {
  return (
    <Provider store={createStore(reducers)}>
      <AppRoute />
    </Provider>
  );
}

export default App;
