import React, { Component, PropTypes } from 'react';
import UnAuthBarChart from './unauth_bar_chart';

export default class UnAuthorisedDashboard extends Component {
  static propTypes = {
    dashData: PropTypes.object.isRequired,
    unAuthGET: PropTypes.array.isRequired
  };

  render() {
    return (
      <UnAuthBarChart dashData={this.props.dashData} unAuthGET={this.props.unAuthGET} />
    );
  }
}
