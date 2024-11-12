import * as THREE from "https://esm.sh/three";
import { Pane } from "https://esm.sh/tweakpane";
import { GameController } from "../GameController.js";
import { ScenesManager } from "../ScenesManager.js";

export class TestPhase {
    constructor(gameController) { //:GameController
        this.gameController = gameController;
        this.initialize();

        this.fingerStates = {};
    }

    initialize() {
        console.log("Initializing Test Phase");
        
        this.gameController.clearScreen();
    }
    animate() {
        var handObjs = this.gameController.handControls.handsObjs;
        var palmCenters = this.gameController.handControls.target;

        var _fingerStates = {};
        var _handOrientations = {};

        handObjs.forEach((hand, handIndex) => {
            const fingers = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
            const baseFinger = 0; // Base of the hand
            const palmLength = ignoreZAxis(hand.children[5].position.clone().sub(hand.children[baseFinger].position)).length();
            let relaxedFingers = 0;
            let ratios = [];
            let fingerStates = []; // Initialize an empty string to represent finger states
            
            // Calculate thumb ratio separately
            const thumbLength = ignoreZAxis(hand.children[4].position.clone().sub(hand.children[5].position)).length();
            const thumbRatio = thumbLength / palmLength;
            ratios.push(thumbRatio);
            if (thumbRatio > .4) {
                relaxedFingers++;
                fingerStates.push("^"); // If the thumb is relaxed, add "^" to the string
            } else {
                fingerStates.push("_"); // If the thumb is not relaxed, add "_" to the string
            }

            // Calculate ratios for other fingers
            fingers.slice(1).forEach((fingerIndex) => {
                const fingerLength = ignoreZAxis(hand.children[fingerIndex].position.clone().sub(hand.children[baseFinger].position)).length();
                const fingerRatio = fingerLength / palmLength;
                ratios.push(fingerRatio);
                if (fingerRatio > 1.3) {
                    relaxedFingers++;
                    fingerStates.push("^"); // If the finger is relaxed, add "^" to the string
                } else {
                    fingerStates.push("_"); // If the finger is not relaxed, add "_" to the string
                }
            });

            // Calculate the signed angle of orientation of the hand in the 2D plane
            const handOrientationVectors = fingers.map(fingerIndex => {
                const fingerTip = hand.children[fingerIndex].position;
                const wrist = hand.children[baseFinger].position;
                const vector = fingerTip.clone().sub(wrist).normalize();
                // Project the vector onto the 2D plane by setting z to 0
                vector.z = 0;
                return vector;
            });
            const meanVector = handOrientationVectors.reduce((acc, vector) => {
                return acc.add(vector);
            }, new THREE.Vector3(0, 0, 0)).divideScalar(handOrientationVectors.length).normalize();
            // Project the reference vector onto the 2D plane by setting z to 0
            const referenceVector = new THREE.Vector3(0, 1, 0);
            referenceVector.z = 0;
            var handOrientationAngle = meanVector.angleTo(referenceVector) * (180 / Math.PI);
            // Determine if the angle is positive or negative based on the cross product
            const crossProduct = meanVector.cross(referenceVector).z;
            if (crossProduct < 0) {
                handOrientationAngle *= -1; // Make the angle negative if the cross product is negative
            }

            const thumbDirectionVector = hand.children[fingers[1]].position.clone().sub(hand.children[fingers[4]].position);

            // Prints
            console.log(`Hand Index: ${handIndex}`);
            console.log(`Hand Orientation Angle: ${handOrientationAngle}`);
            console.log(fingerStates); // Log the string representing finger states
            console.log(ratios);
            console.log(thumbDirectionVector);

            _fingerStates[handIndex] = fingerStates;
            _handOrientations[handIndex] = handOrientationAngle;
        });

        this.fingerStates = _fingerStates;
        this.updateFingerStatus(_fingerStates, _handOrientations);

        function ignoreZAxis(vector) {
            return new THREE.Vector3(vector.x, vector.y, 0);
        }
    }

    updateFingerStatus(fingerStates, handOrientations) {
        // Clear existing finger status GUI elements
        if (this.gameController.fingerFolder)
            this.gameController.fingerFolder.dispose(); // Dispose of the current pane to reset

        // Create a new pane for finger status
        this.pane = this.gameController.fingerFolder = this.gameController.pane.addFolder({
            title: "Fingers"
        });

        Object.entries(fingerStates).forEach(([handIndex, hand]) => {
            var folder = this.pane.addFolder({
                title: `Hand ${handIndex}`
            });

            const fingerString = hand.map(state => state === '^' ? 'O' : '-').join('');
            folder.addBinding({ fingerString }, 'fingerString', {
                label: 'Fingers',
                readonly: true
            });

            const handOrientation = handOrientations[handIndex];
            folder.addBinding(
                { offset: {x: Math.sin(handOrientation * Math.PI/180), y: -Math.cos(handOrientation * Math.PI/180)} }, 
                'offset', {
                    picker: 'inline',
                    expanded: true,
                }
            );
        });
    }

    cleanUp() {
        if (this.gameController.fingerFolder)
            this.gameController.fingerFolder.dispose(); // Dispose of the current pane to reset
    }

    handleGesture(command, handIndex) {

    }

    handleCollision(command, event) {
        
    }
}