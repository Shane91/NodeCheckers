var DEBUG = true;
var INTERVAL = 1000;
var GAME_DIMENSION = 8;

function Game(gameId, socket){
  this.squares = [];
  this.checkers = [];
  this.$board = $('#board');
  this.isTurn = false;

  this.socket = socket;
}

Game.prototype = {
  resetBoard: function(){
    $('#prompt').hide();
    $('#results-overlay').hide();
    this.$board.html('').removeClass('flipped');
    this.setTurn();
    $('#game').show();
  },
  initBoard: function(squares,usernames,flipped){
    this.squares = squares;
    self = this;

    if(flipped){self.$board.addClass('flipped');}
    self.$board.html('');
    squareCount = 0;
    evenRow = true;
    $.each(squares, function(index, square){
      var squareElement = $('<div class="square"></div>');
      if(square.playable){squareElement.addClass('black');}
      if(square.checker){
        var checkerElement = $('<div class="checker"><div class="checker-piece"></div></div>');
        checkerElement.addClass(square.checker.colour);
        if(square.checker.userId == userId){checkerElement.addClass('owner')};
        checkerElement.appendTo(squareElement);
        square.checker.element = checkerElement;
        self.checkers.push(square.checker);
      }
      squareElement.appendTo(self.$board);
      square.element = squareElement;

      squareCount++;
      if(squareCount == GAME_DIMENSION){
        evenRow = false;
        squareCount = 0;
        self.$board.append('<div class="clearfix"></div>');
      }
    });
    self.$board.append('<div class="clearfix"></div>');

    $('.username[data-team="1"]').text(usernames[0]+'\'s');
    $('.username[data-team="2"]').text(usernames[1]+'\'s');
    self.sizeSquares();
  },
  sizeSquares: function(){
    self = this;
    maxSquareHeight = (self.$board.parent('#board-container').height()-self.$board.offset().top)/GAME_DIMENSION; //the max dimension that will work within the board height
    maxSquareWidth = self.$board.parent('#board-container').width()/GAME_DIMENSION; //the max dimension that will work within the board width

    squareDimension = maxSquareHeight <= maxSquareWidth ? maxSquareHeight : maxSquareWidth;

    $.each(self.squares, function(index, square){
      square.element.height(squareDimension).width(squareDimension);
    });
  },
  showPotentialMoves: function(potentialSquareIds){
    var potentialSquares = [];

    potentialSquares = $.grep(game.squares, function(square){
      return ($.inArray(square.id,potentialSquareIds) > -1);
    });

    //console.log(potentialSquareIds);


    $.each(potentialSquares, function(index,value){
      value.element.addClass('possible-move animated pulse infinite');
    })
  },
  reloadSquares: function(checkerId,originSquare,targetSquare){
    checkerObj = $.findFirst(game.checkers,function(elm){
      return elm.id == checkerId;
    });

    originSquareObj = game.squares[(originSquare.x*GAME_DIMENSION)+originSquare.y];
    targetSquareObj = game.squares[(targetSquare.x*GAME_DIMENSION)+targetSquare.y];

    checkerObj.element.removeClass('moving');

    leftOffset = targetSquareObj.element.offset().left-originSquareObj.element.offset().left;
    topOffset = targetSquareObj.element.offset().top-originSquareObj.element.offset().top;

    if(this.$board.hasClass('flipped')){
      leftOffset *= -1;
      topOffset *= -1;
    }

    checkerObj.element.css('transform','translate('+leftOffset+'px, '+topOffset+'px)')
    checkerObj.element.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
      checkerObj.element.css('transform','');
      targetSquareObj.element.append(checkerObj.element);
    });

    moving = null;

    originSquareObj.checker = null;
    targetSquareObj.checker = checkerObj;
  },
  updateScores: function(scores){
    $('.score-count[data-team="1"]').text(scores[0]);
    $('.score-count[data-team="2"]').text(scores[1]);
  },
  updateChecker: function(checker){
    checkerObj = $.findFirst(game.checkers, function(elm){
      return elm.id === checker.id;
    });

    checkerObj.active = checker.active;
    checkerObj.king = checker.king;
    if(checkerObj.king){checkerObj.element.addClass('king');}
    //console.log(checkerObj);

    if(!checkerObj.active){
      checkerObj.element.remove();
    }
  },
  setTurn: function(user=null){
    console.log(user);
    if(user){

    }else{

    }
    this.isTurn = user && user.id == userId ? true : false;
    turnLabel = user ? user.username+'\'s Turn' : 'Waiting for Opponent';
    $('#display-turn').text(turnLabel);
    if(this.isTurn){
      $('#display-turn').addClass('animated');
    }else{
      $('#display-turn').removeClass('animated');
    }
  }
}

$.extend({
  findFirst: function(elems, validateCb){
    var i;
    for (i=0; i<elems.length;++i) {
      if(validateCb(elems[i],i))
        return elems[i];
    }
    return undefined;
  }
});

var moving;

$('body').on('click','.checker.owner', function(e){
  targetElement = $(this);
  target = $.findFirst(game.checkers, function(elm){
    return elm.element.is(targetElement);
  });

  originSquare = $.findFirst(game.squares, function(square){
    return square.checker === target;
  });

  if(!game.isTurn){
    alert('Not your turn ya dummy!');
  }else{

    var newMoving;

    if(moving != null){
      moving.element.removeClass('moving');
      $('.square.possible-move').removeClass('possible-move animated');

      if(target == moving){
        moving = null;
      }else{
        newMoving = target;
      }
    }else{
      newMoving = target;
    }
      
    if(newMoving){
      moving = newMoving;

      moving.element.addClass('moving');

      checkForMoves(originSquare.id,false);
  
    }
  }
});

$('body').on('click','.square.possible-move',function(e){
  targetSquare = $(this);
  target = $.findFirst(game.squares, function(elm){
    return elm.element.is(targetSquare);
  })

  submitMove(moving,target);
  $('.square.possible-move').removeClass('possible-move animated');
  moving = null;
});

$(window).resize(function(){
  if(game){game.sizeSquares();}
});