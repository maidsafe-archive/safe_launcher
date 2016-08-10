var url = require('url');
var http = require('http');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});

var safenetPath = /\.safenet$/i;
var safenetApiPath = /\api.safenet$/i;

var DEFAULT_SERVICE = 'www';
var DEFAULT_FILE = 'index.html';

var initialiseArguments = function(args) {
  var processArgs = {};
  var previousKey = '';
  for (var i in args) {
    if (args[i].indexOf('--') === 0) {
      previousKey = args[i].replace(/--/, '');
      processArgs[previousKey] = null;
    } else {
      processArgs[previousKey] = args[i];
    }
  }
  return processArgs;
};

var sendLog = function(level, msg) {
  process.send(JSON.stringify({
    type: 'log',
    msg: {
      level: level,
      log: msg
    }
  }));
};

var args = initialiseArguments(process.argv);

var unSafeMode = args.hasOwnProperty('unsafe_mode');

var server = http.createServer(function(req, res) {
  try {
    var urlServe = url.parse(req.url);
    if (!safenetPath.test(urlServe.host)) {
      res.writeHead(403);
      res.write('Only \'.safenet\' pages can be accessed');
      return res.end();
    }
    var origin = req.headers.origin;
    if (!unSafeMode && origin && !safenetPath.test(origin)) {
      res.writeHead(403);
      res.write('Invalid request origin - ' + (origin || 'No origin found') +
          '. Origin can only be from sites with .safenet TLD');
      return res.end();
    }
    // Setting CSP Headers
    if (!unSafeMode) {
      res.setHeader('Content-Security-Policy', 'default-src \'self\' *.safenet; object-src \'none\';' +
        ' base-uri \'self\'; form-action http://api.safenet; frame-ancestors *.safenet; child-src *.safenet');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    if (unSafeMode || safenetApiPath.test(urlServe.host)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Access-Control-Allow-Headers, ' +
        'Origin, Accept, X-Requested-With, Content-Type, Content-Length, Metadata, Range,' +
        'Access-Control-Request-Method, Access-Control-Request-Headers, Metadata');
      return proxy.web(req, res, {
        target: 'http://localhost:' + args.serverPort + '/'
      });
    }
    var tokens = urlServe.host.split('.');
    if (tokens.length === 3 && tokens[0] === DEFAULT_SERVICE) { // redirect www.host to host
      res.statusCode = 302;
      res.setHeader('location', 'http://' + tokens[1] + '.' + tokens[2] + urlServe.path);
      return res.end();
    }
    var service = tokens.length === 3 ? tokens[0] : DEFAULT_SERVICE;
    var domain = tokens.length === 3 ? tokens[1] : tokens[0];
    var path = urlServe.pathname.split('/').slice(1).join('/') || DEFAULT_FILE;
    req.url = urlServe.protocol + '//' + urlServe.host + '/dns/' + service + '/' +
      domain + '/' + decodeURIComponent(path);
    proxy.web(req, res, {
      changeOrigin: true,
      target: 'http://localhost:' + args.serverPort
    });
  } catch (e) {
    sendLog('error', e.message);
  }
});

proxy.on('error', function(err, req, res) {});

server.listen(args.proxyPort, function() {
  process.send(JSON.stringify({
    type: 'connection',
    msg: {
      status: true,
      msg: 'Proxy started'
    }
  }));
  if (unSafeMode) {
    sendLog('INFO', 'Proxy started in unsafe mode');
  }
});

server.on('error', function(err) {
  process.send(JSON.stringify({
    type: 'connection',
    msg: {
      status: false,
      msg: err
    }
  }));
});
