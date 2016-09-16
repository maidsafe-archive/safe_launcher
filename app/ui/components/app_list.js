import React, { Component, PropTypes } from 'react';
import moment from 'moment';
import { openExternal } from '../utils/app_utils';

export default class AppList extends Component {
  static propTypes = {
    appList: PropTypes.object.isRequired,
    showAppDetailPage: PropTypes.func.isRequired,
    revokeApplication: PropTypes.func.isRequired
  };

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
          No authorised apps. Get the&nbsp;
          <a
            href={undefined}
            onClick={e => {
              e.preventDefault();
              openExternal('http://maidsafe.net/alpha.html#demo_app');
            }}
          >demo app</a> to store and publish data, as well as create your SAFE public ID.
        </div>
      );
    }
    return (
      <div className="app-li-cnt">
        {
          Object.keys(appList).map((key) => {
            const list = appList[key];
            return (
              <div
                key={key}
                className="app-li-i"
                onClick={e => {
                  e.preventDefault();
                  showAppDetailPage(list.id);
                }}
              >
                <h3 className="title">
                  { list.name } <span className="version">{ list.version }</span>
                </h3>
                <h4 className="sub-title">Last Active: { moment(list.lastActive).fromNow() }</h4>
                <div className="status-bar in-progress">
                  <span className="time">{ moment(list.status.beginTime).format('HH:mm:ss') }</span>
                  <span className="msg">{ list.status.activityName }</span>
                  <span className="status">{ ACTIVITY_STATUS[list.status.activityStatus] }</span>
                </div>
                <div className="opt">
                  <div className="opt-i">
                    <button
                      type="button"
                      className="btn flat danger"
                      name="revoke"
                      onClick={e => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        revokeApplication(list.id);
                      }}
                    >Revoke Access</button>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    );
  }
}
