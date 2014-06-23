// This script tests the functionality of the Aruidno connected robot hand
//  It should close, then open all fingers (or vice versa, depending on how the servo motors are set up)
// This uses node.js and johnny-five

var five = require("johnny-five")
    , board, servo;

var thumbServo = {
  pin: 8,
  range: [0, 180],
  type: "standard",
  startAt: 0,
  center: true,
};
var pointerServo = {
  pin: 9,
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

var arduinoServos = {};
var fingers = {};


board = new five.Board();

console.log("begin");
board.on("ready", function() {
  console.log("ready");
  
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
  
  // Inject the `servo` hardware into
  // the Repl instance's context;
  // allows direct command line access
  board.repl.inject({
    s: arduinoServos
  });
  
  fingerChange("thumb", 10);
  fingerChange("pointer", 10);
  fingerChange("middle", 10);
  fingerChange("ring", 10);
  fingerChange("pinkie", 10);
  
  console.log("start");
  board.wait(2000, function() {
    fingerChange("thumb", 170);
    fingerChange("pointer", 170);
    fingerChange("middle", 170);
    fingerChange("ring", 170);
    fingerChange("pinkie", 170);
    console.log("stop");
    process.exit(0);
  });
});

function fingerChange (finger, value) {
  arduinoServos[finger].to(value);
  
  board.repl.inject({
    s: arduinoServos
  });
}

