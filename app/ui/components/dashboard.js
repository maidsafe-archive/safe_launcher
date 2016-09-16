import React, { Component, PropTypes } from 'react';
import AuthorisedDashboard from './authorised_dashboard';
import UnAuthorisedDashboard from './unauthorised_dashboard';


export default class Dashboard extends Component {
  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    dashData: PropTypes.object.isRequired,
    unAuthGET: PropTypes.array.isRequired,
    authHTTPMethods: PropTypes.array.isRequired,
    accountStorage: PropTypes.object.isRequired,
    updateAccountStorage: PropTypes.func.isRequired,
    decAccountUpdateTimeout: PropTypes.func.isRequired,
    setLastUpdateFromNow: PropTypes.func.isRequired
  };

  render() {
    const { authenticated } = this.props;

    let container = null;
    if (authenticated) {
      container = <AuthorisedDashboard {...this.props} />;
    } else {
      container = <UnAuthorisedDashboard {...this.props} />;
    }
    return (
      <div className="dash">
        <div className="dash-b">
          {container}
        </div>
      </div>
    );
  }
}
