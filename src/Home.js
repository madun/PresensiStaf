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
  Modal,
} from 'react-native';

import {RED, BLUE} from './color';

import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/Feather';
import axios from 'axios';
import {API_URL, URL_IMAGE, getItem, removeItem, Message} from './helper';
import {connect} from 'react-redux';
import {setIsLoggedIn} from './actions/auth/authActions';
import LoadingOverlay from './LoadingOverlay';
import {RNCamera} from 'react-native-camera';
import Confirm from './Confirm';

const PendingView = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <Text category="s1">Waiting Permissions Camera</Text>
  </View>
);

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      curTime: null,
      location: null,
      loading: false,
      loadingOverlay: false,
      loadingVerifikasi: false,
      confirmClockOut: false,
      statusAttendance: 'masuk',
      token: null,
      checkinAt: '',
      checkoutAt: '',
      messageLoading: '',
      totalWorkHour: '',
      modalCamera: false,
      photoSelfie: '',
      lat: '',
      lng: '',
      alertFaceNotValid: '',
      authName: '',
      authFoto: '',
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
      this.setState(
        {
          authName: auth.user.name,
          authFoto: `${URL_IMAGE + '/foto/employee/' + auth.user_detail.foto}`,
        },
        () => console.warn('foto', this.state.authFoto),
      );
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

    if (this.state.confirmClockOut) {
      this.setState({confirmClockOut: false});
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
          .post(`${API_URL}/attendanceWithFace`, data, {
            headers: {
              Authorization: 'Bearer ' + auth.token,
            },
          })
          .then((res) => {
            if (res.data.hasOwnProperty('in_area')) {
              this.setState({
                modalCamera: true,
                lat: lat,
                lng: lng,
              });
            } else {
              Message('Oppss!', `${res.data.msg}`, 'danger');
            }
            this.setState({loading: false});
          })
          .catch((err) => {
            console.warn('err', err);
            this.setState({loading: false});
          });
      })
      .catch((err) => console.warn('err', err));
  }

  confirmClockOut = () => {
    this.setState({confirmClockOut: true});
  };

  takeSelfie = async () => {
    if (this.camera) {
      const options = {quality: 0.5, base64: true, width: 600, height: 1200};
      const data = await this.camera.takePictureAsync(options);

      this.setState({
        photoSelfie: data.uri,
        loadingVerifikasi: true,
      });

      getItem('auth')
        .then((auth) => {
          axios
            .post(
              `${API_URL}/attendanceWithFace`,
              {foto: data.base64, lat: this.state.lat, lng: this.state.lng},
              {
                headers: {
                  Authorization: 'Bearer ' + auth.token,
                },
              },
            )
            .then((res) => {
              this.postToFaceX(res.data);
            })
            .catch((err) => console.warn(err));
        })
        .catch((error) => console.warn(error));
      // this.setState(
      //   {
      //     modalCam: false,
      //     photoSelfie: data.uri,
      //     photoSelfie64: `${data.base64}`,
      //     // photoSelfie64: `data:image/jpg;base64,${data.base64}`,
      //   }
      // );
      //   console.log(data.uri);
      console.log('selfie');
    }
  };

  postToFaceX(data) {
    const FILE = {
      img_1: `${URL_IMAGE}/${data.img_1}`,
      img_2: `${URL_IMAGE}/${data.img_2}`,
    };

    axios
      .post('https://www.facexapi.com/match_faces', FILE, {
        headers: {
          user_id: '5f3bc90b5bab1b52bae885e8',
        },
      })
      .then(({data}) => {
        if (data.success) {
          // jika wajah terdeteksi
          console.warn(data);
          if (data.data.status == 'no match') {
            // jika wajah tidak dikenal
            this.setState({
              photoSelfie: '',
              alertFaceNotValid: 'Oppss waja tidak dikenal!',
            });

            setTimeout(() => {
              this.setState({
                alertFaceNotValid: '',
              });
            }, 4000);
          } else if (data.data.status == 'match') {
            // jika wajah valid & lokasi GPS valid
            this.postPresence();
          }
        } else {
          // jika muka yg di upload tidak terlihat (terpotong, buram, dll)
          this.setState({
            photoSelfie: '',
            alertFaceNotValid: 'Oppss wajah tidak terlihat jelas! Coba ulangi',
          });

          setTimeout(() => {
            this.setState({
              alertFaceNotValid: '',
            });
          }, 4000);
        }

        this.setState({
          loadingVerifikasi: false,
        });
      })
      .catch((err) => console.warn('error faceX', err));
  }

  postPresence() {
    let data = {
      lat: this.state.lat,
      lng: this.state.lng,
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

            this.setState({
              photoSelfie: '',
              modalCamera: false,
              lat: '',
              lng: '',
            });
          })
          .catch((err) => {
            console.warn('err', err);
          });
      })
      .catch((err) => console.warn('err', err));
  }

  render() {
    let modalContent = () => (
      <RNCamera
        ref={(ref) => {
          this.camera = ref;
        }}
        style={{position: 'absolute', top: 0, right: 0, left: 0, bottom: 0}}
        type={RNCamera.Constants.Type.front}
        flashMode={RNCamera.Constants.FlashMode.off}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
        androidRecordAudioPermissionOptions={{
          title: 'Permission to use audio recording',
          message: 'We need your permission to use your audio',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}>
        {({camera, status, recordAudioPermissionStatus}) => {
          if (status !== 'READY') {
            return <PendingView />;
          }
          return (
            <View style={{flex: 1, justifyContent: 'space-between'}}>
              <View>
                <View
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                  }}>
                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: 18,
                        marginBottom: 6,
                      }}>
                      Identifikasi Wajah
                    </Text>
                    <Text style={{color: 'white', fontWeight: '400'}}>
                      Pastikan Wajah berada ditengah
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => this.setState({modalCamera: false})}
                    style={{padding: 8}}>
                    <Icon name="x" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                {this.state.alertFaceNotValid != '' && (
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 6,
                      backgroundColor: '#d73a49',
                    }}>
                    <Text
                      style={{
                        fontSize: 16,
                        color: 'white',
                        fontWeight: 'bold',
                        lineHeight: 22,
                      }}>
                      {this.state.alertFaceNotValid}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{alignItems: 'center', marginBottom: 16}}>
                <TouchableOpacity
                  onPress={() => this.takeSelfie()}
                  style={{
                    width: 60,
                    height: 60,
                    backgroundColor: 'white',
                    borderRadius: 100,
                    elevation: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon name="camera" size={20} color="#900" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      </RNCamera>
    );
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{flex: 1}}>
          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.modalCamera}>
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}>
              <View
                style={{
                  width: '90%',
                  height: '90%',
                  backgroundColor: 'white',
                  elevation: 20,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}>
                {this.state.photoSelfie == '' && modalContent()}
                {this.state.photoSelfie != '' && (
                  <Image
                    style={{
                      width: '100%',
                      height: '100%',
                      resizeMode: 'contain',
                    }}
                    source={{uri: this.state.photoSelfie}}
                  />
                )}

                {this.state.loadingVerifikasi && (
                  <LoadingOverlay label="Mengidentifikasi ..." />
                )}
              </View>
            </View>
          </Modal>
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
              source={{uri: this.state.authFoto}}
            />
            <View>
              <Text style={{color: 'white', fontSize: 18}}>
                {this.state.authName}
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
                  ? this.confirmClockOut
                  : this.getLocation
              }
              activeOpacity={0.5}
              disabled={
                this.state.loading || this.state.statusAttendance == 'beres'
              }
              style={[
                {
                  backgroundColor:
                    this.state.statusAttendance == 'beres' ? 'grey' : RED,
                },
                styles.btnPrimary,
              ]}>
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
        {this.state.confirmClockOut && (
          <Confirm
            label="Apakah yakin akan Clock Out?"
            onYes={this.getLocation}
            onNo={() => this.setState({confirmClockOut: false})}
          />
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
  btnPrimary: {
    borderRadius: 6,
    width: '80%',
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
  },
});

const mapDispatchToProps = (dispatch) => {
  return {
    setIsloggedId: (status) => dispatch(setIsLoggedIn(status)),
  };
};

export default connect(null, mapDispatchToProps)(Home);
