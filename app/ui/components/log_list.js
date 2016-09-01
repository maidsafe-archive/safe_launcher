import React, { Component, PropTypes } from 'react';
import className from 'classnames';

const STATUS = {
  0: {
    className: 'in-progress',
    code: 'IN_PROGRESS'
  },
  1: {
    className: 'completed',
    code: 'SUCCESS'
  },
  '-1': {
    className: 'error',
    code: 'FAILURE'
  }
};

class Log extends Component {
  constructor() {
    super();
  }

  render() {
    const { log } = this.props;

    if (!log) {
      return (
        <tr className='default-row'>
          <td colSpan='100%'>No requests made yet.</td>
        </tr>
      );
    }

    return (
      <tr className={ STATUS[log.activityStatus].className }>
        <td>{ log.appName || 'Anonymous Application' }</td>
        <td>{ log.activityName }</td>
        <td>{ STATUS[log.activityStatus].code.replace(/_/g, ' ') }</td>
        <td>{ log.beginTime }</td>
      </tr>
    )
  }
}

export default class LogList extends Component {
  constructor() {
    super();
    this.handleFilter = this.handleFilter.bind(this);
  }

  handleFilter(e) {
    const { setLogsFilter } = this.props;
    let filter = [];
    if (inProgress.checked) {
      filter.push(STATUS[0].code);
    }
    if (completed.checked) {
      filter.push(STATUS[1].code);
    }
    if (error.checked) {
      filter.push(STATUS['-1'].code);
    }
    setLogsFilter(filter);
  }

  render() {
    const { appLogs, logFilter, forSingleApp } = this.props;

    let filterDisabled = (appLogs.length === 0);

    let tableViewClassnames = className(
      'table-view',
      { 'without-pad': forSingleApp }
    );

    let tableInnerBaseClassnames = className(
      'table-inner-b',
      { 'three-col': forSingleApp }
    );

    let tableFilterClassnames = className(
      'table-filter',
      { 'disabled': filterDisabled }
    );

    return (
      <div className={tableViewClassnames}>
        <div className={tableFilterClassnames}>
          <div className="table-filter-i checkbox in-progress">
            <input id="inProgress" type="checkbox" ref="inProgress" value="" onChange={this.handleFilter} disabled={filterDisabled ? 'disabled' : '' }/>
            <label htmlFor="inProgress">In Progress</label>
          </div>
          <div className="table-filter-i checkbox completed">
            <input id="completed" type="checkbox" ref="completed" value="" onChange={this.handleFilter} disabled={filterDisabled ? 'disabled' : '' } />
            <label htmlFor="completed">Completed</label>
          </div>
          <div className="table-filter-i checkbox error">
            <input id="error" type="checkbox" ref="error" value="" onChange={this.handleFilter} disabled={filterDisabled ? 'disabled' : '' } />
            <label htmlFor="error">Error</label>
          </div>
        </div>
        <div className={tableInnerBaseClassnames}>
          <table>
            <thead>
              <tr>
                <th>App Name</th>
                <th>Request</th>
                <th>Status</th>
                <th>Time Sent</th>
              </tr>
            </thead>
            <tbody>
              {
                appLogs.length === 0 ? <Log /> : appLogs.map((log, i) => {
                  if ((logFilter.length !== 0) && (logFilter.indexOf(STATUS[log.activityStatus].code) === -1)) {
                    return;
                  }
                  return (
                    <Log key={i} log={log} />
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}
