import React, { Component, PropTypes } from 'react';

export default class Permission extends Component {
  static propTypes = {
    type: PropTypes.string
  };

  render() {
    const { type } = this.props;

    if (type === 'SAFE_DRIVE_ACCESS') {
      return (
        <div className="permissions-i icn safe-drive">
          <input type="checkbox" name="safeDrivePermission" id="safeDrivePermission" />
          <label htmlFor="safeDrivePermission" className="permissions-name">
            SAFE Drive Access
          </label>
          <p className="permissions-desc">
            Allow this app to access the data stored in your SAFE Drive.
          </p>
        </div>
      );
    }
    if (type === 'LOW_LEVEL_API') {
      return (
        <div className="permissions-i icn safe-drive">
          <input type="checkbox" name="lowLevelApi" id="lowLevelApi" />
          <label htmlFor="lowLevelApi" className="permissions-name">
            Low Level API
          </label>
          <p className="permissions-desc">
            Allow extended access to primitive data types.
          </p>
        </div>
      );
    }

    return (
      <div className="permissions-i">
        <label htmlFor="safeDrivePermission" className="permissions-name none">None</label>
      </div>
    );
  }
}
