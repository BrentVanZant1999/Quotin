//app.js
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server started.");

var SOCKET_LIST = {};

var PlayerObject = function(){
    var self = {
        room:-1,
        lastString:"",
        points:0,
        name:"",
        id:0,
    }
    self.updatePoints = function(pointsAdded){
        self.points += pointsAdded;
    }
    return self;
}

var Player = function(nameVar, idNum){
    var self = PlayerObject();
    self.name = nameVar;
    self.id = idNum;
    self.room = 0;
    self.points = 0;

    self.addPoints = function(pointsToAdd) {
      self.updatePoints(pointsToAdd);
    }
    Player.list[idNum] = self;
    return self;
}
//define a list of all players currently online.
Player.list = {};

Player.onConnect = function(name,socket){
    var player = Player(name, socket.id);
    socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
    });
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}


var DEBUG = true;
var socketCounter = 0;
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket) {
    socket.id = socketCounter;
    socketCounter++;
    SOCKET_LIST[socket.id] = socket;

    socket.on('disconnect',function() {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('sendMsgToServer',function(data) {
        var playerName = Player.list[socket.id].name;
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
        }
    });

    socket.on('evalServer',function(data) {
        if(!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer',res);
    });
});

setInterval(function(){
  //interval actions
},1000/25);
