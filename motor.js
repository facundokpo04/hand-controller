var five = require("johnny-five"),
  board, motor, led;

board = new five.Board();

board.on("ready", function() {
  // Create a new `motor` hardware instance.
  motor = new five.Motor({
    pins: {
      pwm: 5,
      dir: 3
    }
  });

  // Inject the `motor` hardware into
  // the Repl instance's context;
  // allows direct command line access
  board.repl.inject({
    motor: motor
  });

  // Motor Event API
  motor.fwd(100 * 0.75);

  // stop()
  // Stop the motor. `isOn` property set to |false|
});
