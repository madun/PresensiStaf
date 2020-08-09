import React, {Component} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {RED} from './color';

class LoadingOverlay extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          right: 0,
          bottom: 0,
          top: 0,
          left: 0,
        }}>
        <View
          style={{
            // height: 100,
            // width: 100,
            paddingVertical: 16,
            paddingHorizontal: 14,
            backgroundColor: 'white',
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <ActivityIndicator color={RED} size="large" />
          <Text
            style={{
              fontSize: 18,
              color: 'gray',
              marginTop: 16,
              fontWeight: 'bold',
            }}>
            {this.props.label}
          </Text>
        </View>
      </View>
    );
  }
}

export default LoadingOverlay;
