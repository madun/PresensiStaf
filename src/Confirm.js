import React, {Component} from 'react';
import {View, Text, ActivityIndicator, TouchableOpacity} from 'react-native';
import {RED} from './color';

class Confirm extends Component {
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
          zIndex: 10,
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
          <Text
            style={{
              fontSize: 18,
              color: 'gray',
              marginTop: 16,
              fontWeight: 'bold',
            }}>
            {this.props.label}
          </Text>
          <View style={{flexDirection: 'row', marginTop: 32}}>
            <TouchableOpacity
              onPress={this.props.onNo}
              style={{paddingHorizontal: 16, paddingVertical: 8}}>
              <Text>Tidak</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this.props.onYes}
              style={{paddingHorizontal: 16, paddingVertical: 8}}>
              <Text style={{fontWeight: 'bold', color: 'red'}}>
                Ya, Clock Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

export default Confirm;
