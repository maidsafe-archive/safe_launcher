import React, { Component, PropTypes } from 'react';
import AuthBarChart from './auth_bar_chart';
import UploadDownloadChart from './upload_download_chart';
import AccountStorageChart from './account_storage_chart';

export default class AuthorisedDashboard extends Component {
  static propTypes = {
    dashData: PropTypes.object.isRequired,
    authHTTPMethods: PropTypes.array.isRequired,
    accountStorage: PropTypes.object.isRequired,
    updateAccountStorage: PropTypes.func.isRequired,
    decAccountUpdateTimeout: PropTypes.func.isRequired,
    setLastUpdateFromNow: PropTypes.func.isRequired
  };

  render() {
    const {
      dashData,
      authHTTPMethods,
      accountStorage,
      updateAccountStorage,
      setLastUpdateFromNow,
      decAccountUpdateTimeout
    } = this.props;
    return (
      <div>
        <AuthBarChart dashData={dashData} authHTTPMethods={authHTTPMethods} />
        <div className="dash-cnt">
          <UploadDownloadChart upload={dashData.upload} download={dashData.download} />
          <AccountStorageChart
            accountStorage={accountStorage}
            updateAccountStorage={updateAccountStorage}
            setLastUpdateFromNow={setLastUpdateFromNow}
            decAccountUpdateTimeout={decAccountUpdateTimeout}
          />
        </div>
      </div>
    );
  }
}
