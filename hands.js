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

// Server
var express = require('express');
var app = express();
var http = require('http').createServer(app).listen(3000);
var bodyParser = require('body-parser');
var io = require('socket.io').listen(80, {});

var config = require('./config.json');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
  extended: true
}));

// Johnny-five
var board, servo;
var five = require("johnny-five");
var arduinoServos = {};
var fingers = {};
var sweep = 5;                    // Countdown

// rate limiters
var last_time;
var num_tries = 0;

// Currently unused, but this will allow status information to be broadcast to all connected users
serverStatus = {
  hasArduino: false,
};

// Information representing each servo finger
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
// Unused, but intended for controlling the car the hand would have been mounted on
var throttleServo = {
  pin: 5,
  range: [50, 110],
  type: "standard",
  startAt: 90,
  center: true,
};
var steeringServo = {
  pin: 6,
  range: [50, 110],
  type: "standard",
  startAt: 75,
  center: true,
};


// Start server
http.listen(80, function(){
  console.log('Starting server, listening on *:80');
	// noArduino is to be used when the Raspberry Pi isn't connected to an Arduino through serial

	last_time = (new Date).getTime();

    board = new five.Board();

    board.on("ready", function() {
	    arduinoServos = {
	      thumb: new five.Servo(thumbServo),
	      pointer: new five.Servo(pointerServo),
	      middle: new five.Servo(middleServo),
	      ring: new five.Servo(ringServo),
	      pinkie: new five.Servo(pinkieServo),
	      steering: new five.Servo(steeringServo),
	      throttle: new five.Servo(throttleServo),
	    };
	    thumb = arduinoServos.thumb;
	    pointer = arduinoServos.pointer;
	    middle = arduinoServos.middle;
	    ring = arduinoServos.ring;
	    pinkie = arduinoServos.pinkie;
	    steering = arduinoServos.steering;
	    throttle = arduinoServos.throttle;
	   
	    // Inject the `servo` hardware into
	    // the Repl instance's context;
	    // allows direct command line access
	    board.repl.inject({
	      s: arduinoServos
	    });
	    
	    serverStatus.hasArduino = true;
	});

});

// node.js web server setup
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

/* A outside program can send a HTTP POST call to this for information update
 *  Expects an array of information in 'command' via REST, or direct variable information
 *  Example http address: http://localhost/move/
 */
app.post('/move/', function (req, res) {
  console.log("Http: move function called");
  
  // Ignore if there has been a request too soon
  //  Note that this can quickly superseed the socket.io function below 
  curr_time = (new Date).getTime();
  if (curr_time - last_time < 250) {
     last_time = curr_time;
     return;
  }

  if( Object.prototype.toString.call( req.body.command ) === '[object Array]' ) {
    // If the input is an array, then go in finger order: thumb, pointer, middle, ring, pinkie
    distance = req.body.command[0];
  }
  else {
    // Look for HTTP POST variable "distance"
    distance = req.body.distance;
  }
  
  // If distance if within "Goldie-Locks" zone, do a finger countdown with sweep
  if ((distance < 20 && distance > 12) || sweep < 5) {
    // Hard coded servo values
    var up = 150;
    var down = 40;
    switch (sweep) {
      case 4:
        fingerChange("pointer", up);
        fingerChange("middle", up);
        fingerChange("ring", up);
        fingerChange("pinkie", up);
        break;
      case 3:
        fingerChange("pointer", up);
        fingerChange("middle", up);
        fingerChange("ring", up);
        fingerChange("pinkie", down);
        break;
      case 2:
        fingerChange("pointer", up);
        fingerChange("middle", up);
        fingerChange("ring", down);
        fingerChange("pinkie", down);
        break;
      case 1:
        fingerChange("pointer", up);
        fingerChange("middle", down);
        fingerChange("ring", down);
        fingerChange("pinkie", down);
        break;
      case 0:
        fingerChange("pointer", down);
        fingerChange("middle", down);
        fingerChange("ring", down);
        fingerChange("pinkie", down);
        break;
    }
    if (sweep <= 0) {
      sweep = 5;
    }
    sweep -= 1;
  }
  
  // Spit back the POST information to the caller
  res.json({ 'distance':distance});
});

/* A outside program can send a HTTP POST call to this for robot hand control
 *  Expects an array of information in 'command' via REST
 *  Example http address: http://localhost/command/
 */
app.post('/command/', function (req, res) {
  console.log("Http: Robot Hand Control");
  
  // Delay to prevent command flooding
  curr_time = (new Date).getTime();
  if (curr_time - last_time < 250) {
     last_time = curr_time;
     res.json({ 'state': "too many connection attemts, blocked" });
  }

  // adjusts for REST or direct variable input
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
  
  res.json({ 'state': "commands received and sent to hand" });
});

// socket.io initialization
io.on('connection', function (socket) {
  console.log('A user has connected ');
  socket.emit('robot status', { data: 'server connected' });
  
  // Robot commands
  socket.on('robot command', function (data) {
    console.log('Robot Command -- ' + data);
    processRobotCommand (data);
  });
  
  // Status update - gets forwarded to the webpage
  socket.on('robot update', function (data) {
    var updatedData = data;
    updateRobotStatus (updatedData);
  });
});

// Interprets and acts on a given command (expects strings split by "-")
function processRobotCommand (command) {
  // rate limiter
  curr_time = (new Date).getTime();
  if (curr_time - last_time < 5000) {
     last_time = curr_time;
     return; 
  }
  else { 
    // expects a string split by dashes: "manual-40-40-40-40-40"
	  var parsedCommand = command.split("-");
	  console.log('----- Command: -----');
	  console.log(parsedCommand);
	  
	  if (serverStatus.hasArduino) {
	    // commands to johnny five
	    // A bit convoluted here: commands are split between '-', with an arbitrary order for each section
	    // First segment decides the type of command to build
      if (parsedCommand[0] == 'manual') {
	      // Expects a five more entries after that, one for each finger: "manual-40-40-40-40-40"
	      console.log('MANUAL ENTER')
	      fingerChange("thumb", parsedCommand[1]);
	      fingerChange("pointer", parsedCommand[2]);
	      fingerChange("middle", parsedCommand[3]);
	      fingerChange("ring", parsedCommand[4]);
	      fingerChange("pinkie", parsedCommand[5]);
	    }
	    if (parsedCommand[0] == 'robot') {
	      console.log('ROBOT ENTER')
	      // Expects a 1:motor, 2:value
	      robotChange(parsedCommand[1], parsedCommand[2]);
	    }
	  }
  }
}

// Broadcasts an update about the robot status through socket.io
function updateRobotStatus (updatedData) {
  updatedData['Time'] = new Date();
  updatedData['Arduino Attached'] = serverStatus.hasArduino;
  
  socket.broadcast.emit('robot status', { 'data': updatedData });
}

// ----- Johnny Five -----

// Update the finger servos
function fingerChange (finger, value) {
  console.log("fc - Arduino Change on: " + finger + ", to " + value);
  arduinoServos[finger].to(value);
  
  board.repl.inject({
    s: arduinoServos
  });
}

// Update the driving robot
function robotChange (motor, value) {
  console.log("rc - Arduino Change on: " + motor + ", to " + value);
  arduinoServos[motor].to(value);
  
  board.repl.inject({
    s: arduinoServos
  });
}
