import React, { Component, PropTypes } from 'react';

export default class Permission extends Component {
  static propTypes = {
    type: PropTypes.string.isRequired
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

    return (
      <div className="permissions-i">
        <label htmlFor="safeDrivePermission" className="permissions-name none">None</label>
      </div>
    );
  }
}
