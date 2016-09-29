import React, { Component, PropTypes } from 'react';

export default class Spinner extends Component {
  static propTypes = {
    description: PropTypes.string
  };

  render() {
    const { description } = this.props;

    return (
      <div className="loader">
        <div className="loader-b">
          <div className="loader-i">{' '}</div>
          <h3 className="loader-desc">{description}</h3>
        </div>
      </div>
    );
  }
}
