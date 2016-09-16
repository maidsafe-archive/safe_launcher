import React, { Component, PropTypes } from 'react';
import LogList from './log_list';

export default class AppDetail extends Component {
  static propTypes = {
    currentApp: PropTypes.object.isRequired,
    currentAppLogs: PropTypes.array.isRequired,
    logFilter: PropTypes.array.isRequired,
    setLogsFilter: PropTypes.func.isRequired,
    revokeApplication: PropTypes.func.isRequired,
    hideAppDetailPage: PropTypes.func.isRequired
  };

  render() {
    const {
      hideAppDetailPage,
      currentApp,
      currentAppLogs,
      logFilter,
      revokeApplication,
      setLogsFilter
    } = this.props;

    return (
      <div className="app-details">
        <div className="app-details-h">
          <div className="back">
            <button
              type="button"
              name="back"
              onClick={e => {
                e.preventDefault();
                hideAppDetailPage();
              }}
            >{' '}</button>
          </div>
        </div>
        <div className="app-details-cnt">
          <h3 className="title">
            { currentApp.name } - <span className="version">v { currentApp.version }</span>
          </h3>
          <div className="permissions">
            <h4 className="permissions-title">Permissions:</h4>
            <ul>
              {
                currentApp.permissions.length === 0 ? <li>None</li> :
                  currentApp.permissions.map((permission, i) => {
                    if (permission === 'SAFE_DRIVE_ACCESS') {
                      return (<li key={i} className="icn safe-drive">SAFE Drive Access</li>);
                    }
                    return null;
                  })
              }
            </ul>
          </div>
          <LogList
            appLogs={currentAppLogs}
            forSingleApp
            logFilter={logFilter}
            setLogsFilter={setLogsFilter}
          />
          <div className="opt">
            <div className="opt-i">
              <button
                type="button"
                name="revoke"
                className="btn flat danger"
                onClick={e => {
                  e.preventDefault();
                  revokeApplication(currentApp.id);
                }}
              >Revoke Access</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
