import React, { Component, PropTypes } from 'react';
import moment from 'moment';
import { CONSTANT } from '../constant';

export default class AccountStorageChart extends Component {
  constructor() {
    super()
    this.disableUpdate = true;
    this.updateTimeLeft = null;
    this.lastUpdateTimer = null;
    this.updateTimeoutTimer = null;
    this.handleUpdateTimoutTimer = this.handleUpdateTimoutTimer.bind(this);
    this.clearUpdateTimeoutTimer = this.clearUpdateTimeoutTimer.bind(this);
  }

  clearUpdateTimeoutTimer() {
    let self = this;
    window.clearInterval(self.updateTimeoutTimer);
    self.updateTimeoutTimer = null;
  }

  handleUpdateTimoutTimer(props) {
    let self = this;
    if ((props.accountStorage.updateTimeout !== 0) && !self.updateTimeoutTimer) {
      self.updateTimeoutTimer = window.setInterval(() => {
        props.decAccountUpdateTimeout();
      }, 1000);
    }
    if (props.accountStorage.updateTimeout === 0) {
      self.disableUpdate = false;
      self.clearUpdateTimeoutTimer();
    } else {
      self.disableUpdate = true;
      let secondsLeft = props.accountStorage.updateTimeout;
      let min = Math.floor(secondsLeft / 60);
      let sec = secondsLeft - (min * 60);
      sec = ('0' + sec).slice(-2);
      let timeoutStr = '0' + min + ':' + sec;
      self.updateTimeLeft = timeoutStr;
    }
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

  render() {
    const { accountStorage, updateAccountStorage } = this.props;

    let container = null;

    if (accountStorage.fetching) {
      container = (
        <div className="dash-progress-bar-b">
          <h3 className="dash-title">Account Storage</h3>
          <h3 className="count"><span className="value">...</span></h3>
          <h4 className="title">Total PUTs</h4>
          <div className="progress"></div>
          <div className="desc">
            Fetching data from the Network.
          </div>
          <div className="opt onLoading">
            <div className="opt-lt">
              <button type="button" className="btn flat" name="update" disabled="disabled">Updating</button>
            </div>
          </div>
        </div>
      )
    } else {
      container = (
        <div className="dash-progress-bar-b">
          <h3 className="dash-title">Account Storage</h3>
          <h3 className="count">
            <span className="value">{accountStorage.used}</span> / {accountStorage.used + accountStorage.available}
          </h3>
          <h4 className="title">Total PUTs</h4>
          <div className="progress">
            <span className="progress-value" style={{ width : ((accountStorage.used / (accountStorage.used + accountStorage.available)) * 100) + '%'}}></span>
          </div>
          <div className="desc">
            Each account is currently limited to {accountStorage.used + accountStorage.available} PUTs on the Network.
          </div>
          <div className="opt">
            <div className="opt-lt">
              <button type="button" className="btn flat" name="update" disabled={this.disableUpdate ? 'disabled' : ''} onClick={e => {
                e.preventDefault();
                updateAccountStorage();
              }}> { this.disableUpdate ?  this.updateTimeLeft : 'Update' }</button>
            </div>
            <div className="opt-rt">
              Updated: { accountStorage.lastUpdatedFromNow }
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="sec-2">
        <div className="card">
          <div className="dash-progress-bar">
            { container }
          </div>
        </div>
      </div>
    )
  }
}
