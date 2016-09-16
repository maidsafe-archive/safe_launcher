'use strict';

export default class FfiApi {
  constructor() {
    this.safeCore = null;
  }

  setSafeCore(safeCore) {
    this.safeCore = safeCore;
  }
  // Abstract methods
  drop(safeCore) {}
  getFunctionsToRegister() {}

}
