var ref = require('ref');
var int = ref.types.int;

var execute = function(lib, client, requestId, payload) {
  var result = lib.execute(JSON.stringify(payload), client);
  if (result === 0) {
    return send(requestId);
  }
  sendError(requestId, result);
};

var executeForContent = function(lib, client, requestId, payload) {
  var sizePtr = ref.alloc(int);
  var capacityPtr = ref.alloc(int);
  var resultPtr = ref.alloc(int);
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  var pointer = lib.execute_for_content(JSON.stringify(payload), sizePtr, capacityPtr, resultPtr, client);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  var result = resultPtr.deref();
  if (result !== 0) {
    return sendError(requestId, result);
  }
  var size = sizePtr.deref();
  var capacity = capacityPtr.deref();
  var response = ref.reinterpret(pointer, size).toString();
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.drop_vector(pointer, size, capacity);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  send(requestId, response);
};

var send = function(id, response) {
  process.send({
    id: id,
    errorCode: 0,
    data: response
  });
};

var sendConnectionStatus = function (status, isRegisteredClient) {
  send(0, {
    type: 'status',
    state: status,
    registeredClient: isRegisteredClient
  });
};

var sendError = function(id, errorCode, msg) {
  process.send({
    id: id,
    errorCode: errorCode,
    errorMsg: msg
  });
};

var sendLog = function(level, logMsg) {
  process.send({
    id: 'log',
    data: {
      level: level,
      msg: logMsg
    }
  });
};

exports.execute = execute;
exports.executeForContent = executeForContent;
exports.send = send;
exports.sendConnectionStatus = sendConnectionStatus;
exports.sendError = sendError;
exports.sendLog = sendLog;
