exports.sendError = function(id, errorCode, msg) {
  process.send({
    id: id,
    errorCode: errorCode,
    errorMsg: msg
  });
};

exports.send = function(id, response) {
  process.send({
    id: id,
    errorCode: 0,
    data: response
  });
};
