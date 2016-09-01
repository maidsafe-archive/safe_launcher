import React, { Component, PropTypes } from 'react';
import className from 'classnames';

export default class NetworkStatus extends Component {
  static propTypes = {
    status: PropTypes.number.isRequired,
    onNetworkStatusClick: PropTypes.func.isRequired
  };

  render() {
    const { status, onNetworkStatusClick } = this.props;

    let networkStatusClasses = className(
      'network-status',
      {
        'error': status === -1 || status === 2,
        'connecting': status === 0,
        'connected': status === 1,
        'splash-screen': false
      }
    );

    return (
      <span className={networkStatusClasses} onClick={() => {
        onNetworkStatusClick(status)
      }}></span>
    )
  }
}
