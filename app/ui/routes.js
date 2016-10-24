import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './containers/app';
import Splash from './containers/splash_container';
import HomePage from './containers/home_container';
import AccountPage from './containers/account_container';
import LoginPage from './containers/login_container';
import RegisterPage from './containers/register_container';
import AccountAppListPage from './containers/account_app_list_container';
import DashboardPage from './containers/dashboard_container';
import AppLogsPage from './containers/app_logs_container';
import HelpPage from './containers/help_container';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={Splash} />
    <Route path="/home" component={HomePage}>
      <Route path="/account" component={AccountPage}>
        <IndexRoute component={LoginPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/account_app_list" component={AccountAppListPage} />
      </Route>
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/app_logs" component={AppLogsPage} />
      <Route path="/help" component={HelpPage} />
    </Route>
  </Route>
);
