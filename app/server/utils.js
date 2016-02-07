import sessionManager from './session_manager';

export var getSessionIdFromRequest = function(req) {
  let authHeader = req.get('Authorization');
  if (!authHeader) {
    return;
  }
  if (authHeader.indexOf(' ') !== 6) {
    return;
  }
  authHeader = authHeader.split(' ');
  if (!(authHeader.length === 2 && authHeader[0].toLowerCase() === 'bearer')) {
    return;
  }
  try {
    return new Buffer(authHeader[1], 'base64').toString();
  } catch(e) {
    return;
  }
}

export var setSessionIdHeader = function(req, res, next) {
  let sessionId = getSessionIdFromRequest(req);
  if (!sessionId || !sessionManager.get(sessionId)) {
    return res.send(401, 'Unauthorised');
  }
  req.headers['sessionId'] = sessionId;
  next();
}
