const express = require("express");
const oracle = require('oracledb');
var cors = require('cors');
const App = express();
const PORT = 5050;
var games = {};
var users = {};
const Pieces = {
  WhitePawn: 1,
  WhiteBishop: 2,
  WhiteRook: 3,
  WhiteKnight: 4,
  WhiteQueen: 5,
  WhiteKing: 6,
  BlackPawn: 11,
  BlackBishop: 12,
  BlackRook: 13,
  BlackKnight: 14,
  BlackQueen: 15,
  BlackKing: 16,
};
var bodyParser = require("body-parser");
const { response } = require("express");
var urlEncodedBodyParser = bodyParser.urlencoded({ extended: false });
App.use(cors({'origin':'https://jayschess.herokuapp.com'}));
App.get("/", (request, response) => {
  console.log('Hello There / Request recieved');
  response.send("Chess Game Server");
});

//Login Signup
const initUsers = () => {
  //Fetch all the users from database and into DS
  /*const connection;
  try{
    connection = await oracle.getConnection({
      'user': 'hr',
      'password': 'hr',
      'connectionString': 'localhost:1521/xepdb1'
    });
    var query = '';//get all users 
    var usersSet = await connection.execute(query);
    usersSet.forEach((userFromDB) => {
      users.add(new User(userFromDB.username, userFromDB.password));
    })
  } catch (error) {
    console.log(error);
  }*/
}
//initUsers();
class User{
  constructor(username,password)
  {
    this.username = username;
    this.password = password;
  }
  getPassword()
  {
    return this.password;
  }
  getUsername()
  {
    return this.username;
  }
}
App.post('/login', urlEncodedBodyParser ,(req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var errors = [];
  if (username === null || username === undefined || username.length<5)
  {
    errors.push("Invalid User Name");
  }
  if (password === null || password === undefined || password.length<5)
  {
    errors.push("Invalid Password");
  }
  if (errors.length>0)
  {
    req.status(200).send({
      'error': errors
    });
    return;
  }
  
});



// Every Game has following properties
// 1> Game Matrix -- containing most recent position of the pieces on Place[0-7]
// 2> Player Who Last Moved White: 1 Black: 2 on Place[8]
// 3> Last Move on Place[9]
// 4> Number of Players joined on Place[10]




// Initiate A New Game
const createGame = () => {
  //generate a random unique 6 digit game code
  //initiating the game board
  var newGameCode;
  while (true) {
    newGameCode = Math.random() * 1000000;
    while (newGameCode <= 99999) {
      newGameCode *= 10;
    }
    newGameCode = Math.floor(newGameCode);
    value = games[newGameCode];
    if (value === undefined || value === null) break;
  }
  newGameCode = "" + newGameCode;
  var game = [];
  for (let i = 0; i <= 7; i++) game[i] = [];
  for (let i = 2; i < 6; i++) {
    for (let j = 0; j < 8; j++) {
      game[i][j] = 0;
    }
  }
  game[8] = 2; //No One Moved
  game[9] = [0, 0, 0, 0]; //No Last Move
  game[10] = 1; //The Game Creator Joined
  for (let i = 0; i < 8; i++) game[1][i] = Pieces.WhitePawn;
  for (let i = 0; i < 8; i++) game[6][i] = Pieces.BlackPawn;
  game[0][0] = Pieces.WhiteRook;
  game[0][1] = Pieces.WhiteKnight;
  game[0][2] = Pieces.WhiteBishop;
  game[0][3] = Pieces.WhiteQueen;
  game[0][4] = Pieces.WhiteKing;
  game[0][5] = Pieces.WhiteBishop;
  game[0][6] = Pieces.WhiteKnight;
  game[0][7] = Pieces.WhiteRook;
  //Black Pieces
  game[7][0] = Pieces.BlackRook;
  game[7][1] = Pieces.BlackKnight;
  game[7][2] = Pieces.BlackBishop;
  game[7][3] = Pieces.BlackQueen;
  game[7][4] = Pieces.BlackKing;
  game[7][5] = Pieces.BlackBishop;
  game[7][6] = Pieces.BlackKnight;
  game[7][7] = Pieces.BlackRook;
  //Add this game to list of games
  games[newGameCode] = game;
  return newGameCode;
};

