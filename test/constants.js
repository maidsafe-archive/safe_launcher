export const CONSTANTS = {
  AUTH_PAYLOAD: {
    app: {
      name: 'test app name',
      id: 'test.maidsafe.net',
      version: '0.0.1',
      vendor: 'MaidSafe'
    },
    permissions: []
  },
  AUTH_PAYLOAD_LOW_LEVEL_API: {
    app: {
      name: 'test app name',
      id: 'test.maidsafe.net',
      version: '0.0.1',
      vendor: 'MaidSafe'
    },
    permissions: ['LOW_LEVEL_API']
  },
  API: {
    AUTH: 'auth',
    NFS_DIR: 'nfs/directory/',
    NFS_FILE: 'nfs/file/',
    DNS: 'dns/',
    IMMUT: 'immutable-data/',
    STRUCT: 'structured-data/',
    CIPHER: 'cipher-opts/',
    DATA_ID: 'data-id/',
    APPEND: 'appendable-data/',
    SIGN_KEY: 'sign-key/'
  },
  ENCRYPTION: {
    PLAIN: 'PLAIN',
    SYMMETRIC: 'SYMMETRIC',
    ASYMMETRIC: 'ASYMMETRIC'
  },
  TYPE_TAG: {
    UNVERSIONED: 500,
    VERSIONED: 501
  }
};

export const MESSAGES = {
  FIELDS_MISSING_MSG: 'Fields are missing',
  EMPTY_VALUE_MSG: 'Values cannot be empty',
  INVALID_PERMISSION_REQ: 'Invalid permissions requested',
  UNAUTHORISED: 'Unauthorised',
  INVALID_DIR_PATH: 'Directory path specified is not valid',
  CANNOT_DELETE_ROOT: 'Cannot delete root directory',
  REQUIRED_PARAMS_MISSING: 'Invalid request. Required parameters are missing',
  CONTENT_LENGTH_NOT_FOUND: 'Content-Length header is not present',
  LOW_LEVEL_API_ACCESS_NOT_GRANTED: 'Low level api access is not granted'
};
