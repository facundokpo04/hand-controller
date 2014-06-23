Kinect Hand Controller
======================
A node.js server that uses johnny-five to manipulate an Arduino powered hand. It receives finger positions through socket.io or http calls. While this project was built on a RAspberry Pi, any computer with node.js and connected to an Arduino should be capable of running this application.

This repository was extended from [rc-car-controller](https://github.com/Self-Driving-Vehicle/rc-car-controller)

Requirements
------------
* node.js - javascript platform, acts as a server
 * http://nodejs.org/
* node.js libraries
 * listed in package.json
 * install required node libraries with "npm install"
 * johnny-five: Simple control of Arduino UNO
 * socket.io: event-based communication platform
 * toobusy: a limiter that guards the server from becoming flooded with requests
 * webpage support libraries: express, bodyparser

Expected Input
--------------
The hand can be manipulated through socket.io, or through http post calls.

* Socket.io input is expected to be a string, with servo values: "manual-40-40-40-40-40"
* For HTTP: the function first looks to see if the "command" variable is an array. If yes, it applies the values to fingers in order: thumb, pointer, middle, ring, pinkie.
 * Otherwise, it looks for relevant POST variables: thumb, pointer, middle, ring, pinkie

Physical Hand
-------------
The hand is a simple plastic/rubber model. The servos are attached via string to the fingers, turn 180 degrees to pull fingers closed.

Wiring
------
* 9: thumb
* 8: index
* 10: middle
* 11: ring
* 12: pinkie