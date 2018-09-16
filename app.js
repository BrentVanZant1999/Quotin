/*
 * These lines set up express and create a server to run the application on
 * They also handle user calls to files.
 */
var express = require("express");
var app =  express();
var serv = require('http').Server(app);
const PORT = process.env.PORT || 2000;
app.use(express.static(__dirname + '/client'));
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
 serv.listen(PORT);

 //used to show successful start
console.log("Server Started");

//lists to keep track of sockets
var SOCKET_LIST = {};
var GENERAL_LIST = {};
var GAME_LIST = {};

//quote list
];
var QUOTE_LIST = [
    "I'm going to make him an offer he can't refuse.",
    "You're gonna need a bigger boat.",
    "Carpe diem. Seize the day, boys. Make your lives extraordinary.",
    "Here's Johnny!",
    "Let's put a smile on that face!"
];

var ANSWER_LIST = [
    "The Godfather",
    "Jaws",
    "Dead Poets Society",
    "The Shining",
    "The Dark Knight"
];


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
      //string handling
      currentString:"test quote",
      promptString:"",
      acceptedAnswer:"Alexander Hamilton",
      //round counter
      //timing handling
      round:0,
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

  self.getNewQuote = function(){
    var randomQuoteNum = Math.floor( Math.random() * QUOTE_LIST.length );
    self.currentString  = QUOTE_LIST[randomQuoteNum];
    self.acceptedAnswer  = ANSWER_LIST[randomQuoteNum].toLowerCase();
    console.log("Accepted Answer :" + self.acceptedAnswer);
  }

  //through displayString
  self.displayString = function(){
    //handle displaying preround
    if (self.isWaitingForGame == true) {
        var toDisplay = GAME_STARTING_STRING + self.externalTime + " seconds.";
        for (var i in GAME_LIST) {
          GAME_LIST[i].emit('stringToDisplay', { display : toDisplay } );
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
        //display the correct answer
        var answerToShow = self.acceptedAnswer;
        for (var i in GAME_LIST ) {
          GAME_LIST[i].emit('correctAnswerDisplay', { display : answerToShow } );
        }
        if ( self.round<15 ) {
          toDisplay = ROUND_OVER_STRING + self.internalTime + " seconds.";
        }
        else {
          toDisplay = GAME_OVER_STRING + self.internalTime + " seconds.";
        }
      }
      //handle displaying string to all sockets
      for (var i in GAME_LIST ) {
        GAME_LIST[i].emit('stringToDisplay', { display : toDisplay } );
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
        self.getNewQuote();
      }
    }
    else {
      self.internalTime--;
      if ( self.internalTime <= 0) {
        self.round++;
        if ( self.round < 16 ) {
          self.internalTime = 30;
          self.getNewQuote();
          self.updateLeaderBoard();
          self.displayLeaderBoard();
        }
        else {
          self.newGame();
          self.updateLeaderBoard();
          self.displayLeaderBoard();
          self.isWaitingForGame = true;
          self.externalTime = 10;
          self.round = 1;
        }
      }
    }
  }
  //show the right answer
  self.showRightAnswer = function() {
    for (var i in GAME_LIST) {
      GAME_LIST[i].emit('rightAnswer', { displayString: self.acceptedAnswer });
    }
  }

  //show the right answer
  self.showTimeLeft= function() {
    for (var i in GAME_LIST) {
      if (self.internalTime > 10) {
        GAME_LIST[i].emit('timeLeft', { displayString: self.internalTime-10, displayBool: true });
      }
      else {
        GAME_LIST[i].emit('timeLeft', { displayString: self.internalTime, displayBool: false });
      }

    }
  }

  //display top player
  self.displayLeaderBoard = function(){
    self.updateLeaderBoard();
    for (var i in GAME_LIST) {
      GAME_LIST[i].emit('clearPlayerList', { boolDisplay:false });
      var displaySocketName = Player.list[i.id].name;
      var displaySocketPoints = Player.list[i.id].points;
      for (var i in GAME_LIST) {
        GAME_LIST[i].emit('displayPlayer', { name:displaySocketName, points: displaySocketPoints });
      }
    }
  }

  //handle an answer submission
  self.handleAnswer = function(answer) {
    if (self.internalTime > 10) {
      //handle correct answer
      if (answer == self.acceptedAnswer) {
        return self.internalTime-10;
      }
      else {
        return 0;
      }
    }
    else {
      return -1;
    }
  }

  //updates all the player scores
  self.newGame = function() {
    for (var i in GAME_LIST) {
      Player.list[i].points = 0;
    }
  }

  //create a new round
  self.newRound = function() {
    self.displayLeaderBoard();
  }
  return self;
}

