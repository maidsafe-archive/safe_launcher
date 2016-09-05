import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import { CONSTANT } from '../constant';

export default class Toaster extends Component {
  static propTypes = {
    active: PropTypes.bool.isRequired,
    hasNext: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    options: PropTypes.object.isRequired,
    retryCount: PropTypes.number.isRequired,
    hideToaster: PropTypes.func.isRequired,
    showNextToaster: PropTypes.func.isRequired,
    retryNetwork: PropTypes.func.isRequired
  };

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

  componentDidUpdate() {
    const { options, retryCount } = this.props;
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

  setTimer(timeout) {
    this.timer = window.setTimeout(() => {
      this.clearTimer();
      if (this.props.hasNext) {
        return this.props.showNextToaster();
      }
      return this.props.hideToaster();
    }, timeout || CONSTANT.TOSATER_TIMEOUT);
  }

  setNetworkRetryTimer() {
    this.retryTimer = window.setInterval(() => {
      this.message.innerText = `${this.props.message} ${this.initialRetryCount} sec`;
      if (this.initialRetryCount === 0) {
        this.clearNetworkRetryTimer();
        return this.props.retryNetwork();
      }
      this.initialRetryCount--;
    }, 1000);
  }

  clearNetworkRetryTimer() {
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  clearTimer() {
    window.clearTimeout(this.timer);
    this.timer = null;
  }

  handleMouseEnter() {
    const { options } = this.props;

    if (options && !options.autoHide) {
      return;
    }
    this.clearTimer();
  }

  handleMouseLeave() {
    const { options } = this.props;

    if (options && !options.autoHide) {
      return;
    }
    this.setTimer(1000);
  }

  render() {
    const { active, message, options, retryNetwork } = this.props;
    let option = null;

    if (Object.keys(options).length > 0) {
      switch (options.type) {
        case CONSTANT.TOASTER_OPTION_TYPES.NETWORK_RETRY:
          option = (
            <div className="opt-i">
              <button
                type="button"
                className="btn"
                name="retry"
                onClick={() => {
                  clearTimeout(self.retryTimer);
                  retryNetwork();
                }}
              >RETRY</button>
            </div>
          );
          break;
        default:
          break;
      }
    }

    return (
      <div className={className('toaster', { active })}>
        <div
          className={
            className(
              'toaster-b',
              {
                'with-opt': (options && options.type),
                error: (options && options.error)
              }
            )
          }
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        >
          <div className="msg" ref={c => { this.message = c; }}>
            { message }
          </div>
          <div className="opt">
            { option }
          </div>
        </div>
      </div>
    );
  }
}
