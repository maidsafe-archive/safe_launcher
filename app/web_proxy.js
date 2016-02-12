var http = require('http');
var httpProxy = require('http-proxy');
var url = require('url');
var proxy = httpProxy.createProxyServer({});

var safenetPath = /\.safenet$/i;
var safenetApiPath = /\api.safenet$/i;

var DEFAULT_SERVICE = 'WWW';
var DEFAULT_FILE = 'index.html';

export default class ProxyServer {
  constructor(port, redirectPort) {
    this.port = port;
    this.redirectPort = redirectPort;
    this.server = null;
  }



  start() {
    this.server = http.createServer(function(req, res) {
      var urlServe = url.parse(req.url);
      if (safenetPath.test(urlServe.host)) {
        if (safenetApiPath.test(urlServe.host)) {
          return proxy.web(req, res, {
            target: 'http://localhost:' + this.redirectPort + '/'
          });
        }
        var tokens = urlServe.host.split('.');
        if (tokens.length === 3 && tokens[0] === DEFAULT_SERVICE) { // redirect www.host to host
          res.statusCode = 302;
          res.setHeader('location', 'http://' + tokens[1] + '.' + tokens[2]);
          return res.end();
        }
        var service = tokens.length === 3 ? tokens[0] : DEFAULT_SERVICE;
        var domain = tokens.length === 3 ? tokens[1] : tokens[0];
        var path = urlServe.pathname.split('/').slice(1).join('/') || DEFAULT_FILE;
        req.url = urlServe.protocol + '//' + urlServe.host + '/dns/' + domain + '/' + service + '/' + path;
      } else {
        proxy.web(req, res, {
          target: urlServe.protocol + '//' + urlServe.host
        });
      }
    });
    this.server.listen(this.port);
  }

  stop() {
    this.server.stop();
  }
}
