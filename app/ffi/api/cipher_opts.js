import ref from 'ref';

import FfiApi from '../ffi_api';

const int32 = ref.types.int32;
const u64 = ref.types.uint64;
const u64Pointer = ref.refType(u64);

class CipherOpts extends FfiApi {

  constructor() {
    super();
  }

  getFunctionsToRegister() {
    return {
      'cipher_opt_new_plaintext': [int32, [u64Pointer]],
      'cipher_opt_new_symmetric': [int32, [u64Pointer]],
      'cipher_opt_new_asymmetric': [int32, [u64, u64Pointer]],
      'cipher_opt_free': [int32, [u64]]
    };
  }

  getCipherOptPlain() {
    const self = this;
    const executor = async (resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      self.safeCore.cipher_opt_new_plaintext.async(handleRef, onResult);
    };
    return new Promise(executor);
  }

  getCipherOptSymmetric() {
    const self = this;
    const executor = async (resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      self.safeCore.cipher_opt_new_symmetric.async(handleRef, onResult);
    };
    return new Promise(executor);
  }

  getCipherOptAsymmetric(privateKeyHandle) {
    const self = this;
    const executor = async (resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      self.safeCore.cipher_opt_new_asymmetric.async(privateKeyHandle, handleRef, onResult);
    };
    return new Promise(executor);
  }

  dropHandle(handleId) {
    const self = this;
    const executor = async (resolve, reject) => {
      const onResult = (err, res) => {        
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      self.safeCore.cipher_opt_free.async(handleId, onResult);
    };
    return new Promise(executor);
  }

}

const cipherOpts = new CipherOpts();
export default cipherOpts;
