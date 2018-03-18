var framesPerSecond = 10;

/* 
 *  global variables
 */

var mainPiece; 
var movement;
var pieces = [];              // not active pieces
var filledPositions = [];   // in order to avoid extra calculation 

// canvas size
var boardHeight = 500;
var boardWidth = 500;
var square = 10;

// shape matrix sizes
var shapeYlong = 3;
var shapeXlong = 3;


function Piece() {
  //possible shapes
  this.piecesShape = [
    [
      ['*','*','*','*'],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    [
      ['*',0,0,0],
      ['*',0,0,0],
      ['*','*',0,0],
      [0,0,0,0]
    ],
    [
      [0,'*',0,0],
      [0,'*',0,0],
      ['*','*',0,0],
      [0,0,0,0]
    ],
    [
      [0,'*',0,0],
      ['*','*',0,0],
      ['*',0,0,0],
      [0,0,0,0]
    ],
    [
      ['*','*',0,0],
      ['*','*',0,0],
      ['*','*',0,0],
      [0,0,0,0]
    ]
  ]; 
  this.shape =  this.piecesShape[Math.floor((Math.random() * 5) + 1) - 1];   // random shape
  this.color = '#'+Math.floor(Math.random()*16777215).toString(16);          // random color
  this.x = boardWidth / 2;
  this.y = 0;
  this.active = 1;
  this.longY = 0;
  this.longX = 0;

  // in order to avoid some extra calculation later
  this.size = function() {
    endOfShape:
    for(var y = shapeYlong; y >= 0; y--) {
      for(var x = shapeXlong; x >= 0; x--) {
        if(this.shape[y][x] === '*') {
          this.longY < y + 1 ? this.longY = y + 1 : '';
          this.longX < x + 1 ? this.longX = x + 1 : '';
        }
      }
    }
  };
  this.size();

  this.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    for(var y = 0; y < this.shape.length; y++) {
      for(var x = 0; x < this.shape[y].length; x++) {
        // draw each point of the shape
        if(this.shape[y][x] === '*') {
          ctx.rect(this.x + (x * square), this.y + (y * square), square, square);
          ctx.fillStyle = this.color ;
        }
      }
    }
    ctx.fill();
  };

  this.rotateClockwise = function() {
    this.shape = this.shape.reverse();
    for (var i = 0; i < this.shape.length; i++) {
      for (var j = 0; j < i; j++) {
        var temp = this.shape[i][j];
        this.shape[i][j] = this.shape[j][i];
        this.shape[j][i] = temp;
      }
    }
    this.size();
  };

  this.rotateCounterClockwise = function() {
    this.shape = this.shape.map(function(row) {
      return row.reverse();
    });
    for (var i = 0; i < this.shape.length; i++) {
      for (var j = 0; j < i; j++) {
        var temp = this.shape[i][j];
        this.shape[i][j] = this.shape[j][i];
        this.shape[j][i] = temp;
      }
    }
    this.size();
  };

  this.move = function() {
    if(this.active) {
      if(movement !== 'stop') {
        this.y = this.y + square;
      }
      if(movement) {
        switch(movement){
          case 'left':
            this.x > 0 ? this.x = this.x - square : '';
            break;
          case 'right':
            this.x + (this.longX * square) < boardWidth ? this.x = this.x + square : '';
            break;
          case 'up':
            this.rotateCounterClockwise();
            // in order not to rotate the piece on the right border
            if(this.x + (this.longX * square) >= boardWidth) {
              this.rotateClockwise();
            }
            break;
          case 'down':
            this.rotateClockwise();
            // in order not to rotate the piece on the right border
            if(this.x + (this.longX * square) >= boardWidth) {
              this.rotateCounterClockwise();
            }
            break;
        }
      }

    }
  };

  // in order to store all the filled positions
  this.addFilledPosition = function() {
    for(var y = 0; y < this.shape.length; y++) {
      for(var x = 0; x < this.shape[y].length; x++) {
        if(this.shape[y][x] === '*') {
          if(filledPositions[this.y + y * square]) {
            filledPositions[this.y + y * square].push(this.x + x * square);
          } else {
            filledPositions[this.y + y * square] = [];
            filledPositions[this.y + y * square].push(this.x + x * square);
          }
        }
      }
    }
    // set this piece as an old one and create the new main piece
    this.active = 0;
    pieces.push(this);
    requestAnimationFrame(drawOldPieces);
    if(filledPositions[0]) {
      // check if the game is over
      for(var p = 0; p < filledPositions[0].length; p++) {
        if(filledPositions[0][p] == boardWidth / 2) {
          alert ('game over');
          movement = 'stop';
        } else {
          mainPiece = new Piece();
        }
      }
    } else {
      mainPiece = new Piece();
    }
  };

  this.checkCollision = function() {
    collision:
    for(var y = 0; y < this.shape.length; y++) {
      for(var x = 0; x < this.shape[y].length; x++) {
        if(this.shape[y][x] === '*' && filledPositions[this.y + y * square]) {
          for(var p = 0; p < filledPositions[this.y + y * square].length; p++) {
            if(filledPositions[this.y + y * square][p] == this.x + x * square) {
              if(movement) {
                switch(movement) {
                  case 'left':
                    this.x = this.x + square;
                    break;
                  case 'right':
                    this.x = this.x - square;
                }
                movement = null;
                // in order to check vertical collision
                this.checkCollision();
              } else {
                // only block the movement if it's a vertical movement
                this.y = this.y - square;
                this.addFilledPosition();
              }
              break collision;
            }
          }
        }
      }
    }
    // end of the board
    if(this.y == boardHeight - (this.longY * square)) {
      this.addFilledPosition();
    }
  };
} 

/*
 * Init function + keyboard listener
 */
function init() {
  document.addEventListener('keydown', function(event) {
    switch(event.keyCode) {
      case 37:
      case 65:
        movement = 'left';
        break;
      case 38:
      case 87:
        movement = 'up';
        break;
      case 39:
      case 68:
        movement = 'right';
        break;
      case 40:
      case 83:
        movement = 'down';
        break;
      case 13:
        movement = 'stop';
        break;
    }
  });

  setCanvasSize();
  window.requestAnimationFrame(draw);
}

function setCanvasSize() {
    var canvas = document.getElementById("canvas");  
    canvas.width = boardWidth;
    canvas.height = boardHeight;
    var oldPieces = document.getElementById("oldPieces");  
    oldPieces.width = boardWidth;
    oldPieces.height = boardHeight;
}


/*
 * Main function
 */
function draw() {
  var ctx = document.getElementById('canvas').getContext('2d');

  // clean the canvas
  ctx.clearRect(0, 0, boardHeight, boardWidth);

  if(!mainPiece) {
    mainPiece = new Piece();
  }

  mainPiece.move();
  mainPiece.checkCollision();
  mainPiece.draw(ctx);

  if(movement !== 'stop') {
    movement = null;
    // in order to animate always at the same frame rate always
    setTimeout(function() {
      requestAnimationFrame(draw);
    }, 1000 / framesPerSecond);
  }
}

function drawOldPieces() {
  var ctx = document.getElementById('oldPieces').getContext('2d');

  // clean the canvas
  ctx.clearRect(0, 0, boardHeight, boardWidth);

  // draw old pieces
  for(var p = 0; p < pieces.length; p++){
    pieces[p].draw(ctx);
  }
}


init();   // start
