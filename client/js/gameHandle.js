var socket = io();
var isPlaying = false;
//main game divs
var signDiv = document.getElementById('signDiv');
var gameDiv = document.getElementById('gameDiv');

var signDivUsername = document.getElementById('signDiv-username');
var signDivSignIn = document.getElementById('signDiv-signIn');
var signDivSignUp = document.getElementById('signDiv-signUp');
var signDivPassword = document.getElementById('signDiv-password');
var signDivInputs = document.getElementById('introButtonWrapper');
var signDivContinue = document.getElementById('continueButtonWrapper');
var alertArea = document.getElementById('alertArea');
var playerData = document.getElementById('playerData');
var timerData = document.getElementById('timerData');
//handle continue button being clicked - take user to next room
signDivContinue.onclick =  function(){
  socket.emit('continue',{username:signDivUsername.value,password:signDivPassword.value});
  return false;
}

//handle signing in button
signDivSignIn.onclick = function(){
  if ( (signDivUsername.value.length > 0) && (signDivPassword.value.length > 0) ) {
    socket.emit('signIn',{username:signDivUsername.value,password:signDivPassword.value});
  }
  else {
    alertArea.classList.remove('hiddenArea');
    alertArea.classList.add('visibleArea');
    alertArea.classList.add('neutralColor');
    alertArea.innerHTML = "Fields Missing";
  }
  return false;
}
//handling sign up button
signDivSignUp.onclick = function(){
  if ( (signDivUsername.value.length > 0) && (signDivPassword.value.length > 0) ) {
    socket.emit('signUp',{username:signDivUsername.value,password:signDivPassword.value});
  }
  else {
    alertArea.classList.remove('hiddenArea');
    alertArea.classList.add('visibleArea');
    alertArea.classList.add('neutralColor');
    alertArea.innerHTML = "Fields Missing";
  }
  return false;
}
//handle clearing list of players
socket.on('clearPlayerList',function(data){
  //clear the list of players
    playerData.innerHTML = "";
});

//handle displaying players
socket.on('displayPlayer',function(data){
  var playerInfo = data.name + "- " + data.points + " points";
  playerData.innerHTML += '<div>' + playerInfo + '</div>';
});

//handle recieving a response from sign in call
socket.on('signInResponse',function(data){
  if(data.success){
    signDiv.classList.remove('visibleArea');
    signDiv.classList.add('hiddenArea');
    gameDiv.classList.remove('hiddenArea');
    gameDiv.classList.add('visibleArea');
    isPlaying = true;
  } else
    alertArea.classList.remove('hiddenArea');
    alertArea.classList.add('visibleArea');
    alertArea.classList.add('neutralColor');
    alertArea.innerHTML = "Login Incorrect";
});


//handle sign up respose
socket.on('signUpResponse',function(data){
  if(data.success){
    alertArea.classList.remove('hiddenArea');
    alertArea.classList.add('visibleArea');
    alertArea.classList.remove('neutralColor');
    alertArea.classList.add('positiveColor');
    alertArea.innerHTML = "Sign Up Complete";
    signDivInputs.classList.remove('visibleArea');
    signDivInputs.classList.add('hiddenArea');
    signDivContinue.classList.remove('hiddenArea');
    signDivContinue.classList.add('visibleArea');
  }
  else {
    alertArea.classList.remove('hiddenArea');
    alertArea.classList.add('visibleArea');
    alertArea.innerHTML = "Username already taken";
  }
});

// define game attributes
var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');
var roomDisplay = document.getElementById('roomDisplay');
var playerData = document.getElementById('playerData');
var quoteArea = document.getElementById('quoteArea');
var feedback = document.getElementById('feedbackArea');
var firstPlaceScore = document.getElementById('topData');
var inputAnswer = document.getElementById('submit-input-answer');
var inputButton = document.getElementById('submit-input-button');
var inputTimer = document.getElementById('submit-timer');

//handle answer submission
inputButton.onclick = function() {
  var inputVal = inputAnswer.value;
  socket.emit('answerSubmit', { answer : inputVal });
  inputAnswer.value = "";
  return false;
}

//handle chat submission
socket.on('addToChat',function(data) {
  chatText.innerHTML += '<div>' + data + '</div>';
});

//handle answer feedback
socket.on('correctAnswerDisplay',function(data) {
  feedback.innerHTML = data.display;
});

//handle displaying quote
socket.on('stringToDisplay',function(data) {
  feedback.classList.remove('hiddenArea');
  feedback.classList.add('visibleArea');
  feedback.classList.remove('negativeColor');
  feedback.classList.remove('positiveColor');
  feedback.classList.add('negativeColor');
  quoteArea.innerHTML = data.display;
});

//handle displaying time left
socket.on('timeLeft',function(data) {
  if (data.displayBool === true) {
    inputTimer.innerHTML = " ("+data.displayString+ "s)";
  }
  else {
      inputTimer.innerHTML = "";
  }
});

//handle other feedback
socket.on('feedBack',function(data) {
  var boolDisplay = data.displayBool;
  if ( boolDisplay == true ) {
    feedback.classList.remove('hiddenArea');
    feedback.classList.add('visibleArea');
    feedback.classList.remove('negativeColor');
    feedback.classList.remove('positiveColor');
    feedback.classList.add('positiveColor');
  }
  else {
    feedback.classList.remove('visibleArea');
    feedback.classList.add('hiddenArea');
  }
  feedback.innerHTML = data.displayValue;
});

//handle other feedback
socket.on('rightAnswer',function(data) {
  feedback.classList.remove('hiddenArea');
  feedback.classList.add('visibleArea');
  feedback.classList.remove('negativeColor');
  feedback.classList.remove('positiveColor');
  feedback.classList.add('positiveColor');
  feedback.innerHTML = data.displayString;
});


//
chatForm.onsubmit = function(e) {
  e.preventDefault();
  if(chatInput.value[0] === '/')
    socket.emit('evalServer',chatInput.value.slice(1));
  else
    socket.emit('sendMsgToServer',chatInput.value);
  chatInput.value = '';
  return false;
}
