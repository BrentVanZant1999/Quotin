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

var GUESSING_TIME = 15000;
var DISPLAY_TIME = 2500;
var RESULTS_TIME = 5000;
var GAME_RESULTS_TIME = 10000;
var GAME_START_TIME = 5000;
var GAME_ENDING_STRING = "---Game Ending---";
var GAME_STARTING_STRING = "Game Starting in ";
var GAME_OVER_STRING = "Game is over, new game starting in "
var Game = function(typeNum){
  var self = {
      type:typeNum,
      currentString:"test quote",
      promptString:"",
      acceptedAnswer:"Alexander Hamilton",
      isActive:false, //handles if is in guessing stage
      firstPlace:undefined,
      secondPlace:undefined,
      thirdPlace:undefined,
      round:0,
      timeDisplayLeft: 0,
      timeLeft:0,
      timePhase:0, // 0 game starting, 1 guesing, 2 guessing part two, 3 results, 4 game results
      isOver:false
  }
  var displayString = function(){
    //handle displaying preround
    if (timePhase == 0) {

    }
    if (timePhase == 1 || timePhase == 2) {
      if (type == 0 ){
        for (var i in MOVIE_LIST) {
          socket.emit(stringToDisplay, { promptString:self.promptString} );
        }
      }
      else if ( type == 1 ) {
        for (var i in GAME_LIST) {
            socket.emit(stringToDisplay, { promptString:self.promptString});
        }
      }
      else if ( type == 2 ) {
        for (var i in GAME_LIST) {
            socket.emit(stringToDisplay, { promptString:self.promptString});
        }
      }
    }
  }
  var passTime = function(timePassed){
    //handle the passing of time
  }
  var displayLeaderBoard = function(){
    //display the leaderboard
  }
  var displayPlayerStats = function(socket){
    //display the players stats
  }
  var updateRound = function() {
    //call update answer depending on game type
  }
  var updateAnswer = function(quote,word) {

  }
  var endGame = function(socket) {

  }
  var handleSubmission = function(player, answer) {

  }
  return self;
}

var gameGame = Game(0);
var bookGame = Game(1);
var movieGame = Game(2);

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
    socket.on('answerSubmit',function(data){
      var answer = data.answer;
      if (player.room == 1){
        movieGame.handleSubmission(player, answer)
      }
      else if (player.room == 2){
        gameGame.handleSubmission(player,answer)
      }
      else if (player.room == 3){
        bookGame.handleSubmission(player,answer)
      }
    });
}
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}


var DEBUG = true;

var USERS = {
    //username:password structures
    "Brent":"password",
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
  gameGame.passTime(1000/25);
  bookGame.passTime(1000/25);
  movieGame.passTime(1000/25);
},1000/25);
