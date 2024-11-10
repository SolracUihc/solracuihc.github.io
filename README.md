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
    * `cleanUp()` function cleans the entire canvas while exiting the current one.
    * More: read the code or ask Sam.
* The `target` now tracks the center of the palm.

## Game Phases

### General GUI

* Click "Back to Menu" to exit to the menu.

### Selection Menu

* Either punch or grab at the boxes indicating the level of your choice.
    * "punch" means holding your fist closed, and touching the boxes.
    * "grab" ("select") means you close your fist while colliding with the boxes.

    ![alt text](readme-src/image-1.png)

### Test Phase

* For developer use
* Currently is testing on the detection of each finger's status (opened `O`/ closed `-`).
* You can also read the rotation of the palm.

![alt text](readme-src/image.png)