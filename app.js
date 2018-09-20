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

//quote list to keep tracks of quotes in this database of sorts
var QUOTE_LIST = [
    "I'm going to make him an offer he can't refuse.",
    "You're gonna need a bigger boat.",
    "Carpe diem. Seize the day, boys. Make your lives extraordinary.",
    "Here's Johnny!",
    "Let's put a smile on that face!",
    "Here's looking at you, kid.",
    "Toto, I've got a feeling we're not in Kansas anymore.",
    "A census taker once tried to test me. I ate his liver with some fava beans and a nice Chianti.",
    "Show me the money!",
    "Mama always said life was like a box of chocolates. You never know what you're gonna get.",
    "Greed, for lack of a better word, is good.",
    "As God is my witness, I'll never be hungry again.",
    "Keep your friends close, but your enemies closer.",
    "Get your stinking paws off me, you damned dirty ape.",
    "Open the pod bay doors, HAL.",
    "My precious.",
    "A martini. Shaken, not stirred.",
    "Nobody puts Baby in a corner.",
    "I'm king of the world!",
    "Cinderella story. Outta nowhere. A former greenskeeper, now, about to become the Masters champion. It looks like a mirac...It's in the hole! It's in the hole! It's in the hole!",
    "They may take our lives, but they'll never take our freedom!",
    "If you let my daughter go now, that'll be the end of it. I will not look for you, I will not pursue you. But if you don't, I will look for you, I will find you, and I will kill you.",
    "It was Beauty that killed the Beast.",
    "I'm just one stomach flu away from my goal weight."
];
//answer list to keep tracks of quotes- MUST MATCH QUOTES
var ANSWER_LIST = [
    "The Godfather",
    "Jaws",
    "Dead Poets Society",
    "The Shining",
    "The Dark Knight",
    "Casablanca",
    "The Wizard of Oz",
    "The Silence of the Lambs",
    "Jerry Maguire",
    "Forrest Gump",
    "Wall Street",
    "Gone With the Wind",
    "The Godfather II",
    "Planet of the Apes",
    "2001: A Space Odyssey",
    "The Lord of the Rings: Two Towers",
    "Goldfinger",
    "Dirty Dancing",
    "Titanic",
    "Caddyshack",
    "Braveheart",
    "Taken",
    "King Kong",
    "The Devil Wears Prada"
];

//some constants
var GUESSING_TIME = 15;
var DISPLAY_TIME = 5;
var RESULTS_TIME = 5;
var GAME_ENDING_STRING = "---Game Ending---";
var GAME_STARTING_STRING = "Game Starting in ";
var GAME_OVER_STRING = "Game is over, new game starting in ";
var ROUND_OVER_STRING = "Round finished, new round starting in ";

