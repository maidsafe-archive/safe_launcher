var ref = require('ref');
var int = ref.types.int;

var execute = function(lib, client, requestId, payload) {
  lib.execute.async(JSON.stringify(payload), client, function(err, result) {
    if (err) {
      sendException(requestId, err);
    }
    if (result === 0) {
      return send(requestId);
    }
    sendError(requestId, result);
  });
};

var executeForContent = function(lib, client, requestId, payload) {
  var sizePtr = ref.alloc(int);
  var capacityPtr = ref.alloc(int);
  var resultPtr = ref.alloc(int);
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.execute_for_content.async(JSON.stringify(payload), sizePtr, capacityPtr, resultPtr, client, function (err, pointer) {
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    var result = resultPtr.deref();
    if (pointer.isNull() || result !== 0) {
      return sendError(requestId, result);
    }
    var size = sizePtr.deref();
    var capacity = capacityPtr.deref();
    var response = ref.reinterpret(pointer, size).toString();
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_vector(pointer, size, capacity);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    send(requestId, response);
  });
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

var sendException = function(id, ex) {
  process.send({
    id: id,
    errorCode: 999,
    errorMsg: ex.message
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
exports.sendException = sendException;
exports.sendError = sendError;
exports.sendLog = sendLog;
