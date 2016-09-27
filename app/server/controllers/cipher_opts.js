'use strict';

import sessionManager from '../session_manager';
import cypherOpts from '../../ffi/api/cipher_opts';
import {ENCRYPTION_TYPE} from '../../ffi/model/enum';
import {ResponseError, ResponseHandler} from '../utils';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';

export const getHandle = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const encType = req.params.encType.toUpperCase();
    if (!sessionInfo && encType !== ENCRYPTION_TYPE.PLAIN) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.lowLevelApi && encType !== ENCRYPTION_TYPE.PLAIN) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }

    let handle;
    switch (encType) {
      case ENCRYPTION_TYPE.PLAIN:
        handle = await cypherOpts.getCipherOptPlain();
        break;
      case ENCRYPTION_TYPE.SYMMETRIC:
        handle = await cypherOpts.getCipherOptSymmetric();
        break;
      case ENCRYPTION_TYPE.ASYMMETRIC:
        if (!req.params.keyHandle) {
          return next(new ResponseError(400, '\'key\' must be specified for Asymmetric encryption'));
        }
        handle = await cypherOpts.getCipherOptAsymmetric(req.params.keyHandle);
        break;
    }
    responseHandler(null, {
      handleId: handle
    });
  } catch (e) {
    responseHandler(e);
  }
};

export const dropHandle = async (req, res) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
   await cypherOpts.dropHandle(req.params.handleId);
   responseHandler();
  } catch (e) {
    responseHandler(e);
  }
};
