import React, { Component, PropTypes } from 'react';
import Permission from './permission';

export default class AuthRequestPermissions extends Component {
  static propTypes = {
    permissions: PropTypes.array.isRequired
  };

  render() {
    const { permissions } = this.props;

    return (
      <div className="permissions">
        <h4 className="permissions-h">Permissions:</h4>
        {
          permissions.length === 0 ? <Permission /> :
            permissions.map((permission, i) => <Permission key={i} type={permission} />)
        }
      </div>
    );
  }
}
