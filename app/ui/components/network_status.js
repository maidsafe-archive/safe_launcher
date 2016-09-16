import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import { MESSAGES } from '../constant';

export default class NetworkStatus extends Component {
  static propTypes = {
    status: PropTypes.number.isRequired,
    onNetworkStatusClick: PropTypes.func.isRequired
  };

  render() {
    const { status, onNetworkStatusClick } = this.props;

    const currentPath = window.location.hash.split('?')[0]; 
    const networkStatusClasses = className(
      'network-status',
      {
        error: status === -1 || status === 2,
        connecting: status === 0,
        connected: status === 1,
        'splash-screen': (currentPath === '#/')
      }
    );
    let networkStatusMessage = null;
    switch (status) {
      case 0:
        networkStatusMessage = MESSAGES.NETWORK_CONNECTING;
        break;
      case 1:
        networkStatusMessage = MESSAGES.NETWORK_CONNECTED;
        break;
      case 2:
        networkStatusMessage = MESSAGES.NETWORK_DISCONNECTED;
        break;
      case -1:
        networkStatusMessage = MESSAGES.NETWORK_RETRYING;
        break;
      default:

    }
    return (
      <span
        className={networkStatusClasses}
        onClick={() => {
          onNetworkStatusClick(status);
        }}
      >
        <span className="network-status-tooltip">{networkStatusMessage}</span>
      </span>
    );
  }
}
