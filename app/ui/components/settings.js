import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import { openExternal } from '../utils/app_utils';

export default class Settings extends Component {
  static propTypes = {
    proxy: PropTypes.bool.isRequired,
    onProxyClick: PropTypes.func.isRequired
  };

  render() {
    const { proxy, onProxyClick } = this.props;
    let switchBtnClassNames = className(
      'switch',
      { 'active': proxy }
    );

    return (
      <div className="settings">
        <div className="settings-b">
          <h3 className="title">Proxy Settings</h3>
          <p className="desc">
            The proxy server allows you to view websites and content from the SAFE Network
            in your browser of choice (<a href="#" onClick={ (e) => {
              e.preventDefault();
              openExternal('https://maidsafe.readme.io/docs/proxy-setup');
            }}>setup instructions</a>).
          </p>
          <div className="settings-i" onClick={() => {
            onProxyClick()
          }}>
            <div className="settings-i-ctn">
              <h3 className="settings-i-name">Proxy Server</h3>
              <h3 className="settings-i-desc">Is { proxy ? 'enabled' : 'disabled' }</h3>
            </div>
            <div className="opt">
              <span className={switchBtnClassNames}></span>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
