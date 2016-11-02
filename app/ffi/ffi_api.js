export default class FfiApi {
  constructor() {
    this.safeCore = null;
  }

  setSafeCore(safeCore) {
    this.safeCore = safeCore;
  }
  // Abstract methods
  /* eslint-disable no-unused-vars */
  drop(safeCore) {}
  /* eslint-enable no-unused-vars */
  getFunctionsToRegister() {}
}
