var util = require('./util.js');

var Handler = function(reqId) {
    this.handle = function(err, count) {
        if (err) {
            return util.sendException(reqId, err.message);
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
    lib.client_issued_deletes(clientHandle, new Handler(reqId));
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
};


var fetchPostsCount = function(reqId, lib, clientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    var count = lib.client_issued_posts(clientHandle, new Handler(reqId));
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
};

var fetchPutsCount = function(reqId, lib, clientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    var count = lib.client_issued_puts(clientHandle, new Handler(reqId));
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
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
