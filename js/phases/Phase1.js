import * as THREE from "https://esm.sh/three";
import { GameController } from "../GameController.js";
import { ScenesManager } from "../ScenesManager.js";

import { Phase } from "./Phase.js";

export class Phase1 extends Phase {
    constructor(gameController) { //:GameController
        super(gameController);
        this.initialize();
    }

    initialize() {
        console.log("Initializing Phase 1");
        
        this.gameController.clearScreen();

        const boxSize = 0.2 // 0.15
        var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize); // Box geometry for objects
        const object = new THREE.Mesh(
            geometry,
            new THREE.MeshNormalMaterial({ transparent: true })
        );

        // Specify the starting position for the boxes
        const farZ = -10; // Starting Z position (far away from the camera)
        const boxCount = 5; // Number of boxes to create

        for (let i = 0; i < boxCount; i++) {
            const mat = new THREE.MeshNormalMaterial({ transparent: true });
            const _object = object.clone(); // Clone the base object
            _object.material = mat; // Assign new material

            // Randomize position for x and y, set z to start at farZ
            _object.position.x = Math.random() * 2 - 1; // Random x between -1 and 1
            _object.position.y = Math.random() * 0.5 - 0.25; // Random y between -0.25 and 0.25
            _object.position.z = farZ; // Set z to start at farZ

            _object.rotation.x = Math.random() * 2 * Math.PI; // Random rotation
            _object.rotation.y = Math.random() * 2 * Math.PI; // Random rotation
            _object.rotation.z = Math.random() * 2 * Math.PI; // Random rotation

            _object.castShadow = true; // Enable shadow casting
            _object.receiveShadow = true; // Enable shadow reception
            _object.tag = 'box';

            ScenesManager.scene.add(_object); // Add object to the scene
            this.gameController.objects.push(_object); // Store reference to the object
        }

        this.gameController.reset_cursor_feedbacks();
        this.gameController.setup_collision_detection();

        /**
         * ===================
         * SABER
         * ===================
         */
        // Define the points for the line
        const points = [];
        points.push(new THREE.Vector3(-1, 0, 0)); // Start point
        points.push(new THREE.Vector3(1, 0, 0));  // End point

        // Create a geometry from the points
        geometry = new THREE.BufferGeometry().setFromPoints(points);

        // Create a material for the line
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color

        // Create the line object
        const line = new THREE.Line(geometry, material);
        ScenesManager.scene.add(line);
        this.gameController.objects.push(line);
        this.saber = line;
    }

    animate() {
        // Move boxes towards the camera
        this.gameController.objects.forEach((box) => {
            if (box.tag != 'box')
                return;
            box.position.z += 30 * this.gameController.frameTime; // Move box towards the camera

            // Check if the box has passed the camera
            if (box.position.z > 2.5) {
                // Reset the box to a far Z position with random X and Y
                box.position.z = -10; // Reset to far Z
                box.position.x = Math.random() * 2 - 1; // Randomize X position
                box.position.y = Math.random() * 0.5 - 0.25; // Randomize Y position
                box.material.opacity = 1; // Reset opacity when moved back to far Z
            }
        });

        // these two lines gets the finger status and hand orientations.
        // will add more later
        const v = this.gameController.gestureDetector.getFingerStatus();
        this.updateFingerStatus(v.fingerStates, v.palmCenters, v.thumbDirections);
    }

    updateFingerStatus(fingerStates, palmCenters, thumbDirections) {
        console.log(fingerStates, palmCenters, thumbDirections);
        if (palmCenters.length >= 1) {
            if (fingerStates[0].join('').substring(1,5) !== '____')
                this.saber.visible = false;
            else
                this.saber.visible = true;
            this.changeLineEndpoints(palmCenters[0], thumbDirections[0])
        } else {
            this.saber.visible = false;
        }
        // if (palmCenters.length)
        // this.changeLineEndpoints(palmCenters[0]);
    }

    cleanUp() {
        // Make sure that the saber is removed from the scene properly.
        // this.gameController.objects.push(this.saber);
    }

    handleGesture(command, handIndex) {

    }

    handleCollision(command, event) {

    }

    /***
     * Utility functions
     */

    changeLineEndpoints(newStart, direction) {//startPos, endPos
        var scaleFactor = 1;
        const normalizedDirection = direction.clone().normalize().multiplyScalar(scaleFactor);
        const newEnd = newStart.clone().add(normalizedDirection);
        this.saber.geometry.attributes.position.setXYZ(0, newStart.x, newStart.y, newStart.z);
        this.saber.geometry.attributes.position.setXYZ(1, newEnd.x, newEnd.y, newEnd.z);
        this.saber.geometry.attributes.position.needsUpdate = true;
    }
}