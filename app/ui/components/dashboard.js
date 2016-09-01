import React, { Component, PropTypes } from 'react';
import UnAuthBarChart from './unauth_bar_chart';
import AuthBarChart from './auth_bar_chart';
import UploadDownloadChart from './upload_download_chart';
import AccountStorageChart from './account_storage_chart';

class UnAuthorisedDashboard extends Component {
  constructor() {
    super()
  }

  render() {
    return (
      <UnAuthBarChart dashData={this.props.dashData} unAuthGET={this.props.unAuthGET} />
    )
  }
}

class AuthorisedDashboard extends Component {
  constructor() {
    super()
  }

  render() {
    const { dashData, authHTTPMethods, accountStorage, updateAccountStorage, setLastUpdateFromNow, decAccountUpdateTimeout } = this.props;

    return (
      <div>
        <AuthBarChart dashData={dashData} authHTTPMethods={authHTTPMethods} />
        <div className="dash-cnt">
          <UploadDownloadChart upload={dashData.upload} download={dashData.download}  />
          <AccountStorageChart
            accountStorage={accountStorage}
            updateAccountStorage={updateAccountStorage}
            setLastUpdateFromNow={setLastUpdateFromNow}
            decAccountUpdateTimeout={decAccountUpdateTimeout} />
        </div>
      </div>
    )
  }
}

export default class Dashboard extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
  }

  render() {
    const { authenticated } = this.props;

    return (
      <div className="dash">
        <div className="dash-b">
          { authenticated ? <AuthorisedDashboard { ...this.props }/> : <UnAuthorisedDashboard { ...this.props }/>  }
        </div>
      </div>
    )
  }
}
