var socket = io.connect('http://'+NODEADDRESS+':'+NODEPORT);
var game = new Game('#board', socket);
var passcode;
var userId;
var checkGameReady;

socket.on('*', function(event,data){
  console.log(event);
  console.log(data);
});

socket.on('fullGame', function(){
  $('#notification').addClass('alert alert-danger').text('That game is full');
})

socket.on('gameJoined', function(newUserId){
  userId = newUserId;
  $('#prompt').hide();
  $('#game').show();
  /*
  checkGameReady = setInterval(function(){
    socket.emit('isGameReady',passcode);
  },15);
  */
})

socket.on('initBoard', function(squares,usernames,flipped){
  //clearInterval(checkGameReady);
  console.log('initBoard');
  game.initBoard(squares,usernames,flipped);
});

socket.on('opponentLeft', function(){
  alert('Opponent has left the game');
  window.location.reload();
})

socket.on('setTurn', function(user){
  game.setTurn(user);
});

socket.on('notYourTurn', function(){
  alert('Not your turn ya dummy!');
})

socket.on('notYourChecker', function(){
  alert('Not your checker ya dummy!');
})

socket.on('potentialSquares', function(potentialSquares){
  game.showPotentialMoves(potentialSquares);
});

socket.on('reloadSquares', function(checker,originSquare,targetSquare){
  console.log('reloadSquares');
  game.reloadSquares(checker,originSquare,targetSquare);
});

socket.on('updateScores', function(scores){
  game.updateScores(scores);
})

socket.on('updateChecker', function(checker){
  game.updateChecker(checker);
});

socket.on('gameOver', function(winningId){
  console.log('game over');
  if(winningId == userId){
    $('#result').html('<div class="animated infinite tada">Winner!</div>');
  }else{
    $('#result').html('<div class="animated infinite swing">Loser :(</div>');
  }
  $('#results-container').show();
})

$(function(){
  $('#join').click(function(e){
    username = $('#username').val();
    passcode = $('#passcode').val();
    joinGame(username, passcode, socket);
  });

});

$(window).on('beforeunload', function(){
  socket.emit('leaveGame', passcode, userId);
})

function joinGame(username, passcode, socket){
  if(username != ''){
    socket.emit('joinGame', {username: username}, passcode);
  }
}

function checkUsers(){
  socket.emit('waitingForUsers', passcode);
}

function checkForMoves(squareId,onlyJumps){
  socket.emit('checkForMoves',squareId,onlyJumps,passcode);
}

function submitMove(checker,square){
  socket.emit('processMove',userId,checker.id,square.id,passcode);
}