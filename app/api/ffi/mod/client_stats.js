var util = require('./util.js');

var fetchGetsCount = function(reqId, lib, clientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    var count = lib.client_issued_gets(clientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.send(reqId, count);
};

var fetchDeletesCount = function(reqId, lib, clientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    var count = lib.client_issued_deletes(clientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.send(reqId, count);
};


var fetchPostsCount = function(reqId, lib, clientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    var count = lib.client_issued_posts(clientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.send(reqId, count);
};

var fetchPutsCount = function(reqId, lib, clientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    var count = lib.client_issued_puts(clientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.send(reqId, count);
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
        default:
            util.sendException(request.id, new Error('Invalid action'));
    }
};
