var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);

var SOCKET_LIST = {};
var GENERAL_LIST = {};
var GAME_LIST = {};
var BOOK_LIST = {};
var MOVIE_LIST = {};

var Entity = function(){
    var self = {
        room:-1,
        points:0,
        id:"",
        name:"",
    }
    self.updatePoints = function(inputPoints){
        self.points += self.inputPoints;
    }
    return self;
}

var Player = function(id, playerName){
    var self = Entity();
    self.id = id;
    self.name = playerName;
    self.points = 0;
    self.room = 0;
    self.addPoints = function(points){
      self.updatePoints(points);
    }
    Player.list[id] = self;
    return self;
}

Player.list = {};

Player.onConnect = function(socket, playerName){
    var player = Player(socket.id, playerName);
    socket.on('roomButton',function(data){
      gotoRoom(socket,data.roomNumber);
    });
}
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}


var DEBUG = true;

var USERS = {
    //username:password
    "Brent":"password",
    "bob2":"bob",
    "bob3":"ttt",
}
var gotoRoom= function(socket,roomNumber){
  delete GENERAL_LIST[socket.id];
  delete MOVIE_LIST[socket.id];
  delete GAME_LIST[socket.id];
  delete BOOK_LIST[socket.id];
  if (roomNumber == 0 ) {
    GENERAL_LIST[socket.id] = socket;
    Player.list[socket.id].room = 0;
    socket.emit('changeRoom',{roomName:"General Chat"});
  }
  else if (roomNumber == 1 ) {
    MOVIE_LIST[socket.id] = socket;
    Player.list[socket.id].room = 1;
    socket.emit('changeRoom',{roomName:"Movie Chat"});
  }
  else if (roomNumber == 2 ) {
    GAME_LIST[socket.id] = socket;
    Player.list[socket.id].room = 2;
    socket.emit('changeRoom',{roomName:"Game Chat"});
  }
  else if (roomNumber == 3 ) {
    BOOK_LIST[socket.id] = socket;
    Player.list[socket.id].room = 3;
    socket.emit('changeRoom',{roomName:"Book Chat"});
  }
}

var isValidPassword = function(data,cb){
    setTimeout(function(){
        cb(USERS[data.username] === data.password);
    },10);
}
var isUsernameTaken = function(data,cb){
    setTimeout(function(){
        cb(USERS[data.username]);
    },10);
}
var addUser = function(data,cb){
    setTimeout(function(){
        USERS[data.username] = data.password;
        cb();
    },10);
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    socket.on('signIn',function(data){
        isValidPassword(data,function(res){
            if(res){
                Player.onConnect(socket, data.username);
                gotoRoom(socket, 0);
                socket.emit('signInResponse',{success:true});
            } else {
                socket.emit('signInResponse',{success:false});
            }
        });
    });
    socket.on('signUp',function(data){
        isUsernameTaken(data,function(res){
            if(res){
                socket.emit('signUpResponse',{success:false});
            } else {
                addUser(data,function(){
                    socket.emit('signUpResponse',{success:true});
                });
                Player.onConnect(socket, data.username);
                gotoRoom(socket, 0);
                socket.emit('signInResponse',{success:true});
            }
        });
    });

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('sendMsgToServer',function(data){
        var playerName = Player.list[socket.id].name;
        var roomNumber = Player.list[socket.id].room;
        if (roomNumber == 0 ) {
          for(var i in GENERAL_LIST){
              GENERAL_LIST[i].emit('addToChat',playerName + ': ' + data);
          }

        }
        else if (roomNumber == 1 ) {
          for(var i in MOVIE_LIST){
            MOVIE_LIST[i].emit('addToChat',playerName + ': ' + data);
          }
        }
        else if (roomNumber == 2 ) {

          for(var i in GAME_LIST){
            GAME_LIST[i].emit('addToChat',playerName + ': ' + data);
          }
        }
        else if (roomNumber == 3 ) {
          for(var i in BOOK_LIST){
            BOOK_LIST[i].emit('addToChat',playerName + ': ' + data);
          }
        }
    });

    socket.on('evalServer',function(data){
        if(!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer',res);
    });



});

setInterval(function(){
  /*
   * Interval Functions
   */
},1000/25);