var game = Game();

//define the entity object
var Entity = function(){
    var self = {
        room:-1,
        points:0,
        id:"",
        name:"",
    }
    //handle updating this entities points
    self.updatePoints = function(inputPoints){
        self.points += self.inputPoints;
    }
    return self;
}

//define the player object
var Player = function(id, playerName){
    var self = Entity();
    self.id = id;
    self.name = playerName;
    self.points = 0;
    self.rank = 0;
    self.addPoints = function( points ){
      //adds points to player object.
      self.updatePoints( points );
    }
    //gets player stats and emits them to player
    self.getStats = function( socket ){
      var displayString = self.rank + "- " + self.name +"- " + self.points;
      socket.emit('playerInfo', { displayValue : displayString } );
    }
    //handle a players submission
    self.handleSubmission = function( answer, socket ){
      var answerFiltered = answer.toLowerCase();
      var displayString = "";
      var displayBoolVal = true;
      if ( game.handleAnswer(answerFiltered) > 0 ) {
        displayString = "Right Answer!";
        displayBoolVal = true;
        self.points += 3;
       }
      else if ( gameGame.handleAnswer(answerFiltered) == 0 ) {
        displayString = "Wrong Answer!";
        displayBoolVal = true;
      }
      else {
        displayBoolVal = false;
      }
      socket.emit('feedBack', { displayValue : displayString, displayBool : displayBoolVal } );
    }
    Player.list[id] = self;
    return self;
}

Player.list = {};
//handle player connection
Player.onConnect = function(socket, playerName){
    var player = Player(socket.id, playerName);
    //call to handle room movement
    socket.on('roomButton',function(data){
      gotoRoom(socket,data.roomNumber);
    });
    //call to get  the players stats
    socket.on('getStats',function(data){
      player.getStats(socket);
    });
    //call to submit a player answe
    socket.on('answerSubmit',function(data){
      var answer = data.answer;
      player.handleSubmission( answer, socket );
    });
}
//handle player disconnection
Player.onDisconnect = function(socket){
    game.removePlayer();
    delete Player.list[socket.id];
}

var DEBUG = true;

var USERS = {
    //username:password structures
    "Brent":"password",
}
v
ar gotoRoom= function(socket,roomNumber){
  delete GAME_LIST[socket.id];
  GAME_LIST[socket.id] = socket;
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
  //sign in socket
  socket.on('signIn',function(data){
    isValidPassword(data,function(res){
      if(res){
        Player.onConnect(socket, data.username);
        socket.emit('signInResponse',{success:true});
      }
      else {
        socket.emit('signInResponse',{success:false});
      }
    });
  });

  //sign up
  socket.on('signUp',function(data){
    isUsernameTaken(data,function(res){
      if(res) {
        socket.emit('signUpResponse',{success:false});
      }
      else {
        addUser(data,function(){
          socket.emit('signUpResponse',{success:true});
        });
        Player.onConnect(socket, data.username);
      }
    });
  });
    //continue
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
      for(var i in GAME_LIST){
        GAME_LIST[i].emit('addToChat',playerName + ': ' + data);
      }
    });
});

//set a .1 second interval to pass time in each game object
setInterval(function(){
  gameGame.passTime(100);
  bookGame.passTime(100);
  movieGame.passTime(100);
},100);
