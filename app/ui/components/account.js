import React, { Component, PropTypes } from 'react';
import className from 'classnames';

export default class Account extends Component {
  render() {
    const { authenticated } = this.props;
    if (authenticated) {
      return (
        <div>{ this.props.children }</div>
      )
    }
    return (
      <div className="auth">
        <div className="auth-b">
          { this.props.children }
        </div>
      </div>
    )
  }
}
