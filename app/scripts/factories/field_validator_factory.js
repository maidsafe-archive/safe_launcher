/**
 * Validate Fields Factory
 */
window.safeLauncher.factory('fieldValidator', [ 'MESSAGES', 'CONSTANTS',
  function(MESSAGES, CONSTANTS) {
    var self = this;
    self.AUTH_FIELDS = {
      'PIN': 'pin',
      'KEYWORD': 'keyword',
      'PASSWORD': 'password',
      'CONFIRM_PIN': 'confirmPin',
      'CONFIRM_KEYWORD': 'confirmKeyword',
      'CONFIRM_PASSWORD': 'confirmPassword'
    };

    // validate pin
    var validatePin = function(val) {
      if (!val || isNaN(val) || (val.length < CONSTANTS.PIN_MIN_LEN)) {
        return MESSAGES.MUST_BE_FOUR_CHAR_LONG_AND_NUM;
      }
      return null;
    };

    // validate keyword or password
    var validateKeywordOrPassword = function(val) {
      if (!val || (val.length < CONSTANTS.KEYWORD_MIN_LEN)) {
        return MESSAGES.MUST_BE_SIX_CHAR_LONG;
      }
      return null;
    };

    self.validateField = function(val, fieldName) {
      if (fieldName === self.AUTH_FIELDS.PIN) {
        return validatePin(val);
      }
      if (fieldName === self.AUTH_FIELDS.KEYWORD) {
        return validateKeywordOrPassword(val);
      }
      if (fieldName === self.AUTH_FIELDS.PASSWORD) {
        return validateKeywordOrPassword(val);
      }
    };

    self.validateConfirmationField = function(val, match) {
      if (!match || (val !== match)) {
        return MESSAGES.ENTRIES_DONT_MATCH;
      }
      return null;
    };

    return self;
  }
]);
