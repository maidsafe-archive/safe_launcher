export const CONSTANT = {
  FETCH_DELAY: 60000,
  ACCOUNT_FETCH_INTERVAL: 15 * 60000,
  ACCOUNT_UPDATE_TIMEOUT: 120, // in seconds
  TOSATER_TIMEOUT: 3000,
  TOASTER_OPTION_TYPES: {
    NETWORK_RETRY: 'NETWORK_RETRY'
  },
  TOASTER_INTERVAL: 200,
  MAX_RETRY_COUNT_IN_SECONDS: 500
};

export const MESSAGES = {
  NETWORK_CONNECTING: 'Connecting to SAFE Network',
  NETWORK_CONNECTED: 'Network connected',
  NETWORK_DISCONNECTED: 'Network Disconnected. Retrying in',
  NETWORK_RETRYING: 'Trying to reconnnect to the network',
  NETWORK_NOT_CONNECTED: 'Network not connected yet!',
  PROXY_SERVER_ERROR: 'Failed to connect Proxy Server',
  APP_REVOKED: 'Revoked access for ',
};
