import React, { Component, PropTypes } from 'react';

export default class AccountStorageChart extends Component {
  static propTypes = {
    accountStorage: PropTypes.object.isRequired,
    updateAccountStorage: PropTypes.func.isRequired,
    setLastUpdateFromNow: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.disableUpdate = true;
    this.updateTimeLeft = null;
    this.lastUpdateTimer = null;
    this.updateTimeoutTimer = null;
    this.handleUpdateTimoutTimer = this.handleUpdateTimoutTimer.bind(this);
    this.clearUpdateTimeoutTimer = this.clearUpdateTimeoutTimer.bind(this);
  }

  componentDidMount() {
    const { setLastUpdateFromNow } = this.props;

    this.lastUpdateTimer = window.setInterval(() => {
      setLastUpdateFromNow();
    }, 1000);

    this.handleUpdateTimoutTimer(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.handleUpdateTimoutTimer(nextProps);
  }

  componentWillUnmount() {
    window.clearInterval(this.lastUpdateTimer);
    this.clearUpdateTimeoutTimer();
  }

  clearUpdateTimeoutTimer() {
    window.clearInterval(this.updateTimeoutTimer);
    this.updateTimeoutTimer = null;
  }

  handleUpdateTimoutTimer(props) {
    if ((props.accountStorage.updateTimeout !== 0) && !this.updateTimeoutTimer) {
      this.updateTimeoutTimer = window.setInterval(_ => {
        props.decAccountUpdateTimeout();
      }, 1000);
    }
    if (props.accountStorage.updateTimeout === 0) {
      this.disableUpdate = false;
      this.clearUpdateTimeoutTimer();
    } else {
      this.disableUpdate = true;
      const secondsLeft = props.accountStorage.updateTimeout;
      const min = Math.floor(secondsLeft / 60);
      let sec = secondsLeft - (min * 60);
      sec = `0${sec}`.slice(-2);
      const timeoutStr = `0${min} : ${sec}`;
      this.updateTimeLeft = timeoutStr;
    }
  }

  render() {
    const { accountStorage, updateAccountStorage } = this.props;

    let container = null;
    const progressWidth = ((accountStorage.used /
      (accountStorage.used + accountStorage.available)) * 100);

    if (accountStorage.fetching) {
      container = (
        <div className="dash-progress-bar-b">
          <h3 className="dash-title">Account Storage</h3>
          <h3 className="count"><span className="value">...</span></h3>
          <h4 className="title">Total PUTs</h4>
          <div className="progress">{' '}</div>
          <div className="desc">
            Fetching data from the Network.
          </div>
          <div className="opt onLoading">
            <div className="opt-lt">
              <button
                type="button"
                className="btn flat"
                name="update"
                disabled="disabled"
              >Updating</button>
            </div>
          </div>
        </div>
      );
    } else {
      container = (
        <div className="dash-progress-bar-b">
          <h3 className="dash-title">Account Storage</h3>
          <h3 className="count">
            <span className="value">
              {accountStorage.used}
            </span> / {accountStorage.used + accountStorage.available}
          </h3>
          <h4 className="title">Total PUTs</h4>
          <div className="progress">
            <span
              className="progress-value"
              style={{
                width: `${progressWidth || 0}%`
              }}
            >{' '}</span>
          </div>
          <div className="desc">
            Each account is currently limited to
             {accountStorage.used + accountStorage.available} PUTs on the Network.
          </div>
          <div className="opt">
            <div className="opt-lt">
              <button
                type="button"
                className="btn flat"
                name="update" disabled={this.disableUpdate ? 'disabled' : ''}
                onClick={e => {
                  e.preventDefault();
                  updateAccountStorage();
                }}
              > {this.disableUpdate ? this.updateTimeLeft : 'Update'}</button>
            </div>
            <div className="opt-rt">
              Updated: { accountStorage.lastUpdatedFromNow }
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="sec-2">
        <div className="card">
          <div className="dash-progress-bar">
            { container }
          </div>
        </div>
      </div>
    );
  }
}
