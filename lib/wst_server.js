//###############################################################################
//##
//# Copyright (C) 2014-2015 Andrea Rocco Lotronto, 2017 Nicola Peditto
//##
//# Licensed under the Apache License, Version 2.0 (the "License");
//# you may not use this file except in compliance with the License.
//# You may obtain a copy of the License at
//##
//# http://www.apache.org/licenses/LICENSE-2.0
//##
//# Unless required by applicable law or agreed to in writing, software
//# distributed under the License is distributed on an "AS IS" BASIS,
//# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//# See the License for the specific language governing permissions and
//# limitations under the License.
//##
//###############################################################################

(function() {
  var WebSocketServer, bindSockets, http, net, url, wst_server;

  WebSocketServer = require('websocket').server;

  http = require('http');

  url = require("url");

  net = require("net");

  bindSockets = require("./bindSockets");

  module.exports = wst_server = (function() {
    function wst_server(dstHost, dstPort) {
      this.dstHost = dstHost;
      this.dstPort = dstPort;
      this.httpServer = http.createServer(function(request, response) {
        console.log((new Date()) + ' Received unhandled request for ' + request.url);
        response.writeHead(404);
        return response.end();
      });
      this.wsServer = new WebSocketServer({
        httpServer: this.httpServer,
        autoAcceptConnections: false
      });
    }

    wst_server.prototype.start = function(port) {
      this.httpServer.listen(port, function() {
        return console.log((new Date()) + (" Server is listening on port " + port));
      });
      return this.wsServer.on('request', (function(_this) {
        return function(request) {
          var host, remoteAddr, tcpconn, uri, _ref, _ref1;
          if (!_this.originIsAllowed(request.origin)) {
            return _this._reject(request, "Illegal origin " + origin);
          }
          uri = url.parse(request.httpRequest.url, true);
          _ref = [_this.dstHost, _this.dstPort], host = _ref[0], port = _ref[1];
          if (host && port) {
            remoteAddr = "" + host + ":" + port;
          } else {
            if (!uri.query.dst) {
              return _this._reject(request, "No tunnel target specified");
            }
            remoteAddr = uri.query.dst;
            _ref1 = remoteAddr.split(":"), host = _ref1[0], port = _ref1[1];
          }
          tcpconn = net.connect({
            port: port,
            host: host
          }, function() {
            var wsconn;
            console.log((new Date()) + ' Establishing tunnel to ' + remoteAddr);
            wsconn = request.accept('tunnel-protocol', request.origin);
            return bindSockets(wsconn, tcpconn);
          });
          return tcpconn.on("error", function(err) {
            return _this._reject(request, "Tunnel connect error to " + remoteAddr + ": " + err);
          });
        };
      })(this));
    };

    wst_server.prototype.originIsAllowed = function(origin) {
      return true;
    };

    wst_server.prototype._reject = function(request, msg) {
      request.reject();
      return console.log((new Date()) + ' Connection from ' + request.remoteAddress + ' rejected: ' + msg);
    };

    return wst_server;

  })();

}).call(this);

//# sourceMappingURL=wst_server.map
