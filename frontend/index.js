const BG_COLOR = '#231f20'
const SNAKE_COLOR = '#c2c2c2'
const FOOD_COLOR = '#e66916'

// const socket = io("https://arcane-hollows-21167.herokuapp.com/")
const socket = io("http://localhost:3000")
socket.on('init',handleInit)
socket.on('gameState',handleGameState)
socket.on('gameOver',handleGameOver)
socket.on('gameCode',handleGameCode)
socket.on('unknownCode',handleUnknownCode)
socket.on('tooManyPlayers',handleTooManyPlayers)
socket.on('fenWaitHandle',fenWaitHandle)

let canvas, ctx;
let playerNumber;
let gameActive = false;

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen')
const newGameBtn = document.getElementById('newGameButton')
const joinGameBtn = document.getElementById('joinGameButton')
const gameCodeInput = document.getElementById('gameCodeInput')
const gameCodeDisplay =document.getElementById('gameCodeDisplay')
const fenWaitDisplay =document.getElementById('fenWaitDisplay')
const grayScore =document.getElementById('grayScore')
const pinkScore =document.getElementById('pinkScore')

newGameBtn.addEventListener('click',newGame)
joinGameBtn.addEventListener('click',joinGame)

function newGame()
{
    socket.emit('newGame')
    init()
}

function joinGame()
{
    const code = gameCodeInput.value
    socket.emit('joinGame',code)
    init()
}

function init()
{
    initialScreen.classList.remove('d-flex')
    initialScreen.classList.add('d-none')
    gameScreen.classList.remove('d-none')
    gameScreen.classList.add('d-block')
    canvas = document.getElementById('canvas')
    ctx = canvas.getContext('2d')
    canvas.width = canvas.height = 600
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0,0,canvas.width,canvas.height)
    document.addEventListener('keydown',keydown);
    gameActive= true;
}

function keydown(e)
{
    socket.emit('keydown',e.key)
}

function paintGame(state)
{
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0,0,canvas.width,canvas.height)
    const food = state.food;
    const gridSize = state.gridSize;
    const size = canvas.width/gridSize;

    ctx.fillStyle = FOOD_COLOR;
    ctx.fillRect(food.x*size,food.y*size,size,size)

    paintPlayer(state.players[0], size, SNAKE_COLOR)
    paintPlayer(state.players[1], size, 'violet')

    grayScore.textContent = "Gray: "+   `${state.players[0].score}`
    pinkScore.textContent = "Pink: "+   `${state.players[1].score}`
}

function paintPlayer(playerState, size, color)
{
    const snake = playerState.snake;
    for (let cell of snake)
    {
        ctx.fillStyle = color;
        ctx.fillRect(cell.x * size,cell.y * size, size , size);
    }
}
function handleInit(data){
    playerNumber = data
}
function handleGameState(gameState)
{
    if(!gameActive)
        return
    gameState = JSON.parse(gameState)
    requestAnimationFrame(() => paintGame(gameState))
}
function handleGameOver(data)
{
    if(!gameActive)
        return
    data = JSON.parse(data)

    // if(data.winner === playerNumber)
    // {
    //     alert('You win')
    // }
    // else
    //     alert("You lose")
    if(data.state.players[0].score>data.state.players[1].score)
    {
        if(data.winner === playerNumber)
        {
            if(playerNumber === 1)
                alert('Gray win')
            else
                alert('Pink win')
        }
        else
            if(playerNumber === 1)
                alert('Gray lose')
            else
                alert('Pink lose')
    }
    else if(data.state.players[0].score===data.state.players[1].score)
    {
        alert('Tie')
    }
    else
    {
        if(data.winner === playerNumber)
        {
            if(playerNumber === 1)
                alert('Gray win')
            else
                alert('Pink win')
        }
        else
            if(playerNumber === 1)
                alert('Gray lose')
            else
                alert('Pink lose')
    }
    gameActive=false;
}
function handleGameCode(gameCode)
{
    gameCodeDisplay.textContent = gameCode
}

function handleUnknownCode()
{
    reset()
    alert("Unknown game code")
}

function handleTooManyPlayers()
{
    reset()
    alert("This game is already in progress")
}

function fenWaitHandle()
{
    fenWaitDisplay.textContent = "Your game start in 3"
    let time = 2;
    const timeCountDown = setInterval(()=>
    {      
        if(time>0)
        {
            fenWaitDisplay.textContent = "Your game start in "+ `${time}`
            time--
        }
        else
        {
            fenWaitDisplay.textContent = "Starts:"
            if(playerNumber===1) fenWaitDisplay.textContent += " Your snake is Gray"
            else fenWaitDisplay.textContent += " Your snake is Pink"
            clearInterval(timeCountDown)
        }
    },1000)
}

function reset()
{
    playerNumber = null
    gameCodeInput.value = ""
    gameCodeDisplay.innerText = ""
    gameScreen.classList.remove('d-block')
    gameScreen.classList.add('d-none')
    initialScreen.classList.remove('d-none')
    initialScreen.classList.add('d-flex')
}