const joinGame = (gameCode) => {
  //Check if game exists
  var game = games[gameCode];
  if (game === undefined || game === null) {
    throw "Game Code is Invalid";
  }
  //check if game already started
  else if (game[10] === 2) {
    throw "Game is Already Full";
  } else {
    game[10] = game[10] + 1;
    games[gameCode] = game;
  }
};
//Create Game Request Handler
App.post("/createGame", urlEncodedBodyParser, (req, res) => {
  var gameCode = createGame();
  res.status(200).send({
    gameCode: gameCode,
  });
});
App.post("/gameStatus", urlEncodedBodyParser, (req, res) => {
  var gameCode = "" + req.body.gameCode;
  if (gameCode.length < 6) {
    res.status(200).send({
      error: "Invalid Game Code",
    });
    return;
  }
  var game = games[gameCode];
  if (game === undefined || game === null) {
    res.status(200).send({
      error: "No Such Game Exists",
    });
  } else {
    if (game[10] === 2) {
      res.status(200).send({
        status: "started",
      });
    } else {
      res.status(200).send({
        status: "waiting",
      });
    }
  }
});
App.post("/joinGame", urlEncodedBodyParser, (req, res) => {
  var gameCode = "" + req.body.gameCode;
  if (gameCode.length < 6) {
    res.status(200).send({
      error: "Invalid Game Code",
    });
    return;
  }
  try {
    joinGame(gameCode);
    res.status(200).send({
      status: "Ok",
    });
  } catch (err) {
    res.status(200).send({
      error: err,
    });
  }
});
App.post('/endGame', urlEncodedBodyParser, (req, res) => {
  var gameCode = req.body.gameCode;
  if (gameCode === undefined || gameCode === null) {
    res.status(200).send({
      'error': 'invalid game code'
    });
    return;
  }
  gameCode = '' + gameCode;
  if (gameCode.length < 6) {
    res.status(200).send({
      'error': 'invalid game code'
    });
    return;
  }
  delete games[gameCode];
  res.status(200).send({
    'status': 'Ok'
  });
});
App.post("/movePiece", urlEncodedBodyParser, (req, res) => {
  var gameCode = '' + req.body.gameCode;
  if (gameCode.length < 6) {
    res.status(200).send({
      error: "Invalid Game Code",
    });
    return;
  }
  if (req.body.fromI === null || req.body.fromI === undefined) {
    res.status(200).send({
      error: "Bad Request",
    });
    return;
  }
  var fromI = parseInt(req.body.fromI);
  var fromJ = parseInt(req.body.fromJ);
  var toI = parseInt(req.body.toI);
  var toJ = parseInt(req.body.toJ);
    var player;
    if (req.body.player === null)
    {
        res.status(200).send({
            error:'Bad Request'
        })
        return;
        }
  if (req.body.player === 'WHITE') {
    player = 1;
  } else if(req.body.player==='BLACK') player = 2;
  var game = games[gameCode];
  if (game === null || game === undefined) {
    res.status(200).send({
      error: "Invalid Game Code",
    });
    return;
  }
  game[toI][toJ] = game[fromI][fromJ];
  game[fromI][fromJ] = 0;
  game[8] = player;
  game[9][0] = toI;
  game[9][1] = toJ;
  game[9][2] = fromI;
  game[9][3] = fromJ;
  games[gameCode] = game;
  res.status(200).send({
    status: "Ok",
  });
});
App.post("/getNextMove", urlEncodedBodyParser, (req, res) => {
  var gameCode = "" + req.body.gameCode;
  if (gameCode.length < 6) {
    res.status(200).send({
      error: "Invalid Game Code",
    });
    return;
  }
  var player = 1;
  if (req.body.player !== "WHITE") player = 2;
  var game = games[gameCode];
  if (game === null || game === undefined) {
    res.status(200).send({
      error: "Invalid Game Code",
    });
    return;
  }
  if (player === game[8]) {
    res.status(200).send({
      status: "wait",
    });
    return;
  } else  {
    var toI = game[9][0];
    var toJ = game[9][1];
    var fromI = game[9][2];
    var fromJ = game[9][3];
    res.status(200).send({
      status: "Ok",
      toI: toI,
      toJ: toJ,
      fromI: fromI,
      fromJ: fromJ,
    });
    return;
  }
});

//start the server
App.listen(process.env.PORT||PORT, (error) => {
  if (!error) {
    console.log("Server Running ");
  } else console.log(error);
});