//define game object
var Game = function(typeNum){
  //define instance variables
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
    for (var i in GAME_LIST) {
      GAME_LIST[i].emit('playerCountUpdate', { count : self.playerCount } );
    }
  }

  //remove a player from count
  self.removePlayer = function(){
    self.playerCount--;
    for (var i in GAME_LIST) {
      GAME_LIST[i].emit('playerCountUpdate', { count : self.playerCount } );
    }
  }

  //get a new quote
  self.getNewQuote = function(){
    var randomQuoteNum = Math.floor( Math.random() * QUOTE_LIST.length );
    self.currentString  = QUOTE_LIST[randomQuoteNum];
    self.acceptedAnswer  = ANSWER_LIST[randomQuoteNum];
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
        var answerToShow = "Answer: " + self.acceptedAnswer;
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

  //pass a specific value of time
  self.passTime = function(timePassed){
    self.msLeft -= timePassed;
    if ( self.msLeft <= 0 ) {
      self.msLeft = 1000;
      self.handleSecond();
    }
    self.displayString();
  }

  //handle the passing of a second
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
      self.showTimeLeft();
      if ( self.internalTime <= 0) {
        self.round++;
        if ( self.round < 16 ) {
          //setup a new round
          self.internalTime = 30;
          self.getNewQuote();
          self.newRound();
          if (self.round > 1) {
            self.displayLeader();
          }
        }
        else {
          //setup time to set new game
          self.newGame();
          self.displayWinner();
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

  //show the time left
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
  self.displayLeader = function(){
    console.log("inLeader");
    var currentHigh = -1;
    var isTied = false;
    var current = undefined;
    for (var i in GAME_LIST) {
      if (Player.list[i] != undefined ) {
        var displaySocketName = Player.list[i].name;
        if (Player.list[i].points > currentHigh) {
          current = i;
          currentHigh = Player.list[i].points;
          isTied = false;
        }
        if (Player.list[i].points === currentHigh) {
          current = i;
          isTied = true;
        }
     }
    }
    for (var i in GAME_LIST) {
      if (current != undefined && Player.list[current] != undefined) {
        GAME_LIST[i].emit('displayLeader', { name:Player.list[current].name, points:Player.list[current].points, tied: isTied });
      }
    }
  }

  //display winning player of the game
  self.displayWinner = function(){
    var currentHigh = -1;
    var current = undefined;
    for (var i in GAME_LIST) {
      if (Player.list[i] != undefined ) {
        var displaySocketName = Player.list[i].name;
        if (Player.list[i].points >= currentHigh) {
          current = i;
          currentHigh = Player.list[i].points;
        }
      }
    }
    for (var i in GAME_LIST) {
      if (current != undefined && Player.list[current] != undefined) {
        GAME_LIST[i].emit('displayWinner', { name:Player.list[current].name, points:Player.list[current].points });
      }
    }
  }

  //handle an answer submission
  self.handleAnswer = function(answer) {
    if (self.internalTime > 10) {
      //handle correct answer
      if (answer == self.acceptedAnswer.toLowerCase()) {
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
      if (Player.list[i] != undefined) {
        Player.list[i].points = 0;
      }
    }
  }

  //create a new round
  self.newRound = function() {
    for (var i in GAME_LIST) {
      GAME_LIST[i].emit('feedBack', { displayValue : "Make a guess!", displayBool : true } );
      if (Player.list[i] != undefined) {
        Player.list[i].hasAnswered = false;
      }
    }
  }
  return self;
}

//create a new game instance
var game = Game();

//define the entity object
var Entity = function(){
    var self = {
        room:-1,
        points:0,
        id:"",
        name:"",
    }
    return self;
}

//define the player object
var Player = function(id, playerName){
    var self = Entity();
    self.id = id;
    self.name=playerName;
    self.points = 0;
    self.rank = 0;
    self.hasAnswered = false;

    //handle displaying player data to user
    self.displaySelf = function(){
      GAME_LIST[self.id].emit('displayPlayer', { points: self.points, name: self.name } );
    }

    //handle a players answer submission
    self.handleSubmission = function( answer, socket ){
      var answerFiltered = answer.toLowerCase();
      var displayString = "";
      var displayBoolVal = true;
      var answerVal =  game.handleAnswer(answerFiltered);
      if ( answerVal > 0 ) {
        if (self.hasAnswered == false ) {
          displayString = "Correct Answer!";
          displayBoolVal = true;
          self.points += answerVal;
          self.hasAnswered = true;
        }
       }
      else if (answerVal == 0 ) {
        var prompt = Math.floor(Math.random() * 4);
        if (prompt == 0) {
          displayString = "That's a wrong answer!";
        }
        else if (prompt == 1) {
          displayString = "Oops wrong movie";
        }
        else if (prompt == 2) {
          displayString = "Wrong, guess again?";
        }
        else if (prompt == 3) {
          displayString = "Incorrect!";
        }

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

//create a list of players
Player.list = {};

//handle player connection
Player.onConnect = function(socket, playerName){
    var player = Player(socket.id, playerName);
    //call to handle room movement
    game.addPlayer();
    gotoRoom(socket);
    //handle showing player in chat
    for(var i in GAME_LIST){
      GAME_LIST[i].emit('addToChat',player.name + ' has joined the game.');
    }
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

//user holding structure
var USERS = {
    "Admin":"AdminPass4132",
}

//handle entering the player into the game
var gotoRoom= function(socket){
  GAME_LIST[socket.id] = socket;
}

//check if an entered password is valid
var isValidPassword = function(data,cb){
  setTimeout(function(){
  cb(USERS[data.username] === data.password);
  },10);
}

//check if a username is already used for
var isUsernameTaken = function(data,cb){
    setTimeout(function(){
      cb(USERS[data.username]);
    },10);
}

//add a userbase to the list
var addUser = function(data,cb){
  setTimeout(function(){
    USERS[data.username] = data.password;
    cb();
  },10);
}

var io = require('socket.io')(serv,{});
//create the socekt connection
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
      gotoRoom(socket);
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

//set a .1 second interval to pass time in the game object
setInterval(function(){
  game.passTime(100);
},100);
