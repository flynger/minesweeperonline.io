/*
  download node.js
  npm init
  npm install express --save
  npm install socket.io --save

*/

(function () {
  var express = require('./node_modules/express/index');
  var socket = require('./node_modules/socket.io/dist/index');

  var color = require('./color');
  var app = express();
  app.use(express.static('../public'));

  var port = 8000;
  var server;
  var io;
  var lst = [];
  var name = "";
  module.exports.init = function (p, n, c) {
    if (n) name = n;
    if (p) port = p;
    var m = "";
    if (n) m = ": " + name;
    c = c || color.blue;
    server = app.listen(port, () => console.log(c, "Starting Server" + m + " on port " + port));
    io = socket(server, {
      pingInterval: 900,
      pingTimeout: 5000,
      cookie: false
    });

    io.on('connection', (socket) => {
      module.exports.onConnect(socket);
      socket.on('disconnect', () => {
        module.exports.onDisconnect(socket)
        console.log(color.red, socket.id);
      });
      // module.exports.keywords(socket);
      for (var i = 0; i < lst.length; i++) {
        socket.on(lst[i].key, lst[i].func);
      }
      console.log(color.green, socket.id);
    });

    module.exports.send = function (data, key="send") {
      io.sockets.emit(key, data);
    };
    module.exports.emit = function (socketid, data, key="emit") {
      var targetSocket = io.sockets.sockets.get(socketid);
      if (!targetSocket) return;
      targetSocket.emit(key, data);
    };
  }
  module.exports.on = function (key, fnc) {
    lst.push({
      key: key,
      func: fnc
    });
  }

  module.exports.kick = module.exports.onDisconnect;

  module.exports.getAllSockets = function () {
    return io.sockets.connected;
  }

  module.exports.onConnect = function (socket) { };
  module.exports.onDisconnect = function (socket) { };
}());
