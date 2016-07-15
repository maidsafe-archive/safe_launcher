export default class Permission {
  constructor(list) {
    let self = this;
    self._PERMISSION_LIST = [
      'SAFE_DRIVE_ACCESS'
    ];
    self.list = [];
    list.forEach(function(permission) {
      self.list.push(permission.toUpperCase());
    });
  }

  isEqual(compareWith) {
    compareWith = compareWith || [];
    if (compareWith.length !== this.list.length) {
      return false;
    }
    for (var i in compareWith) {
      if (this.list.indexOf(compareWith[i]) < 0) {
        return false;
      }
    }
    return true;
  };

  isValid() {
    let self = this;
    var permission = null;
    for(var i = 0; i < self.list.length; i++) {
      permission = self.list[i];
      if (self._PERMISSION_LIST.indexOf(permission) === -1) {
        return false;
      }
    }
    return true;
  }

  hasSafeDriveAccess() {
    let self = this;
    return self.list.indexOf(self._PERMISSION_LIST[0]) !== -1;
  }
}
