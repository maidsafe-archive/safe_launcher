import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import { CONSTANT } from '../constant';

export default class Toaster extends Component {
  constructor() {
    super();
    this.timer = null;
    this.retryTimer = null;
    this.extend = false;
    this.timeout = 1000;
    this.setTimer = this.setTimer.bind(this);
    this.clearTimer = this.clearTimer.bind(this);
    this.initialRetryCount = 10;
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.setNetworkRetryTimer = this.setNetworkRetryTimer.bind(this);
  }

  clearTimer() {
    window.clearTimeout(this.timer);
    this.timer = null;
  }

  setTimer(timeout) {
    this.timer = window.setTimeout(() => {
      this.clearTimer();
      if (this.props.hasNext) {
        return this.props.showNextToaster();
      }
      return this.props.hideToaster();
    }, timeout || CONSTANT.TOSATER_TIMEOUT);
  }

  clearNetworkRetryTimer() {
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  setNetworkRetryTimer() {
    let self = this;
    this.retryTimer = window.setInterval(() => {
      self.refs.message.innerText = this.props.message + ' ' + self.initialRetryCount + ' sec';
      if (self.initialRetryCount === 0) {
        self.clearNetworkRetryTimer();
        return self.props.retryNetwork();
      }
      self.initialRetryCount--;
    }, 1000);
  }

  componentDidUpdate() {
    const { options, message, retryCount } = this.props;
    let self = this;
    this.initialRetryCount *= Math.pow(2, retryCount);
    if (options) {
      if (options.autoHide) {
        this.setTimer();
      }

      if (options.type === CONSTANT.TOASTER_OPTION_TYPES.NETWORK_RETRY) {
        this.setNetworkRetryTimer();
      }
    }
  }

  componentWillUnmount() {
    this.clearTimer();
    this.clearNetworkRetryTimer();
  }

  handleMouseEnter(e) {
    const { options } = this.props;

    if (options && !options.autoHide) {
      return;
    }
    this.clearTimer();
  }

  handleMouseLeave(e) {
    const { options } = this.props;

    if (options && !options.autoHide) {
      return;
    }
    this.setTimer(1000);
  }

  render() {
    const { active, message, options, hasNext, retryNetwork } = this.props;
    let option = null;

    if (options) {
      switch (options.type) {
        case CONSTANT.TOASTER_OPTION_TYPES.NETWORK_RETRY:
          option = (
            <div className="opt-i">
              <button type="button" className="btn" name="retry" onClick={e => {
                clearTimeout(self.retryTimer);
                retryNetwork();
              }}>RETRY</button>
            </div>
          )
          break;
        default:

      }
    }

    return (
      <div className={className('toaster', { 'active': active })}>
        <div className={className('toaster-b', { 'with-opt': (options && options.type), 'error': (options && options.error) })} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <div className="msg" ref="message">
            { message }
          </div>
          <div className="opt">
            { option }
          </div>
        </div>
      </div>
    )
  }
}
