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

var Player = function(id){
    var self = Entity();
    self.id = id;
    self.name = "";
    self.points = 0;
    self.addPoints = function(points){
      self.updatePoints(points);
    }
    Player.list[id] = self;
    return self;
}

Player.list = {};

Player.onConnect = function(socket){
    var player = Player(socket.id);
    socket.on('keyPress',function(data){
      /*
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
      */
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
                Player.onConnect(socket);
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
                Player.onConnect(socket);
                socket.emit('signInResponse',{success:true});
            }
        });
    });

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('sendMsgToServer',function(data){
        var playerName = ("" + socket.id).slice(2,7);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
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
    var pack = {
        player:Player.update(),
        bullet:Bullet.update(),
    }

    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions',pack);
    }
},1000/25);
