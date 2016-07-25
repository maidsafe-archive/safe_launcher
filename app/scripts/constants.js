/**
 * Constants
 */

// Messages
window.safeLauncher.constant('MESSAGES', {
  'PLEASE_USE_NUMBERS': 'Please use numbers only.',
  'PLEASE_USE_ATLEAST_FOUR_DIGITS': 'Please use minimum of 4 digits.',
  'PLEASE_USE_ATLEAST_SIX_CHAR': 'Please use minimum of 6 characters.',
  'PIN_MUST_BE_FOUR_CHAR_LONG_AND_NUM': 'PIN must be a minimum of 4 numeric digits.',
  'KEYWORD_MUST_BE_SIX_CHAR_LONG': 'Keyword must be a minimum of 6 characters.',
  'PASSWORD_MUST_BE_SIX_CHAR_LONG': 'Password must be a minimum of 6 characters.',
  'NETWORK_NOT_CONNECTED': 'Waiting for establishing connection with SAFE Network',
  'ENTRIES_DONT_MATCH': 'Entries don\'t match.',
  'PASS_VERY_WEEK': 'Very weak',
  'PASS_WEEK': 'Weak',
  'PASS_SOMEWHAT_SECURE': 'Somewhat secure',
  'PASS_SECURE': 'Secure'
});

// Constants
window.safeLauncher.constant('CONSTANTS', {
  'ACCOUNT_FETCH_INTERVAL': 15 * 60000,
  'PIN_MIN_LEN': 4,
  'KEYWORD_MIN_LEN': 6,
  'PASSWORD_MIN_LEN': 6,
  'FETCH_DELAY': 60000,
  'LOG_LIST_LIMIT': 100,
  'TOASTER_TIMEOUT': 3000,
  'ACCOUNT_INFO_UPDATE_TIMEOUT': 2 * 60000,
  'RETRY_NETWORK_INIT_COUNT': 10,
  'RETRY_NETWORK_MAX_COUNT': 500
});
