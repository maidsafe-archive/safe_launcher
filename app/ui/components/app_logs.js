import React, { Component, PropTypes } from 'react';
import LogList from './log_list';

export default class AppLogs extends Component {
  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    appLogs: PropTypes.array.isRequired,
    logFilter: PropTypes.array.isRequired,
    setLogsFilter: PropTypes.func.isRequired,
    resetLogsFilter: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.props.resetLogsFilter();
  }

  render() {
    return (
      <div className="dash">
        <div className="dash-cnt">
          <div className="sec-1">
            <div className="card">
              <LogList {...this.props} forSingleApp={false} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
