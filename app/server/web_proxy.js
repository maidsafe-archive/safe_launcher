var http = require('http');
var httpProxy = require('http-proxy');
var url = require('url');
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

var args = initialiseArguments(process.argv);

var server = http.createServer(function(req, res) {
  var urlServe = url.parse(req.url);
  if (!safenetPath.test(urlServe.host)) {
    res.writeHead(403);
    res.write('Only \'.safenet\' pages can be accessed');
    res.end();
  }
  var origin = req.headers['origin'];
  if (origin && !safenetPath.test(origin)) {
    res.writeHead(403);
    res.write('Invalid request origin - ' + (origin || 'No origin found') +
     '. Origin can only be from sites with .safenet TLD');
    return res.end();
  }
  // Setting CSP Headers
  res.setHeader('Content-Security-Policy', 'default-src self *.safenet; object-src none; base-uri self;\
  form-action http://api.safenet; frame-ancestors self;X-Frame-Options : SAMEORIGIN');

  if (safenetApiPath.test(urlServe.host)) {
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
});

proxy.on('error', function(err, req, res) {});
server.listen(args.proxyPort, function() {
// server.listen(args.serverPort, function() {
  process.send(JSON.stringify( {
    status: true,
    data: 'Proxy Started'
  }));
});
server.on('error', function(err) {
  process.send(JSON.stringify({
    status: false,
    data: err
  }))
});
