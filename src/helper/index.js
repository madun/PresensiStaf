import React from 'react';
import {TouchableWithoutFeedback, Keyboard} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import {showMessage} from 'react-native-flash-message';

// export const API_URL = 'http://whispering-beyond-98519.herokuapp.com';
export const API_URL = 'http://172.20.10.14:8000/api';
// export const API_URL = 'http://192.168.0.16:8000/api';
// export const API_URL = 'http://192.168.139.10:8000/api';

export function Message(title = null, msg, type) {
  showMessage({
    message: title == null ? 'Notifikasi' : title,
    description: msg,
    type: type,
    duration: 4000,
    floating: true,
    // hideStatusBar: true
  });
}

export async function saveItem(item, selectedValue) {
  try {
    await AsyncStorage.setItem(item, JSON.stringify(selectedValue));
  } catch (error) {
    console.log(error);
  }
  console.warn(item);
}

export async function getItem(item) {
  try {
    let store = await AsyncStorage.getItem(item);

    if (store === null) {
      return [];
    }

    return JSON.parse(store);
  } catch (error) {
    console.log(error);
  }
}

export async function removeItem(item) {
  try {
    await AsyncStorage.removeItem(item);
  } catch (error) {
    console.log(error);
  }
}

export const DimissKeyboard = ({children}) => (
  <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
    {children}
  </TouchableWithoutFeedback>
);
