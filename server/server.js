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
var clientRooms = {}

io.on('connection',(client)=>{
  client.on('keydown',handleKeyDown)
  client.on('newGame',handleNewGame)
  client.on('joinGame',handleJoinGame)

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

    client.join(roomName);
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

io.listen(process.env.PORT||3000)