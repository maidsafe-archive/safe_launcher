import React, { Component, PropTypes } from 'react';
import moment from 'moment';
import { LOG_STATUS as STATUS } from '../utils/app_utils';

export default class Log extends Component {
  static propTypes = {
    log: PropTypes.object.isRequired
  };

  render() {
    const { log } = this.props;

    if (Object.keys(log).length === 0) {
      return (
        <tr className="default-row">
          <td colSpan="100%">No requests made yet.</td>
        </tr>
      );
    }

    return (
      <tr className={STATUS[log.activityStatus].className}>
        <td>{log.appName || 'Anonymous Application'}</td>
        <td>{log.activityName}</td>
        <td>{STATUS[log.activityStatus].code.replace(/_/g, ' ')}</td>
        <td>{moment(log.beginTime).format('HH:mm:ss')}</td>
      </tr>
    );
  }
}
