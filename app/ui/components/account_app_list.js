import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import { openExternal } from '../utils/app_utils';
import moment from 'moment';
import AppDetail from './app_detail';
import AppAuthRequest from './app_auth_request';

class AppList extends Component {
  constructor() {
    super()
  }

  render() {
    const { appList, showAppDetailPage, revokeApplication } = this.props;
    const ACTIVITY_STATUS = {
      0: 'IN_PROGRESS',
      1: 'SUCCESS',
      '-1': 'FAILURE'
    };
    if (Object.keys(appList).length === 0) {
      return (
        <div className="default">
          No authorised apps. Get the <a href="#" onClick={e => {
            e.preventDefault();
            openExternal('http://maidsafe.net/alpha.html#demo_app')
          }}>demo app</a> to store and publish data, as well as create your SAFE public ID.
        </div>
      )
    }
    return (
      <div className="'app-li-cnt'">
        {
          Object.keys(appList).map((key, i) => {
            let list = appList[key];
            return (
              <div key={key} className="app-li-i" onClick={e => {
                e.preventDefault();
                showAppDetailPage(list.id);
              }}>
                <h3 className="title">{ list.name } <span className="version">{ list.version }</span></h3>
                <h4 className="sub-title">Last Active: { list.lastActive }</h4>
                <div className="status-bar in-progress">
                  <span className="time">{ list.status.beginTime }</span>
                  <span className="msg">{ list.status.activityName }</span>
                  <span className="status">{ ACTIVITY_STATUS[list.status.activityStatus] }</span>
                </div>
                <div className="opt">
                  <div className="opt-i">
                    <button type="button" className="btn flat danger" name="revoke" onClick={e => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      revokeApplication(list.id);
                    }}>Revoke Access</button>
                  </div>
                </div>
              </div>
            )
          })
        }
      </div>
    )
  }
}

export default class AccountAppList extends Component {
  static PropTypes = {
    showAppDetailPage: PropTypes.func.isRequired,
    hideAppDetailPage: PropTypes.func.isRequired,
    hideAuthRequest: PropTypes.func.isRequired,
    revokeApplication: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired
  }

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  componentWillMount() {
    if (!this.props.authenticated) {
      return this.context.router.push('/login');
    }
    this.props.resetLogsFilter();
  }

  compentWillUpdate() {
    if (!this.props.authenticated) {
      return this.context.router.push('/login');
    }
  }

  render() {
    const { appList, user, appDetailPageVisible, showAuthRequest, authRequestPayload, authRequestHasNext, showNextAuthRequest, hideAuthRequest, logout } = this.props;
    if (appDetailPageVisible) {
      return <AppDetail { ...this.props } />
    }
    return (
      <div className="app-li">
        <div className="app-li-b">
          <div className="app-li-h">
            <div className="app-li-h-lt">
              Authorised Apps
            </div>
            <div className="app-li-h-rt">
              <button type="button" className="btn logout" name="logout" onClick={e => {
                e.preventDefault();
                logout(user);
              }}>Logout</button>
            </div>
          </div>
          <AppList { ...this.props } />
        </div>
        { showAuthRequest ?  <AppAuthRequest
          authRequestPayload={authRequestPayload}
          hideAuthRequest={hideAuthRequest}
          authRequestHasNext={authRequestHasNext}
          showNextAuthRequest={showNextAuthRequest}
           /> : null }
      </div>
    )
  }
}
