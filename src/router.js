import React, {Component} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Home from './Home';
import Login from './Login';
import {connect} from 'react-redux';
import {getItem} from './helper';
import {setIsLoggedIn} from './actions/auth/authActions';
import FlashMessage from 'react-native-flash-message';

const HomeStack = createStackNavigator();
const HomeStackScreen = () => (
  <HomeStack.Navigator headerMode="none">
    <HomeStack.Screen name="Home" component={Home} />
  </HomeStack.Navigator>
);

const AuthStack = createStackNavigator();

const AuthStackScreen = () => (
  <AuthStack.Navigator
    headerMode="none"
    // screenOptions={{
    //   headerShown: false,
    // }}
  >
    <AuthStack.Screen name="Login" component={Login} />
  </AuthStack.Navigator>
);

class AppRoute extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
    };
  }
  // React.useEffect(() => {
  // });
  componentDidMount() {
    getItem('auth').then((res) => {
      if (res.hasOwnProperty('token')) {
        this.setState({
          user: 1,
        });
        this.props.setIsloggedId(true);
      } else {
        this.setState({
          user: null,
        });
      }
    });
  }

  render() {
    return (
      <NavigationContainer>
        {!this.props.authReducer.isLoggedIn && this.state.user == null ? (
          <AuthStackScreen />
        ) : (
          <HomeStackScreen />
        )}

        <FlashMessage position="top" />
      </NavigationContainer>
    );
  }
}

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

export default connect(mapStateToProps, mapDispatchToProps)(AppRoute);
