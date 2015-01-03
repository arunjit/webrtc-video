var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('chunk', function(chunk) {
    console.log('chunk size:', chunk.length);
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
