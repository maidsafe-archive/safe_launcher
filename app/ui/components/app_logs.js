import React, { Component, PropTypes } from 'react';
import LogList from './log_list';

export default class AppLogs extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    this.props.resetLogsFilter();
  }

  render() {
    return (
      <div className="dash">
        <div className="dash-cnt">
          <div className="sec-1">
            <div className="card">
              <LogList { ...this.props } />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
