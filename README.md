# AI Music Project

## References
* Built upon the article: https://tympanus.net/codrops/2024/10/24/creating-a-3d-hand-controller-using-a-webcam-with-mediapipe-and-three-js/

## Things to do
* [ ] [Fix] Depth of hand (sensitivity):
    * [ ] Requries calibration of the size of hand and distance to camera @HandControls.js:update(landmarks).
* [x] Position of target (track ball):
    * Adjust it so that it follows the palm.
* [x] [Fix] Beautify the code for the previous fix.

## Changelog

* `GameController` now controls most features of the game.
* Under `js/phases/` are the different phases of the game. 
    * `SelectionMenu` is not implemented yet. It is supposed to be the selection menu for users.
    * Refer to `Phase1` for more information on how the `initialize()` and `animate()` functions are defined.
    * Remember to clear screen in the initialization.
* The `target` now tracks the center of the palm.