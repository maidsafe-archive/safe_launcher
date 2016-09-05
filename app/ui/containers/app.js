import React, { Component, PropTypes } from 'react';
import NetworkStatusContainer from './network_status_container';
import Toaster from './toaster_container';

export default class App extends Component {
  static propTypes = {
    children: PropTypes.element.isRequired
  };

  render() {
    return (
      <div className="root">
        <NetworkStatusContainer />
        {this.props.children}
        <Toaster message={''} options={Object.assign({})} />
      </div>
    );
  }
}
