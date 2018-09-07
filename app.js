var express = require("express");
var app =  express();
var serv = require('http').Server(app);
const PORT = 2000; //process.env.PORT || 8000;
app.use(express.static(__dirname + '/client'));
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
 serv.listen(2000);
console.log("Server Started");
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
      //variable counts
      playerCount:0,
      type:typeNum,
      //string handling
      currentString:"test quote",
      promptString:"",
      acceptedAnswer:"Alexander Hamilton",

      //first place handling
      firstPlaceSocket:undefined,
      firstPlaceScore:0,

      //round counter
      round:0,

      //timing handling
      msLeft: 1000,
      isWaitingForGame: true,
      internalTime:30,
      externalTime:10,
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
    if (self.isWaitingForGame == true) {
        var toDisplay = GAME_STARTING_STRING + self.externalTime + " seconds.";
        if (self.type == 0){
          for (var i in MOVIE_LIST) {
            MOVIE_LIST[i].emit('stringToDisplay', { display : toDisplay } );
          }
        }
        if (self.type == 1){
          for (var i in GAME_LIST) {
            GAME_LIST[i].emit('stringToDisplay', { display : toDisplay } );
          }
        }
        if (self.type == 2){
          for (var i in BOOK_LIST) {
            BOOK_LIST[i].emit('stringToDisplay', { display : toDisplay } );
          }
        }
    }
    else {
      //handle displaying half quote
      var toDisplay = "";
      if ( self.internalTime > 20 ) {
        toDisplay =  "\""+ self.currentString.substr(0, Math.floor(self.currentString.length/2)) + "...\"";
      }
      //handle displaying full quote
      else if ( self.internalTime > 10 ) {
        toDisplay = "\""+self.currentString+"\"";
      }
      //handle displaying results
      else {
        if ( self.round<15 ) {
          toDisplay = ROUND_OVER_STRING + self.internalTime + " seconds.";
        }
        else {
          toDisplay = GAME_OVER_STRING + self.internalTime + " seconds.";
        }
      }

      //handle displaying strin
      if (self.type == 0){
        for (var i in MOVIE_LIST ) {
          MOVIE_LIST[i].emit('stringToDisplay', { display : toDisplay } );
        }
      }
      if (self.type == 1){
        for (var i in GAME_LIST ) {
          GAME_LIST[i].emit('stringToDisplay', { display : toDisplay } );
        }
      }
      if (self.type == 2){
        for (var i in BOOK_LIST ) {
          BOOK_LIST[i].emit('stringToDisplay', { display : toDisplay } );
        }
      }
    }
  }

  self.passTime = function(timePassed){
    self.msLeft -= timePassed;
    if ( self.msLeft <= 0 ) {
      self.msLeft = 1000;
      self.handleSecond();
    }
    self.displayLeaderBoard();
    self.displayString();
  }

  self.handleSecond = function(){
    if ( self.isWaitingForGame ) {
      self.externalTime--;
      if ( self.externalTime <= 0 ){
        self.isWaitingForGame = false;
      }
    }
    else {
      self.internalTime--;
      if ( self.internalTime <= 0) {
        self.round++;
        if ( self.round < 16 ) {
          self.internalTime = 30;
        }
        else {
          self.isWaitingForGame = true;
          self.externalTime = 10;
          self.round = 1;
        }
      }
    }
  }
  //display top 3 players
  self.displayLeaderBoard = function(){
    self.updateLeaderBoard();
    if  (self.firstPlaceSocket != undefined) {
      var playerName = Player.list[self.firstPlaceSocket].name;
      var playerPoints = Player.list[self.firstPlaceSocket].points;
      if ( self.type == 0 ){
        for (var i in MOVIE_LIST) {
          MOVIE_LIST[i].emit('firstPlaceDisplay', { name: playerName, points: playerPoints });
        }
      }
      else if ( self.type == 1 ) {
        for (var i in GAME_LIST) {
          GAME_LIST[i].emit('firstPlaceDisplay', { name: playerName, points: playerPoints });
        }
      }
      else if ( self.type == 2) {
        for (var i in BOOK_LIST) {
        BOOK_LIST[i].emit('firstPlaceDisplay', { name: playerName, points: playerPoints });
        }
      }
    }
  }

  self.updateLeaderBoard = function() {
    var highSocket = undefined;
    var highScore = 0;
    if ( self.type == 0 ){
      for (var i in MOVIE_LIST) {
        var playerNext = Player.list[i];
        var scoreNext = playerNext.points;
        if  (scoreNext > highScore) {
          highScore = scoreNext;
          highSocket = i;
        }
      }
    }
    else if ( self.type == 1 ) {
      for (var i in GAME_LIST) {
        var playerNext = Player.list[i];
        var scoreNext = playerNext.points;
        if  (scoreNext > highScore) {
          highScore = scoreNext;
          highSocket = i;
        }
      }
    }
    else if ( self.type == 2 ) {
      for (var i in GAME_LIST) {
        var playerNext = Player.list[i];
        var scoreNext = playerNext.points;
        if  (scoreNext > highScore) {
          highScore = scoreNext;
          highSocket = i;
        }
      }
    }
    self.firstPlaceScore = highScore;
    self.firstPlaceSocket = highSocket;
  }

  self.newRound = function() {
    //call update essentials depending on game type
    self.updateEssentials(self.type);
    self.updateLeaderBoard();
    self.displayLeaderBoard();
  }
  self.updateEssentials = function(type) {
    if (type == 0){
      var randomNum =0; //generate a random number from array length
      self.acceptedAnswer = 0; //create an answer array for each type
      self.currentString = 0; //and a quote array
    }
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
    socket.emit('changeRoom',{roomName:"General"});
  }
  else if (roomNumber == 1 ) {
    MOVIE_LIST[socket.id] = socket;
    Player.list[socket.id].room = 1;
    socket.emit('changeRoom',{roomName:"Movies"});
  }
  else if (roomNumber == 2 ) {
    GAME_LIST[socket.id] = socket;
    Player.list[socket.id].room = 2;
    socket.emit('changeRoom',{roomName:"Games"});
  }
  else if (roomNumber == 3 ) {
    BOOK_LIST[socket.id] = socket;
    Player.list[socket.id].room = 3;
    socket.emit('changeRoom',{roomName:"Books"});
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
  console.log("connection");

    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    socket.on('signIn',function(data){
        isValidPassword(data,function(res){
            if(res){
                Player.onConnect(socket, data.username);
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
            }
        });
    });
    socket.on('continue',function(data){
      socket.emit('signInResponse',{success:true});
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
  gameGame.passTime(100);
  bookGame.passTime(100);
  movieGame.passTime(100);
},100);
