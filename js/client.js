var socket = io.connect('http://'+NODEADDRESS+':'+NODEPORT);
var game = new Game('#board', socket);
var passcode;
var username;
var userId;

socket.on('*', function(event,data){
  console.log(event);
  console.log(data);
});

socket.on('fullGame', function(){
  $('#notification').addClass('alert alert-danger').text('That game is full');
})

socket.on('gameJoined', function(newUserId){
  userId = newUserId;
  game.resetBoard();
})

socket.on('initBoard', function(squares,usernames,flipped){
  game.initBoard(squares,usernames,flipped);
});

socket.on('initChat', function(messages){
  $('#chat').html('');
  dropdown = $('#chat-dropdown');
  dropdown.html('<option value=""></option>');
  dropdown.prop('disabled',false);
  $.each(messages, function(index, message){
    dropdown.append('<option>'+message+'</option>');
  })
})

socket.on('displayMessage', function(message,originUserId,colour){
  var messageClass = userId == originUserId ? 'owner' : 'opponent';
  var animationClass = userId == originUserId ? 'slideInRight' : 'slideInLeft';
  var messageElement = $('<div class="message '+messageClass+' '+colour+'">'+message+'</div>');
  messageElement.addClass('animated '+animationClass);
  $('#chat').append(messageElement);
  //messageElement.show("slow");
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
  //console.log('reloadSquares');
  game.reloadSquares(checker,originSquare,targetSquare);
});

socket.on('updateScores', function(scores){
  game.updateScores(scores);
})

socket.on('updateChecker', function(checker){
  game.updateChecker(checker);
});

socket.on('proposeTie', function(user){
  swal({
    title: user+' has proposed a Tie Game.',
    text: 'Do you accept?',
    type: 'warning',
    showCancelButton: true,
    confirmButtonClass: 'btn-success',
    confirmButtonText: 'Yes, I accept',
    cancelButtonText: 'No'
  },
  function(isAccepted){
    socket.emit('tieResponse',passcode, userId, isAccepted);
  });
});

socket.on('cannotProposeTie', function(){
  swal({
    title: 'You can not propose another Tie Game yet.',
    type: 'error'
  })
});

socket.on('tieNotAccepted', function(){
  swal({
    title: 'Tie Game has been declined.',
    type: 'error'
  });
});

socket.on('gameOver', function(winningId){
  swal.close();
  if(winningId == userId){
    $('#result').html('<div class="animated infinite tada">Winner!</div>');
  }else if(winningId){
    $('#result').html('<div class="animated infinite swing">Loser :(</div>');
  }else{
    $('#result').html('<div class="animated infinite hinge">Tie Game</div>');
  }
  $('#results-overlay').show();
})

$(function(){
  $('#join').click(function(e){
    username = $('#username').val();
    passcode = $('#passcode').val().toLowerCase();
    joinGame(username, passcode, socket);
  });

  $('#chat-dropdown').change(function(){
    dropdown = $(this);
    if(dropdown.val() != ''){
      socket.emit('sendMessage', passcode, userId, dropdown.val());
      dropdown.val('');
    }
  });

  $('#propose-tie').on('click', function(e){
    swal({
      title: "Propose a Tie Game?",
      type: "warning",
      showCancelButton: true,
      closeOnConfirm: false,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      showLoaderOnConfirm: true
    },function(){
      socket.emit('proposeTie', passcode, userId);
    });
    
  });

  $('#play-again').click(function(e){
    e.preventDefault();
    joinGame(username, passcode, socket);
  })
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