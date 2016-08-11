var ref = require('ref');
var util = require('./util.js');

var Handler = function(reqId) {
  this.handle = function(err, count) {
    if (err) {
      return util.sendException(reqId, err);
    }
    util.send(reqId, count);
  };
  return this.handle;
};

var fetchGetsCount = function(reqId, lib, clientHandle) {
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.client_issued_gets.async(clientHandle, new Handler(reqId));
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
};

var fetchDeletesCount = function(reqId, lib, clientHandle) {
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.client_issued_deletes.async(clientHandle, new Handler(reqId));
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
};

var fetchPostsCount = function(reqId, lib, clientHandle) {
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.client_issued_posts.async(clientHandle, new Handler(reqId));
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
};

var fetchPutsCount = function(reqId, lib, clientHandle) {
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.client_issued_puts.async(clientHandle, new Handler(reqId));
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
};

var getAccountInfo = function(reqId, lib, clientHandle) {
  var usedPtr = ref.alloc(ref.types.int);
  var availablePtr = ref.alloc(ref.types.int);
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.get_account_info.async(clientHandle, usedPtr, availablePtr, function(err, resultCode) {
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    if (err) {
      return util.sendException(reqId, err);
    }
    if (resultCode !== 0) {
      return util.sendError(reqId, resultCode);
    }
    util.send(reqId, {
      used: usedPtr.deref(),
      available: availablePtr.deref()
    });
  });
};

exports.execute = function(lib, request) {
  switch (request.action) {
    case 'gets':
      fetchGetsCount(request.id, lib, request.client);
      break;
    case 'deletes':
      fetchDeletesCount(request.id, lib, request.client);
      break;
    case 'puts':
      fetchPutsCount(request.id, lib, request.client);
      break;
    case 'posts':
      fetchPostsCount(request.id, lib, request.client);
      break;
    case 'acc-info':
      getAccountInfo(request.id, lib, request.client);
      break;
    default:
      util.sendException(request.id, new Error('Invalid action'));
  }
};
