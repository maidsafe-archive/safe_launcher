export var getSessionIdFromRequest = function(req) {
  let authHeader = req.get('Authorization');
  if (!authHeader && authHeader.indexOf(' ') === 6) {
    return;
  }
  authHeader = authHeader.split(' ');
  if (!(authHeader.length === 2 && authHeader[0].toLowerCase() === 'bearer')) {
    return;
  }
  try {
    return (new Buffer(authHeader[1], 'base64')).toString();
  } catch(e) {
    return;
  }
}
