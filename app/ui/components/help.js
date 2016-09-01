import React, { Component, PropTypes } from 'react';
import { openExternal, appVersion } from '../utils/app_utils';

export default class Help extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div className="help">
        <div className="help-b">
          <h3 className="title first">Safe Launcher: Version {appVersion}</h3>
          <p className="p">
            The SAFE Network and Launcher are still in test phases and may only work if you are using the lastest version.
          </p>
          <h3 className="title">Tutorials:</h3>
          <p className="p">
            Learn how to get set up on the SAFE Network at
            <a href="#" onClick={e => {
              e.preventDefault();
              openExternal('https://maidsafe.readme.io');
            }}>maidsafe.readme.io</a>.
            Here you&rsquo;ll find tutorials on setting up and using the Launcher and example apps from MaidSafe.
          </p>
          <ul className="list">
            <li><a href="#" onClick={e => {
              e.preventDefault();
              openExternal('https://maidsafe.readme.io/docs/launcher');
            }}>Using Launcher</a></li>
            <li><a href="#" onClick={e => {
              e.preventDefault();
              openExternal('https://maidsafe.readme.io/docs/proxy-setup');
            }}>Proxy Setup</a></li>
            <li><a href="#" onClick={e => {
              e.preventDefault();
              openExternal('https://maidsafe.readme.io/docs/install-demo-app');
            }}>Install Demo Application</a></li>
          </ul>
          <h3 className="title">Discussions:</h3>
          <p className="p">
            You can join the discussion on the <a href="#" onClick={e => {
              e.preventDefault();
              openExternal('https://safenetforum.org');
            }}>Community forum</a>.
            If you&rsquo;d like to contribute to the code or have found any issues, you can find us on <a href="#" onClick={e => {
              e.preventDefault();
              openExternal('https://github.com/maidsafe/safe_launcher/issues');
            }}>GitHub</a>.
          </p>
        </div>
      </div>
    )
  }
}
