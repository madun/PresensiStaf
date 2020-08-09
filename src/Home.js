import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  ToastAndroid,
  Alert,
} from 'react-native';

import {RED, BLUE} from './color';

import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import {API_URL, getItem, removeItem, Message} from './helper';
import {connect} from 'react-redux';
import {setIsLoggedIn} from './actions/auth/authActions';
import LoadingOverlay from './LoadingOverlay';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      curTime: null,
      location: null,
      loading: false,
      loadingOverlay: false,
      statusAttendance: 'masuk',
      token: null,
      checkinAt: '',
      checkoutAt: '',
      messageLoading: '',
      totalWorkHour: '',
    };
  }

  componentDidMount() {
    setInterval(() => {
      this.getCurrentTime();
    }, 1000);

    this.getStatusForToday();
  }

  getCurrentTime() {
    var d = new Date();
    var h = this.addZero(d.getHours());
    var m = this.addZero(d.getMinutes());
    var s = this.addZero(d.getSeconds());
    this.setState({
      curTime: h + ' : ' + m + ' : ' + s,
    });
  }

  addZero(i) {
    if (i < 10) {
      i = '0' + i;
    }
    return i;
  }

  getStatusForToday() {
    this.setState({
      loadingOverlay: true,
      messageLoading: 'Memuat data',
    });
    getItem('auth').then((auth) => {
      axios
        .get(`${API_URL}/getStateForToday`, {
          headers: {
            Authorization: 'Bearer ' + auth.token,
          },
        })
        .then((res) => {
          if (res.data.hasOwnProperty('msg')) {
          } else {
            if (res.data[0].start != null && res.data[0].end == null) {
              this.setState({
                statusAttendance: 'pulang',
                checkinAt: res.data[0].start,
                checkoutAt: '',
              });
            } else if (res.data[0].start != null && res.data[0].end != null) {
              this.setState({
                statusAttendance: 'beres',
                checkinAt: res.data[0].start,
                checkoutAt: res.data[0].end,
              });
            }
          }
          this.setState({
            loadingOverlay: false,
          });
        })
        .catch((err) => console.warn(err));
    });
  }

  hasLocationPermission = async () => {
    if (
      Platform.OS === 'ios' ||
      (Platform.OS === 'android' && Platform.Version < 23)
    ) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    }

    return false;
  };

  getLocation = async () => {
    const hasLocationPermission = await this.hasLocationPermission();

    if (!hasLocationPermission) {
      return;
    }

    this.setState({loading: true}, () => {
      Geolocation.getCurrentPosition(
        (position) => {
          this.setState({location: position}, () => {
            this.handlePresence(
              position.coords.latitude,
              position.coords.longitude,
            );
          });
        },
        (error) => {
          this.setState({location: error, loading: false});
          console.log(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          distanceFilter: 50,
        },
      );
    });
  };

  handlePresence(lat, lng) {
    let data = {
      lat: lat,
      lng: lng,
    };
    getItem('auth')
      .then((auth) => {
        axios
          .post(`${API_URL}/attendance`, data, {
            headers: {
              Authorization: 'Bearer ' + auth.token,
            },
          })
          .then((res) => {
            this.setState({statusAttendance: 'masuk'});
            if (res.hasOwnProperty('data')) {
              if (res.data.start != null && res.data.end == null) {
                this.setState({
                  statusAttendance: 'pulang',
                  checkinAt: res.data.start,
                });
                Message(
                  'Yeaahhh! 🥳',
                  'Good job! berhasil melakukan Presensi Masuk',
                  'success',
                );
              } else if (res.data.start != null && res.data.end != null) {
                Message(
                  'Presensi hari ini selesai!',
                  'See you tomorrow 🥰',
                  'success',
                );
                this.setState({
                  statusAttendance: 'beres',
                  checkoutAt: res.data.end,
                  totalWorkHour: res.data.hours,
                });
              }
              if (res.data.hasOwnProperty('msg')) {
                Message('Oppss!', `${res.data.msg}`, 'danger');
              }
            }
            this.setState({loading: false});
            console.warn('WH', this.state.totalWorkHour);
          })
          .catch((err) => {
            console.warn('err', err);
            this.setState({loading: false});
          });
      })
      .catch((err) => console.warn('err', err));
  }

  alertClockOut() {
    Alert.alert(
      'Clock Out',
      'Apakah yakin akan mengakhiri Presensi?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'OK', onPress: () => this.getLocation()},
      ],
      {cancelable: false},
    );
  }

  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{flex: 1}}>
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 22,
              backgroundColor: BLUE,
              alignItems: 'center',
              height: 100,
            }}>
            <Image
              style={{
                width: 62,
                height: 62,
                borderRadius: 100,
                marginRight: 16,
                resizeMode: 'center',
              }}
              source={{uri: 'https://i.pravatar.cc/500'}}
            />
            <View>
              <Text style={{color: 'white', fontSize: 18}}>
                Ilman Manarul Qori
              </Text>
            </View>
          </View>
          {/* time line */}
          <View style={{paddingLeft: 28}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <View style={styles.line1}>
                <View style={styles.dot} />
              </View>
              <Text style={{fontSize: 18, fontWeight: 'bold', color: 'green'}}>
                Check In{' '}
                {this.state.checkinAt != '' ? this.state.checkinAt : '-'}
              </Text>
            </View>
            {/* line 2 */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <View style={styles.line2}>
                <View style={styles.dot} />
              </View>
              <Text
                style={{fontSize: 18, fontWeight: 'bold', color: '#dd4b39'}}>
                Check Out{' '}
                {this.state.checkoutAt != '' ? this.state.checkoutAt : '-'}
              </Text>
            </View>
          </View>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 16,
            }}>
            <View style={{marginBottom: 128, alignItems: 'center'}}>
              <Text style={{fontSize: 28}}>{this.state.curTime}</Text>
              <Text style={{fontSize: 18}}>WIB</Text>
            </View>
            <TouchableOpacity
              onPress={
                this.state.checkinAt != '' && this.state.checkoutAt == ''
                  ? this.alertClockOut
                  : this.getLocation
              }
              activeOpacity={0.5}
              disabled={
                this.state.loading || this.state.statusAttendance == 'beres'
              }
              style={{
                backgroundColor:
                  this.state.statusAttendance == 'beres' ? 'grey' : RED,
                borderRadius: 6,
                width: '80%',
                alignItems: 'center',
                height: 50,
                justifyContent: 'center',
              }}>
              {this.state.loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{color: 'white', fontSize: 16}}>
                  {this.state.statusAttendance == 'masuk'
                    ? 'Check In'
                    : this.state.statusAttendance == 'pulang'
                    ? 'Check Out'
                    : 'See you tomorow 😉'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{marginTop: 20}}
              onPress={() => {
                this.setState({
                  loadingOverlay: true,
                  messageLoading: 'Keluar akun',
                });
                setTimeout(() => {
                  this.props.setIsloggedId(false);
                  removeItem('auth');
                  this.setState({
                    loadingOverlay: false,
                  });
                }, 3000);
              }}>
              <Text>logout</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        {this.state.loadingOverlay && (
          <LoadingOverlay label={this.state.messageLoading} />
        )}
      </>
    );
  }
}

const styles = StyleSheet.create({
  line1: {
    borderColor: '#d4d4d4',
    borderWidth: 2,
    marginRight: 24,
    height: 50,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  line2: {
    borderColor: '#d4d4d4',
    borderWidth: 2,
    marginRight: 24,
    height: 50,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  dot: {
    position: 'absolute',
    left: -5,
    top: '36%',
    width: 10,
    height: 10,
    borderRadius: 20,
    backgroundColor: '#3282b8',
  },
});

const mapDispatchToProps = (dispatch) => {
  return {
    setIsloggedId: (status) => dispatch(setIsLoggedIn(status)),
  };
};

export default connect(null, mapDispatchToProps)(Home);
