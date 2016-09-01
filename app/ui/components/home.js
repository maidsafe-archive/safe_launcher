import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import className from 'classnames';

export default class Home extends Component {
  constructor() {
    super();
    this.handleLinkClick = this.handleLinkClick.bind(this);
  }

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  handleLinkClick(e) {
    if (this.props.authProcessing) {
      e.preventDefault();
    }
  }

  render() {
    const { router } = this.context;
    const { authProcessing } = this.props;

    return (
      <div className="tab">
        <div className="tab-b">
          <div className="tab-nav">
            <ul>
              <li className={className({ 'active': router.isActive('/account') })}>
                <Link to="/account">
                  <span className="icn account-icn"></span>
                  <span className="txt">Account</span>
                </Link>
              </li>
              <li className={className({ 'active': router.isActive('/dashboard'), 'disabled': authProcessing })}>
                <Link to="/dashboard" onClick={this.handleLinkClick}>
                  <span className="icn dashboard-icn"></span>
                  <span className="txt">Dashboard</span>
                </Link>
              </li>
              <li className={className({ 'active': router.isActive('/app_logs'), 'disabled': authProcessing })}>
                <Link to="/app_logs" onClick={this.handleLinkClick}>
                  <span className="icn log-icn"></span>
                  <span className="txt">Logs</span>
                </Link>
              </li>
              <li className={className({ 'active': router.isActive('/settings'), 'disabled': authProcessing })}>
                <Link to="/settings" onClick={this.handleLinkClick}>
                  <span className="icn settings-icn"></span>
                  <span className="txt">Settings</span>
                </Link>
              </li>
              <li className={className({ 'active': router.isActive('/help'), 'disabled': authProcessing })}>
                <Link to="/help" onClick={this.handleLinkClick}>
                  <span className="icn help-icn"></span>
                  <span className="txt">Help</span>
                </Link>
              </li>
            </ul>
          </div>
          <div className="tab-cnt">
            { this.props.children }
          </div>
        </div>
      </div>
    )
  }
}
