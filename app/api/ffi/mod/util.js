exports.sendError = function(id, errorCode) {
  process.send({
    id: id,
    errorCode: errorCode
  });
};

exports.send = function(id, response) {
  process.send({
    id: id,
    errorCode: 0,
    data: response
  });
};
