import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import { openExternal } from '../utils/app_utils';

export default class InitialSettings extends Component {

  constructor(props){
    super(props);
  }

  static propTypes = {
    proxy: PropTypes.bool.isRequired,
    initialSettings: PropTypes.bool.isRequired,
    onProxyClick: PropTypes.func.isRequired,
    onComplete: PropTypes.func.isRequired
  }

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  componentWillUpdate(nextProps) {
    const { initialSettings } = nextProps;
    const { router } = this.context;
    if (initialSettings) {
      return router.push('/home');
    }
  }

  render() {
    const { proxy, onProxyClick, onComplete } = this.props;
    let switchBtnClassNames = className(
      'switch',
      { 'active': proxy }
    );

    return (
      <div className="settings-popup">
        <div className="settings-popup-b">
          <div className="settings-popup-cnt">
            <div className="settings popup">
              <div className="settings-b">
                <h3 className="title">Proxy Settings</h3>
                <p className="desc">
                  The proxy server allows you to view websites and content from SAFE Network
                  in your browser of choice
                  (<a href="#" onClick={(e) => {
                    e.preventDefault();
                    openExternal('https://maidsafe.readme.io/docs/proxy-setup');
                  }}>read more</a>).
                </p>
                <p className="desc last">
                  If you would like to disable this proxy, please use the toggle below.
                </p>
                <div className="settings-i" onClick={ () => {
                  onProxyClick()
                }}>
                  <div className="settings-i-ctn">
                    <h3 className="settings-i-name">Proxy</h3>
                    <h3 className="settings-i-desc">Is { proxy ? 'enabled' : 'disabled' }</h3>
                  </div>
                  <div className="opt">
                    <span className={switchBtnClassNames}></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="settings-popup-opt">
              <div className="settings-popup-opt-i">
                <button type="button" className="btn flat primary" name="settings_continue" onClick={() => {
                  onComplete()
                }}>Continue</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
