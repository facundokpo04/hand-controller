/*** Robot Controller Script
 * application for controlling the RC car through a web browser
 * parts:
 * * express.js - serves webpage for direct robot management
 * * socket.io - streams information
 * * johnny-five - interacts with the Arduino, and the RC car by extension
 * run in conjunction with python opencv.py for AI commands
 *
 * Command line options:
 * * noArduino - skip all johnny-five content
*/

// Consider require('minimist') in the future
var args = process.argv.slice(2);

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
  extended: true
}));

// noArduino is to be used when the Raspberry Pi isn't connected to an Arduino through serial
if (args.indexOf("noArduino") == -1) {
  var five = require("johnny-five")
    , board, servo;
  
  var arduinoServos = {};
  var fingers = {};
  
  var thumbServo = {
    pin: 9,
    range: [0, 180],
    type: "standard",
    startAt: 0,
    center: true,
  };
  var pointerServo = {
    pin: 8,
    range: [0, 180],
    type: "standard",
    startAt: 0,
    center: true,
  };
  var middleServo = {
    pin: 10,
    range: [0, 180],
    type: "standard",
    startAt: 0,
    center: true,
  };
  var ringServo = {
    pin: 11,
    range: [0, 180],
    type: "standard",
    startAt: 0,
    center: true,
  };
  var pinkieServo = {
    pin: 12,
    range: [0, 180],
    type: "standard",
    startAt: 0,
    center: true, 
  };
}

serverStatus = {
  hasArduino: false,
};

// Start server
http.listen(80, function(){
  console.log('Starting server, listening on *:80');
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var last_time = (new Date).getTime();
var num_tries = -1;

// POST can look for timestamp(ms), command, and status
app.post('/command/', function (req, res) {
  console.log("Post Command");
  
  curr_time = (new Date).getTime();
  if (curr_time - last_time < 250) {
     last_time = curr_time;
     return;
  }

  last_time = curr_time;
 
  if( Object.prototype.toString.call( req.body.command ) === '[object Array]' ) {
    // If the input is an array, then go in finger order: thumb, pointer, middle, ring, pinkie
    fingerChange("thumb", req.body.command[0]);
    fingerChange("pointer", req.body.command[1]);
    fingerChange("middle", req.body.command[2]);
    fingerChange("ring", req.body.command[3]);
    fingerChange("pinkie", req.body.command[4]);
  }
  else {
    fingerChange("thumb", req.body.thumb);
    fingerChange("pointer", req.body.pointer);
    fingerChange("middle", req.body.middle);
    fingerChange("ring", req.body.ring);
    fingerChange("pinkie", req.body.pinkie);
  }
  // processRobotCommand (req.body.command);
  // updateRobotStatus (req.body.status);
  res.json({ 'state': "hello" });
});

io.on('connection', function (socket) {
  console.log('A user has connected ');
  socket.emit('robot status', { data: 'server connected' });
  
  // Robot commands
  socket.on('robot command', function (data) {
    processRobotCommand (data.data);
  });
  
  // Status update - gets forwarded to the webpage
  socket.on('robot update', function (data) {
    var updatedData = data.data;
    updateRobotStatus (updatedData);
  });
});

// Interprets and acts on a given command (expects strings split by "-")
function processRobotCommand (command) {
  var parsedCommand = command.split("-");
  console.log('----- Command: -----');
  console.log(parsedCommand);
  
  if (serverStatus.hasArduino) {
    // commands to johnny five
    // A bit convoluted here: commands are split between '-', with an arbitrary order for each section
    if (parsedCommand[0] == 'manual') {
      // Expects a 1:"finger", 2:value
      fingerChange(parsedCommand[1], parsedCommand[2]);
    }
  }
}

// Broadcasts an update to the robot status
function updateRobotStatus (updatedData) {
  updatedData['Time'] = new Date();
  updatedData['Arduino Attached'] = serverStatus.hasArduino;
  
  socket.broadcast.emit('robot status', { 'data': updatedData });
}

// ----- Johnny Five -----
// These should only be called or accessed if "noArduino" is not an option

function motorChange (motor, value) {
  
}

function fingerChange (finger, value) {
  console.log("Arduino Change on: " + finger + ", to " + value);
  arduinoServos[finger].to(value);
  
  board.repl.inject({
    s: arduinoServos
  });
}

if (args.indexOf("noArduino") == -1) {
  board = new five.Board();

  board.on("ready", function() {
    arduinoServos = {
      thumb: new five.Servo(thumbServo),
      pointer: new five.Servo(pointerServo),
      middle: new five.Servo(middleServo),
      ring: new five.Servo(ringServo),
      pinkie: new five.Servo(pinkieServo)
    };
    thumb = arduinoServos.thumb;
    pointer = arduinoServos.pointer;
    middle = arduinoServos.middle;
    ring = arduinoServos.ring;
    pinkie = arduinoServos.pinkie;
    
    var motor;
    motor = new five.Motor({
      pin: 5
    });
   
    // Inject the `servo` hardware into
    // the Repl instance's context;
    // allows direct command line access
    board.repl.inject({
      s: arduinoServos
    });
    
    board.repl.inject({
      motor: motor
    });
    
    serverStatus.hasArduino = true;
  });
}
