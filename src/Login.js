import React, {Component} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {RED} from './color';
import {API_URL, DimissKeyboard, saveItem, Message} from './helper';
import axios from 'axios';
import {connect} from 'react-redux';
import {setIsLoggedIn} from './actions/auth/authActions';
import LoadingOverlay from './LoadingOverlay';

const image = {uri: 'https://reactjs.org/logo-og.png'};

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      loading: false,
      togglePassword: true,
      errorEmail: false,
      errorPassword: false,
    };
  }

  validate = () => {
    if (this.state.email == '' && this.state.password == '') {
      this.setState({
        errorEmail: true,
        errorPassword: true,
      });
    } else if (this.state.email != '' && this.state.password == '') {
      this.setState({
        errorEmail: false,
        errorPassword: true,
      });
    } else if (this.state.email == '' && this.state.password != '') {
      this.setState({
        errorEmail: true,
        errorPassword: false,
      });
    } else if (this.state.email != '' && this.state.password != '') {
      this.setState({
        errorEmail: false,
        errorPassword: false,
      });
    }
  };

  login = () => {
    if (this.state.email != '' && this.state.password != '') {
      let data = {
        email: this.state.email,
        password: this.state.password,
      };
      this.setState({
        loading: true,
      });
      axios
        .post(`${API_URL}/login`, data)
        .then((res) => {
          if (res.hasOwnProperty('data')) {
            let {data} = res;
            console.warn('user', data);
            // setTimeout(() => {
            saveItem('auth', data).then((res) => {
              this.props.setIsloggedId(true);
              this.setState({
                loading: false,
              });
              Message(`Hi ${data.user.name} 🥳`, 'Welcome back!', 'info');
            });
            // }, 3000);
          }
        })
        .catch((err) =>
          this.setState(
            {
              loading: false,
            },
            () => Message('Oppss!', 'Email atau password kamu salah', 'danger'),
          ),
        );
    }
  };

  render() {
    let togglePass = this.state.togglePassword ? 'eye' : 'eye-off';
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS == 'ios' ? 'padding' : ''}
        style={{flex: 1}}>
        <View>
          <Image
            source={require('../assets/bg_login.jpg')}
            style={styles.image}
          />
          <DimissKeyboard>
            <View
              style={{
                // flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Email"
                  keyboardType="email-address"
                  onBlur={this.validate}
                  autoCapitalize="none"
                  onChangeText={(val) => {
                    this.setState({
                      email: val,
                    });
                    this.validate();
                  }}
                />
                {this.state.errorEmail && (
                  <Text style={{color: 'red'}}>Email tidak boleh kosong</Text>
                )}
                <View style={{marginTop: 12}} />
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  secureTextEntry={this.state.togglePassword}
                  autoCapitalize="none"
                  onBlur={this.validate}
                  autoCompleteType="off"
                  onChangeText={(val) => {
                    this.setState({
                      password: val,
                    });
                    this.validate();
                  }}
                />
                {this.state.errorPassword && (
                  <Text style={{color: 'red'}}>
                    Password tidak boleh kosong
                  </Text>
                )}
                <View style={{marginTop: 24}} />
                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      backgroundColor:
                        this.state.email != '' && this.state.password != ''
                          ? RED
                          : 'grey',
                    },
                  ]}
                  disabled={
                    this.state.email != '' && this.state.password != ''
                      ? false
                      : true
                  }
                  onPress={this.login}>
                  <Text
                    style={{fontWeight: 'bold', fontSize: 18, color: 'white'}}>
                    Masuk
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </DimissKeyboard>
        </View>
        {this.state.loading && <LoadingOverlay label="Mohon tunggu" />}
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  image: {
    // flex: 1,
    // resizeMode: 'cover',
    // justifyContent: 'center',
    height: 200,
    width: '100%',
    borderWidth: 1,
  },
  label: {
    color: 'grey',
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    width: '70%',
    marginTop: 22,
    // paddingHorizontal: 16,
  },
  textInput: {
    marginTop: 8,
    width: '100%',
    height: 50,
    borderWidth: 0.5,
    borderColor: '#e4e3e3',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e4e3e3',
  },
  btn: {
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
});

const mapStateToProps = (state) => {
  return {
    authReducer: state.authReducer,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setIsloggedId: (status) => dispatch(setIsLoggedIn(status)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
