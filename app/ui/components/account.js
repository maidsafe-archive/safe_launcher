import React, { Component, PropTypes } from 'react';

export default class Account extends Component {
  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    children: PropTypes.element.isRequired
  };

  render() {
    const { authenticated } = this.props;
    if (authenticated) {
      return (
        <div>{ this.props.children }</div>
      );
    }
    return (
      <div className="auth">
        <div className="auth-b">
          { this.props.children }
        </div>
      </div>
    );
  }
}
