/**
 * Validate Fields Factory
 */
window.safeLauncher.factory('validateFieldsFactory', [ 'MESSAGES', 'CONSTANTS',
  function(MESSAGES, CONSTANTS) {
    var self = this;

    // validate pin
    self.validatePin = function(val) {
      if (!val) {
        return MESSAGES.FIELD_BLANK;
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
    self.validateKeyword = function(val) {
      if (!val) {
        return MESSAGES.FIELD_BLANK;
      }
    };

    // valiate password
    self.validatePassword = function(val) {
      if (!val) {
        return MESSAGES.FIELD_BLANK;
      }
    };

    return self;
  }
]);
