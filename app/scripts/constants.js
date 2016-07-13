/**
 * Constants
 */

// Messages
window.safeLauncher.constant('MESSAGES', {
  'PLEAUSE_USE_NUMBERS': 'Please use numbers only.',
  'PLEAUSE_USE_ATLEAST_FOUR_DIGITS': 'Please use atleast 4 digits.',
  'PLEAUSE_USE_ATLEAST_SIX_CHAR': 'Please use atleast 6 characters.',
  'PIN_MUST_BE_FOUR_CHAR_LONG_AND_NUM': 'PIN must be at least 4 digits long and numeric.',
  'KEYWORD_MUST_BE_SIX_CHAR_LONG': 'Keyword must be at least 6 characters long.',
  'PASSWORD_MUST_BE_SIX_CHAR_LONG': 'Password must be at least 6 characters long.',
  'NETWORK_NOT_CONNECTED': 'Waiting for establishing connection with SAFE Network'
});

// Constants
window.safeLauncher.constant('CONSTANTS', {
  'ACCOUNT_FETCH_INTERVAL': 15 * 60000,
  'PIN_MIN_LEN': 4,
  'KEYWORD_MIN_LEN': 6,
  'PASSWORD_MIN_LEN': 6,
  'FETCH_DELAY': 5000,
  'LOG_LIST_LIMIT': 100,
  'TOASTER_TIMEOUT': 5000,
  'ACCOUNT_INFO_UPDATE_TIMEOUT': 2 * 60000,
  'RETRY_NETWORK_INIT_COUNT': 10,
  'RETRY_NETWORK_MAX_COUNT': 500  
});
