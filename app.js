var express = require("express");
var app =  express();
var serv = require('http').Server(app);
const PORT = 2000; //process.env.PORT || 8000;
app.use(express.static(__dirname + '/client'));
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.listen(PORT);

var SOCKET_LIST = {};
var GENERAL_LIST = {};
var GAME_LIST = {};
var BOOK_LIST = {};
var MOVIE_LIST = {};

var GUESSING_TIME = 15;
var DISPLAY_TIME = 5;
var RESULTS_TIME = 5;
var GAME_ENDING_STRING = "---Game Ending---";
var GAME_STARTING_STRING = "Game Starting in ";
var GAME_OVER_STRING = "Game is over, new game starting in ";
var ROUND_OVER_STRING = "Round finished, new round starting in ";

//define game object
var Game = function(typeNum){
  //define self
  var self = {
      playerCount:0,
      leaderBoard:[],
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
      timePhase:0, // 0 game starting, 1 guesing, 2 results, 3 game results
      isOver:false
  }
  //add a player to count
  self.addPlayer = function(){
    self.playerCount++;
  }
  //remove a player from count
  self.removePlayer = function(){
    self.playerCount--;
  }
  //through displayString
  self.displayString = function(){
    //handle displaying preround
    if (self.timePhase == 0) {
        if (self.type == 0){
          for (var i in MOVIE_LIST) {
            socket.emit(stringToDisplay, { promptString:GAME_STARTING_STRING + self.timeDisplayLeft } );
          }
        }
        if (self.type == 1){
          for (var i in GAME_LIST) {
            socket.emit(stringToDisplay, { promptString:GAME_STARTING_STRING + self.timeDisplayLeft } );
          }
        }
        if (self.type == 2){
          for (var i in GAME_LIST) {
            socket.emit(stringToDisplay, { promptString:GAME_STARTING_STRING + self.timeDisplayLeft } );
          }
        }
    }
    //handle displaying quote string
   if (self.timePhase == 1 ) {
      if (self.type == 0 ){
        for (var i in MOVIE_LIST) {
          socket.emit(stringToDisplay, { promptString:self.promptString} );
        }
      }
      else if ( self.type == 1 ) {
        for (var i in GAME_LIST) {
            socket.emit(stringToDisplay, { promptString:self.promptString});
        }
      }
      else if ( self.type == 2 ) {
        for (var i in GAME_LIST) {
            socket.emit(stringToDisplay, { promptString:self.promptString});
        }
      }
    }
    //hand displaying end round
    if (self.timePhase == 2) {
       if (self.type == 0 ){
         for (var i in MOVIE_LIST) {
           socket.emit(stringToDisplay, { promptString:ROUND_OVER_STRING + self.timeDisplayLeft } );
         }
       }
       else if ( self.type == 1 ) {
         for (var i in GAME_LIST) {
             socket.emit(stringToDisplay, { promptString:ROUND_OVER_STRING + self.timeDisplayLeft  });
         }
       }
       else if ( self.type == 2 ) {
         for (var i in GAME_LIST) {
             socket.emit(stringToDisplay, { promptString:ROUND_OVER_STRING + self.timeDisplayLeft});
         }
       }
     }
    //handle displaying end game  GAME_OVER_STRING
    if (self.timePhase == 3) {
       if (self.type == 0 ){
         for (var i in MOVIE_LIST) {
           socket.emit(stringToDisplay, { promptString:GAME_OVER_STRING + self.timeDisplayLeft } );
         }
       }
       else if ( self.type == 1 ) {
         for (var i in GAME_LIST) {
             socket.emit(stringToDisplay, { promptString:GAME_OVER_STRING + self.timeDisplayLeft  });
         }
       }
       else if ( self.type == 2 ) {
         for (var i in GAME_LIST) {
             socket.emit(stringToDisplay, { promptString:GAME_OVER_STRING + self.timeDisplayLeft});
         }
       }
     }
  }

  self.passTime = function(timePassed){
    self.timeLeft -= timePassed;
    if ( self.timeLeft <= 0 ) {
      self.timeLeft = 1000;
      self.handleSecond();
    }
  }

  self.handleSecond = function(){
    if (self.timeDisplayLeft>0){
      self.timeDisplayLeft--;
      if (self.timeDisplayLeft == 8) {
        self.updatePrompt(1);
      }
      if (self.timeDisplayLeft == 0) {
        if ( timePhase == 0 ) {
          self.timePhase +=1;
          self.round++;
          self.updatePrompt(0);
          self.timeDisplayLeft = GUESSING_TIME;
        }
        else if ( self.timePhase == 1 ) {
          self.timePhase +=1;
          self.timeDisplayLeft = RESULTS_TIME;
        }
        else if ( self.timePhase == 2) {
          //handle next round
          if ( self.round != 10 ) {
            self.timePhase == 1;
            self.timeDisplayLeft = GUESSING_TIME;
          }
          //handle end game
          else {

          }
        }
      }
    }

  }
  //display top 3 players
  self.displayLeaderBoard = function(){
    if ( self.type == 0 ){
      for (var i in MOVIE_LIST) {
        if  (self.firstPlace != undefined) {
          socket.emit(firstPlaceDisplay, { name: self.firstPlace.name, points: self.firstPlace.points });
        }
        if  (self.secondPlace != undefined) {
          socket.emit(secondPlaceDisplay, { name: self.secondPlace.name, points: self.secondPlace.points });
        }
        if  (self.thirdPlace != undefined) {
          socket.emit(thirdPlaceDisplay, { name: self.thirdPlace.name, points: self.thirdPlace.points });
        }
      }
    }
    else if ( self.type == 1 ) {
      for (var i in GAME_LIST) {
        if  (self.firstPlace != undefined) {
          socket.emit(firstPlaceDisplay, { name: self.firstPlace.name, points: self.firstPlace.points });
        }
        if  (self.secondPlace != undefined) {
          socket.emit(secondPlaceDisplay, { name: self.secondPlace.name, points: self.secondPlace.points });
        }
        if  (self.thirdPlace != undefined) {
          socket.emit(thirdPlaceDisplay, { name: self.thirdPlace.name, points: self.thirdPlace.points });
        }
      }
    }
    else if ( self.type == 2 ) {
      for (var i in GAME_LIST) {
        if  (self.firstPlace != undefined) {
          socket.emit(firstPlaceDisplay, { name: self.firstPlace.name, points: self.firstPlace.points });
        }
        if  (self.secondPlace != undefined) {
          socket.emit(secondPlaceDisplay, { name: self.secondPlace.name, points: self.secondPlace.points });
        }
        if  (self.thirdPlace != undefined) {
          socket.emit(thirdPlaceDisplay, { name: self.thirdPlace.name, points: self.thirdPlace.points });
        }
      }
    }
  }

  self.updateLeaderBoard = function() {

  }
  self.updateRound = function() {
    //call update answer depending on game type
  }
  self.updateAnswer = function(quote,word) {

  }
  self.endGame = function(socket) {

  }
  self.handleSubmission = function(player, answer) {

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
    self.rank = 0;
    self.addPoints = function(points){
      self.updatePoints(points);
    }
    self.displayStats = function(){
      socket.emit(playerInfo, { name: self.name, points: self.points, rank: self.rank });
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
