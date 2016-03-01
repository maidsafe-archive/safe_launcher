/**
 * Validate Fields Factory
 */
window.safeLauncher.factory('validateFieldsFactory', [ 'MESSAGES', 'CONSTANTS',
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
      if (!val) {
        return MESSAGES.PIN_FIELD_BLANK;
      }
      if (isNaN(val)) {
        return MESSAGES.PIN_MUST_BE_NUM;
      }
      if (val.length < CONSTANTS.PIN_MIN_LEN) {
        return MESSAGES.PIN_FOUR_CHAR_LONG;
      }
      return null;
    };

    // validate keyword
    var validateKeyword = function(val) {
      if (!val) {
        return MESSAGES.KEYWORD_FIELD_BLANK;
      }
      if (val.length < CONSTANTS.KEYWORD_MIN_LEN) {
        return MESSAGES.KEYWORD_SIX_CHAR_LONG;
      }
      return null;
    };

    // valiate password
    var validatePassword = function(val) {
      if (!val) {
        return MESSAGES.PASSWORD_FIELD_BLANK;
      }
      if (val.length < CONSTANTS.PASSWORD_MIN_LEN) {
        return MESSAGES.PASSWORD_SIX_CHAR_LONG;
      }
      return null;
    };

    // validate confirm pin
    var validateConfirmPIN = function(val, match) {
      if (!match) {
        return MESSAGES.CONFIRM_PASSWORD_FIELD_BLANK;
      }
      if (val !== match) {
        return MESSAGES.ENTRIES_DONT_MATCH;
      }
      return null;
    };

    // validate confirm keyword
    var validateConfirmKeyword = function(val, match) {
      if (!match) {
        return MESSAGES.CONFIRM_KEYWORD_FIELD_BLANK;
      }
      if (val !== match) {
        return MESSAGES.ENTRIES_DONT_MATCH;
      }
      return null;
    };

    // validate confirm password
    var validateConfirmPassword = function(val, match) {
      if (!match) {
        return MESSAGES.CONFIRM_PASSWORD_FIELD_BLANK;
      }
      if (val !== match) {
        return MESSAGES.ENTRIES_DONT_MATCH;
      }
      return null;
    };

    self.validateField = function(val, fieldName) {
      if (fieldName === self.AUTH_FIELDS.PIN) {
        return validatePin(val);
      }
      if (fieldName === self.AUTH_FIELDS.KEYWORD) {
        return validateKeyword(val);
      }
      if (fieldName === self.AUTH_FIELDS.PASSWORD) {
        return validatePassword(val);
      }
    };

    self.validateConfirmationField = function(val, match, fieldName) {
      if (fieldName === self.AUTH_FIELDS.CONFIRM_PIN) {
        return validateConfirmPassword(val, match);
      }
      if (fieldName === self.AUTH_FIELDS.CONFIRM_KEYWORD) {
        return validateConfirmKeyword(val, match);
      }
      if (fieldName === self.AUTH_FIELDS.CONFIRM_PASSWORD) {
        return validateConfirmPassword(val, match);
      }
    };

    return self;
  }
]);
