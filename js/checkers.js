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
  initBoard: function(squares,usernames,flipped){
    this.squares = squares;
    self = this;

    maxSquareHeight = (self.$board.parent('#board-container').height()-self.$board.offset().top)/GAME_DIMENSION; //the max dimension that will work within the board height
    maxSquareWidth = self.$board.parent('#board-container').width()/GAME_DIMENSION; //the max dimension that will work within the board width

    squareDimension = maxSquareHeight <= maxSquareWidth ? maxSquareHeight : maxSquareWidth;
    
    if(flipped){self.$board.addClass('flipped');}
    self.$board.html('');
    squareCount = 0;
    evenRow = true;
    $.each(squares, function(index, square){
      var squareElement = $('<div class="square" style="height:'+squareDimension+'px;width:'+squareDimension+'px;"></div>');
      if(square.playable){squareElement.addClass('black');}
      if(square.checker){
        var checkerElement = $('<div class="checker"></div>');
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
    
  },
  showPotentialMoves: function(potentialSquareIds){
    var potentialSquares = [];

    potentialSquares = $.grep(game.squares, function(square){
      return ($.inArray(square.id,potentialSquareIds) > -1);
    });

    //console.log(potentialSquareIds);


    $.each(potentialSquares, function(index,value){
      value.element.addClass('possible-move');
    })
  },
  reloadSquares: function(checkerId,originSquare,targetSquare){
    checkerObj = $.findFirst(game.checkers,function(elm){
      return elm.id == checkerId;
    });

    originSquareObj = game.squares[(originSquare.x*GAME_DIMENSION)+originSquare.y];
    targetSquareObj = game.squares[(targetSquare.x*GAME_DIMENSION)+targetSquare.y];

    targetSquareObj.element.append(checkerObj.element);
    checkerObj.element.removeClass('moving');
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
  setTurn: function(user){
    this.isTurn = user.id == userId ? true : false;
    turnLabel = this.isTurn ? 'Your Turn' : 'Opponent\'s Turn';
    $('#display-turn').text(turnLabel);
    if(this.isTurn){
      $('#display-turn').addClass('animated');
    }else{
      $('#display-turn').removeClass('animated');
    }
  },
  winner: function(){

  },
  loser: function(){

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
      $('.square.possible-move').removeClass('possible-move');

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
  $('.square.possible-move').removeClass('possible-move');
  moving = null;
  /*
  rowMovement = Math.abs(moving.square.row-target.row);
  if(rowMovement > 1){
    startingRow = moving.square.row;
    startingCol = moving.square.col;
    endRow = target.row;
    endCol = target.col;
    jumpedChecker = $.findFirst(checkers, function(elm){
      return elm.square.row == (startingRow+endRow)/2 && elm.square.col == (startingCol+endCol)/2;
    });
    jumpedChecker.element.remove();
    jumpedChecker.active = false;
    jumpedChecker.square.checker = null;

    var teamScore = $('.score-count[data-team="'+moving.team+'"]');
    var teamScoreVal = parseInt(teamScore.text());
    teamScore.text(++teamScoreVal);
  }

  moving.element.appendTo(target.element).removeClass('moving');
  $('.square.possible-move').removeClass('possible-move');
  

  moving.square.checker = null;
  moving.square = target;
  target.checker = moving;
  moving = null;

  if(checkForMoves(target,target.checker,true).length){
    console.log('another one');
    console.log(moving);
    target.checker.element.trigger('click');
  }else{
    console.log('no more');
    
    setTurn();
  }
  */
})

/*
function checkForMoves(originSquare,movingChecker,onlyJumps=false){
  var potentialSquares = [];
  var jumpSquares = [];
  potentialSquares = $.grep(game.squares, function(square){
    if(square.x == originSquare.x+movingChecker.defaultDirection && (square.y == originSquare.y-1 || square.y == originSquare.y+1) && square.playable){
      if(onlyJumps){
        if(square.checker != null){
          if(square.checker.team != movingChecker.team){
            var checkCol = square.y+(square.y-originSquare.y);
            var checkRow = square.x+movingChecker.defaultDirection;

            var checkSquare = $.findFirst(squares, function(elm){
              return elm.x == checkRow && elm.y == checkCol;
            });

            if(checkSquare)
              if(checkSquare.checker == null)
                jumpSquares.push(checkSquare);
          }
        }
      }else{
        if(!square.checker){return true;}
        else{
          console.log(square.checker.userId);
          console.log(movingChecker.userId);

          if(square.checker.userId != movingChecker.userId){
            var checkCol = square.y+(square.y-originSquare.y);
            var checkRow = square.x+movingChecker.defaultDirection;

            var checkSquare = $.findFirst(game.squares, function(elm){
              return elm.x == checkRow && elm.y == checkCol;
            });

            if(checkSquare)
              if(!checkSquare.checker)
                jumpSquares.push(checkSquare);
          }
        }
      }
    }
    return false;
    
  });

  
  if(jumpSquares.length){
    $.each(jumpSquares,function(index,square){
      var moreJumps = checkForMoves(square,movingChecker,true);
      $.merge(potentialSquares,moreJumps);
    });
  }
  $.merge(potentialSquares,jumpSquares);
  return potentialSquares;
}
*/

/*
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

      var board = $('#board');
      var squares = [];
      var checkers = [];
      var teamTurn;

      function initBoard(dimension=8){
        squares = [];
        checkers = [];
        teamTurn = null;
        board.html('');

        maxSquareHeight = board.height()/dimension; //the max dimension that will work within the board height
        maxSquareWidth = board.width()/dimension; //the max dimension that will work within the board width

        squareDimension = maxSquareHeight <= maxSquareWidth ? maxSquareHeight : maxSquareWidth;

        for (var i = 0; i < dimension; i++) {
          evenRow = i%2==0 ? true : false;
          var square;

          for (var n = 0; n < dimension; n++){
            playable = evenRow ? (n%2==0 ? false : true) : (n%2==0 ? true : false);
            square = $('<div class="square" style="height:'+squareDimension+'px;width:'+squareDimension+'px;"></div>')
            square.appendTo(board);

            if(n == 0 && square){square.css('clear','both');}

            squares.push({
              element: square,
              playable: playable,
              coords: {
                top: square.offset().top,
                left: square.offset().left,
                bottom: square.offset().top+square.height(),
                right: square.offset().left+square.width()
              },
              row: i,
              col: n,
              checker: null
            })

            if(playable){square.addClass('black');}else{square.addClass('white');}
          }
        }

        setCheckers(dimension);
        setTurn();
      }

      function setTurn(){
        teamTurn = teamTurn == undefined || teamTurn == 2 ? 1 : 2;
        $('#current-turn').text(teamTurn == 1 ? 'Red' : 'Blue');
      }

      function sizeSquares(dimension=8){
        maxSquareHeight = board.height()/dimension; //the max dimension that will work within the board height
        maxSquareWidth = board.width()/dimension; //the max dimension that will work within the board width

        squareDimension = maxSquareHeight <= maxSquareWidth ? maxSquareHeight : maxSquareWidth;

        $.each(squares,function(index,value){
          value.element.height(squareDimension).width(squareDimension);
        })
      }

      function setCheckers(dimension){
        checkerRows = Math.ceil(dimension/3);
        checkerNum = dimension*checkerRows;

        var checker;

        for (var i = 0; i < checkerNum; i++) {
          if(squares[i].playable){
            checker = $('<div class="checker red"></div>');
            checker.appendTo(squares[i].element);
            checkers.push({
              element: checker,
              square: squares[i],
              defaultDirection: 1,
              team: 1,
              active: true,
              king: false
            });
            squares[i].checker = checkers[checkers.length-1];
          }
        }

        for (var i = squares.length-1; i >= squares.length-checkerNum; i--) {
          if(squares[i].playable){
            checker = $('<div class="checker blue"></div>');
            checker.appendTo(squares[i].element);
            checkers.push({
              element: checker,
              square: squares[i],
              defaultDirection: -1,
              team: 2,
              active: true,
              king: false
            });
            squares[i].checker = checkers[checkers.length-1];
          }
        } 
      }

      function checkForMoves(originSquare,movingChecker,onlyJumps=false){
        var potentialSquares = [];
        var jumpSquares = [];
        potentialSquares = $.grep(squares, function(e){
          if(e.row == originSquare.row+movingChecker.defaultDirection && (e.col == originSquare.col-1 || e.col == originSquare.col+1) && e.playable){
            if(onlyJumps){
              if(e.checker != null){
                if(e.checker.team != movingChecker.team){
                  var checkCol = e.col+(e.col-originSquare.col);
                  var checkRow = e.row+movingChecker.defaultDirection;

                  var checkSquare = $.findFirst(squares, function(elm){
                    return elm.row == checkRow && elm.col == checkCol;
                  });

                  if(checkSquare)
                    if(checkSquare.checker == null)
                      jumpSquares.push(checkSquare);
                }
              }
            }else{
              if(e.checker == null){return true;}
              else{
                if(e.checker.team != movingChecker.team){
                  var checkCol = e.col+(e.col-movingChecker.square.col);
                  var checkRow = e.row+movingChecker.defaultDirection;

                  var checkSquare = $.findFirst(squares, function(elm){
                    return elm.row == checkRow && elm.col == checkCol;
                  });

                  if(checkSquare)
                    if(checkSquare.checker == null)
                      jumpSquares.push(checkSquare);
                }
              }
            }
          }
          return false;
        });
        if(jumpSquares.length){
          $.each(jumpSquares,function(index,square){
            var moreJumps = checkForMoves(square,movingChecker,true);
            $.merge(potentialSquares,moreJumps);
          });
        }
        $.merge(potentialSquares,jumpSquares);
        return potentialSquares;
      }

      var moving = null;
      $('body').on('click','.checker', function(e){
        targetElement = $(this);
        target = $.findFirst(checkers, function(elm){
          return elm.element.is(targetElement);
        });

        if(target.team != teamTurn){
          alert('Not your turn ya dummy!');
        }else{
          var newMoving;

          if(moving != null){
            moving.element.removeClass('moving');
            $('.square.possible-move').removeClass('possible-move');

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

            var jumpSquares = [];

            var potentialSquares = checkForMoves(moving.square,moving);
            //Find potential squares

            if(jumpSquares.length > 0){
              $.merge(potentialSquares,jumpSquares);
            }

            $.each(potentialSquares, function(index,value){
              value.element.addClass('possible-move');
            })
          }
        }
      });

      $('body').on('click','.square.possible-move',function(e){
        targetSquare = $(this);
        target = $.findFirst(squares, function(elm){
          return elm.element.is(targetSquare);
        })

        rowMovement = Math.abs(moving.square.row-target.row);
        if(rowMovement > 1){
          startingRow = moving.square.row;
          startingCol = moving.square.col;
          endRow = target.row;
          endCol = target.col;
          jumpedChecker = $.findFirst(checkers, function(elm){
            return elm.square.row == (startingRow+endRow)/2 && elm.square.col == (startingCol+endCol)/2;
          });
          jumpedChecker.element.remove();
          jumpedChecker.active = false;
          jumpedChecker.square.checker = null;

          var teamScore = $('.score-count[data-team="'+moving.team+'"]');
          var teamScoreVal = parseInt(teamScore.text());
          teamScore.text(++teamScoreVal);
        }

        moving.element.appendTo(target.element).removeClass('moving');
        $('.square.possible-move').removeClass('possible-move');
        

        moving.square.checker = null;
        moving.square = target;
        target.checker = moving;
        moving = null;

        if(checkForMoves(target,target.checker,true).length){
          console.log('another one');
          console.log(moving);
          target.checker.element.trigger('click');
        }else{
          console.log('no more');
          
          setTurn();
        }
        
      })

      $(function(){
        initBoard();
      })

      $(window).resize(function(){
        sizeSquares();
      })
*/