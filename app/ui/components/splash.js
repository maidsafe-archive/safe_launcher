import React, { Component, PropTypes } from 'react';
import { browserHistory } from 'react-router';

export default class Splash extends Component {
  constructor(props){
    super(props);
  }

  static propTypes = {
    status: PropTypes.number.isRequired
  }

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  componentWillUpdate(nextProps) {
    const { status, initialSettings } = nextProps;
    const { router } = this.context;
    if (status === 1) {
      if (initialSettings) {
        return router.push('/account');
      }
      return router.push('/initial_settings');
    }
  }

  render() {
    const { status, networkRetry } = this.props;
    let splashContainer = null;
    if (status === 0) {
      splashContainer = (<div className="splash-b connecting">
        <div className="splash-media"></div>
        <span className="splash-i">Trying to Connect you to the SAFE Network!</span>
      </div>)
    } else if (status === 2) {
      splashContainer = (<div className="splash-b disconnected">
        <div className="splash-media"></div>
        <span className="splash-i">Could not connect to the SAFE Network!</span>
        <div className="opt">
          <button type="button" className="btn danger" name="button" onClick={() => {
            networkRetry()
          }}>Retry</button>
        </div>
      </div>)
    } else {
      return null;
    }
    return (
      <div className="splash">
        {splashContainer}
      </div>
    )
  }
}
