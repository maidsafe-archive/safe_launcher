import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import { CONSTANT } from '../constant';

const INITIAL_RETRY_COUNT = 10;
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
    this.initialRetryCount = INITIAL_RETRY_COUNT;
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.setNetworkRetryTimer = this.setNetworkRetryTimer.bind(this);
  }

  componentDidUpdate() {
    const { options, retryCount } = this.props;
    this.clearNetworkRetryTimer();
    this.initialRetryCount = INITIAL_RETRY_COUNT * Math.pow(2, retryCount);
    this.initialRetryCount = Math.min(CONSTANT.MAX_RETRY_COUNT_IN_SECONDS, this.initialRetryCount);
    if (options) {
      if (options.autoHide) {
        this.setTimer();
      } else if (options.type === CONSTANT.TOASTER_OPTION_TYPES.NETWORK_RETRY) {
        this.setNetworkRetryTimer();
      }
    }
  }

  componentWillUnmount() {
    this.clearTimer();
    this.clearNetworkRetryTimer();
  }

  setTimer(timeout) {
    const { hasNext, showNextToaster, hideToaster } = this.props;
    this.timer = window.setTimeout(() => {
      this.clearTimer();
      if (hasNext) {
        return showNextToaster();
      }
      return hideToaster();
    }, timeout || CONSTANT.TOSATER_TIMEOUT);
  }

  setNetworkRetryTimer() {
    const { options, retryNetwork, user } = this.props;
    if (!(options && options.type === CONSTANT.TOASTER_OPTION_TYPES.NETWORK_RETRY)) {
      return this.clearNetworkRetryTimer();
    }
    this.retryTimer = window.setInterval(() => {
      this.message.innerText = `${this.props.message} ${this.initialRetryCount} sec`;
      if (this.initialRetryCount === 0) {
        this.initialRetryCount = INITIAL_RETRY_COUNT;
        this.clearNetworkRetryTimer();
        return retryNetwork(user);
      }
      this.initialRetryCount--;
    }, 1000);
  }

  clearNetworkRetryTimer() {
    this.initialRetryCount = 10;
    window.clearInterval(this.retryTimer);
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
    const { active, user, message, options, retryNetwork } = this.props;
    let option = null;
    const self = this;

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
                  self.clearNetworkRetryTimer();
                  return retryNetwork(user);
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
