import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import Log from './log';
import { LOG_STATUS as STATUS } from '../utils/app_utils';

export default class LogList extends Component {
  static propTypes = {
    appLogs: PropTypes.array.isRequired,
    logFilter: PropTypes.array.isRequired,
    forSingleApp: PropTypes.bool.isRequired,
    setLogsFilter: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.handleFilter = this.handleFilter.bind(this);
  }

  componentDidUpdate() {
    const { appLogs } = this.props;
  }

  handleFilter() {
    const { setLogsFilter } = this.props;
    const filter = [];
    if (this.inProgress.checked) {
      filter.push(STATUS[0].code);
    }
    if (this.completed.checked) {
      filter.push(STATUS[1].code);
    }
    if (this.error.checked) {
      filter.push(STATUS['-1'].code);
    }
    setLogsFilter(filter);
  }

  render() {
    const { appLogs, logFilter, forSingleApp } = this.props;

    const filterDisabled = (appLogs.length === 0);

    const tableViewClassnames = className(
      'table-view',
      { 'without-pad': forSingleApp }
    );

    const tableInnerBaseClassnames = className(
      'table-inner-b',
      { 'three-col': forSingleApp, 'four-col': !forSingleApp }
    );

    const tableFilterClassnames = className(
      'table-filter',
      { disabled: filterDisabled }
    );

    const emptyLog = {};

    return (
      <div className={tableViewClassnames}>
        <div className={tableFilterClassnames}>
          <div className="table-filter-i checkbox in-progress">
            <input
              id="inProgress"
              type="checkbox"
              ref={c => { this.inProgress = c; }}
              onChange={this.handleFilter}
              checked={ !filterDisabled && (logFilter.indexOf(STATUS[0].code) !== -1) }
              disabled={filterDisabled ? 'disabled' : ''}
            />
            <label htmlFor="inProgress">In Progress</label>
          </div>
          <div className="table-filter-i checkbox completed">
            <input
              id="completed"
              type="checkbox"
              ref={c => { this.completed = c; }}
              onChange={this.handleFilter}
              checked={ !filterDisabled && (logFilter.indexOf(STATUS[1].code) !== -1) }
              disabled={filterDisabled ? 'disabled' : ''}
            />
            <label htmlFor="completed">Completed</label>
          </div>
          <div className="table-filter-i checkbox error">
            <input
              id="error"
              type="checkbox"
              ref={c => { this.error = c; }}
              onChange={this.handleFilter}
              checked={ !filterDisabled && (logFilter.indexOf(STATUS['-1'].code) !== -1) }
              disabled={filterDisabled ? 'disabled' : ''}
            />
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
                appLogs.length === 0 ? <Log log={emptyLog} /> : appLogs.map((log, i) => {
                  if ((logFilter.length === 0) ||
                    (logFilter.indexOf(STATUS[log.activityStatus].code) === -1)) {
                    return null;
                  }
                  return (
                    <Log key={i} log={log} />
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
