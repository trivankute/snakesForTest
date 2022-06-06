const http = require("http");
const socket_io = require("socket.io");
const httpServer = http.createServer();
const io = new socket_io.Server(httpServer, {
  cors: {
    origin: "*",
    methods:['GET',"POST"]
  },
});

const {initGame,gameLoop,getUpdatedVelocity} = require('./game.js')
const {makeId} = require('./utils.js')
const {FRAME_RATE} = require('./constants.js')

var state = {}
var checkingForPlayAgain = {}
var clientRooms = {}

io.on('connection',(client)=>{
  client.on('keydown',handleKeyDown)
  client.on('newGame',handleNewGame)
  client.on('joinGame',handleJoinGame)
  client.on('afterGame',handleAfterGame)

  function handleAfterGame(continueToPlay)
  {
    const roomName =  clientRooms[client.id]
    const room = io.sockets.adapter.rooms.get(roomName);
    // console.log(typeof checkingForPlayAgain[roomName] === 'undefined')
    if(typeof checkingForPlayAgain[roomName] === 'undefined')
    {
      checkingForPlayAgain[roomName] = []
      checkingForPlayAgain[roomName].push({id:client.id,play:continueToPlay})
    }
    else
    {
      checkingForPlayAgain[roomName].push({id:client.id,play:continueToPlay})
    }

    if(checkingForPlayAgain[roomName].length===1)
    {
      let anotherId
      let playOrNot = checkingForPlayAgain[roomName][0].play
      for(let i of room.values())
        if(i!==checkingForPlayAgain[roomName][0].id) anotherId = i
      if(playOrNot)
        io.sockets.to(anotherId).emit("afterFirstAnswerForAnother",playOrNot)
      else
      {
        io.sockets.to(anotherId).emit("afterFirstAnswerForAnother",playOrNot)
        io.sockets.to(checkingForPlayAgain[roomName][0].id).emit("afterFirstAnswerForQuit")
      }
        
    }

    if(checkingForPlayAgain[roomName].length===2)
    {
      let playAgain = true;
      if(checkingForPlayAgain[roomName][0].play === false || checkingForPlayAgain[roomName][1].play === false)
        {
          playAgain = false;
          for(let i of room.values()) delete clientRooms[i]
          delete state[roomName]
          delete checkingForPlayAgain[roomName]
          sendingAnalogAfterGame(roomName, playAgain)
        }
        else
        {
          sendingAnalogAfterGame(roomName, playAgain)
          state[roomName] = initGame()
          fenWaitHandle(roomName)
          setTimeout(()=>
          startGameInterval(roomName)
          ,3000);
        }
    }
  }

  function handleJoinGame(roomName)
  {
    const room = io.sockets.adapter.rooms.get(roomName);
    let numClients = 0;
    if (room) {
      numClients = room.size
    }

    if (numClients === 0) {
      client.emit('unknownCode');
      return;
    } else if (numClients > 1) {
      client.emit('tooManyPlayers');
      return;
    }

    clientRooms[client.id] = roomName;

    client.emit('gameCode',roomName)
    client.join(roomName);
    
    // for(let i of room.values()) console.log(i) 

    client.number = 2;
    client.emit('init', 2);
    fenWaitHandle(roomName)

    setTimeout(()=>
    startGameInterval(roomName)
    ,3000);
  }

  function handleNewGame()
  {
    let roomName = makeId(5);
    clientRooms[client.id] = roomName
    client.emit('gameCode',roomName)

    state[roomName] = initGame()

    client.join(roomName)
    client.number = 1
    client.emit('init',1)
  }
  // if define function o cho~ khac thi se ko get access zo client dc
  function handleKeyDown(key)
  {
    const roomName = clientRooms[client.id]
    if(!roomName) return
    try {
      if(Object.keys(state).length !== 0)
      getUpdatedVelocity(key,state[roomName].players[client.number-1].vel)
    }
    catch(e)
    {
      console.error(e)
      return
    }
  }
})

function startGameInterval(roomName)
{
  const intervalId = setInterval(()=>{
    const winner = gameLoop(state[roomName])
    if(!winner)
    {
      emitGameState(roomName,state[roomName])
    } else {
      emitGameOver(roomName,winner,state[roomName])
      delete state[roomName]
      delete checkingForPlayAgain[roomName]
      // console.log(clientRooms)
      // for(let i in clientRooms)
      //   if(clientRooms[i] == roomName) delete clientRooms[i]
      // console.log(state)
      // console.log(clientRooms)

      clearInterval(intervalId)
    }
  },1000/FRAME_RATE)
}



function emitGameState(roomName,state)
{
  io.sockets.in(roomName)
    .emit('gameState', JSON.stringify(state))
}

function emitGameOver(roomName,winner,state)
{
  io.sockets.in(roomName)
    .emit('gameOver', JSON.stringify({winner,state}))
}

function fenWaitHandle(roomName)
{
  io.sockets.in(roomName)
    .emit('fenWaitHandle')
}

function sendingAnalogAfterGame(roomName, playAgain)
{
  io.sockets.in(roomName)
    .emit('afterGame',{roomName, playAgain})
}

io.listen(process.env.PORT||3000)