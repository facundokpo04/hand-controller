Kinect Hand Controller
======================
A node.js server that uses johnny-five to manipulate an Arduino powered hand. It also expects http calls with an array of finger positions.

This repository was extended from rc-car-controller that controls a simple robot hand.

Expect Input
------------

The hand can be manipulated through the node.js generated website, or through http post calls.

The function first looks to see if the "command" variable is an array. If yes, it applies the values to fingers in order: thumb, pointer, middle, ring, pinkie.

Physical Hand
-------------
The hand is a simple plastic/rubber model, where strings pull fingers closed.

Wiring:
* 8: thumb
* 9: index
* 10: middle
* 11: ring
* 12: pinkie