import * as THREE from "https://esm.sh/three";
import { GameController } from "../GameController.js";
import { ScenesManager } from "../ScenesManager.js";

import { Phase } from "./Phase.js";
import { Fetcher } from "../Fetcher.js";

export class SelectionMenu extends Phase {
    constructor(gameController) { //:GameController
        super(gameController);

        this.collisions = {}; // Initialize a dictionary to keep track of collisions
        this.prevCollisions = {};
        this.prevFistState = {};

        this.optionTexts = ["Test Phase", "Game Phase 1", "Placeholder 1", "Placeholder 2", "Placeholder 3", "Placeholder 4"];
        this.optionObjects = [];
        this.optionLabelObjects = [];
        this.selectedTextObject = null;

        this.objectLabelYOffset = 0.2;
        
        this.initialize();
        this.showSelectionText("Select an option by closing the fingers.");
    }

    initialize() {
        console.log("Initializing Phase 0");

        this.gameController.clearScreen();

        const boxSize = 0.2; // Size of the boxes
        const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize); // Box geometry for options
        const material = new THREE.MeshNormalMaterial({ transparent: true }); // Material for the boxes

        // Specify the starting position for the boxes
        this.farZ = -10; // Starting Z position (far away from the camera)
        const boxCount = this.optionTexts.length; // Number of boxes to create

        // Calculate the number of boxes in each row
        const boxesPerRow = Math.ceil(boxCount / 2);

        // Calculate the radius of the circle based on the number of boxes
        this.orbitRadius = 1; // Radius of the circle
        this.startTime = 0;

        for (let i = 0; i < boxCount; i++) {
            /**
             * =======================================
             * Floating Box
             * ======================================= 
             */
            const _object = new THREE.Mesh(geometry, material.clone()); // Clone the base object and material
            // Position the boxes in a circle
            _object.position.x = this.orbitRadius * Math.cos(2 * Math.PI * i / boxCount);
            _object.position.y = this.orbitRadius * Math.sin(2 * Math.PI * i / boxCount);
            _object.position.z = this.farZ / 4; // Set z to start at farZ

            // _object.rotation.x = Math.random() * 2 * Math.PI; // Random rotation
            _object.rotation.y = Math.random() * 2 * Math.PI; // Random rotation
            _object.rotation.z = Math.random() * 2 * Math.PI; // Random rotation

            _object.castShadow = true; // Enable shadow casting
            // _object.receiveShadow = true; // Enable shadow reception
            _object.objectId = i;

            ScenesManager.scene.add(_object); // Add object to the scene
            this.gameController.objects.push(_object); // Store reference to the object
            this.optionObjects.push(_object);

            /**
             * =======================================
             * Floating Text
             * ======================================= 
             */
            // Create floating text above box with transparent background
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 512; // Increased canvas width for more text space
            canvas.height = 256; // Increased canvas height
            
            // Clear canvas with transparent background
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            context.font = 'Bold 48px Arial'; // Slightly smaller font to fit more text
            context.fillStyle = this.gameController.textColor;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Split text into multiple lines if too long
            const maxWidth = canvas.width - 40; // Leave some padding
            const words = this.optionTexts[i].split(' ');
            let lines = [];
            let currentLine = words[0];

            for(let j = 1; j < words.length; j++) {
                const testLine = currentLine + ' ' + words[j];
                const metrics = context.measureText(testLine);
                if (metrics.width > maxWidth) {
                    lines.push(currentLine);
                    currentLine = words[j];
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            // Draw each line of text
            const lineHeight = 60;
            const startY = canvas.height/2 - (lines.length - 1) * lineHeight/2;
            lines.forEach((line, index) => {
                context.fillText(line, canvas.width/2, startY + index * lineHeight);
            });
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.premultiplyAlpha = true; // Enable proper alpha blending
            const textMaterial = new THREE.SpriteMaterial({ 
                map: texture, 
                transparent: true,
                alphaTest: 0.1 // Helps with transparency rendering
            });
            const textSprite = new THREE.Sprite(textMaterial);
            textSprite.position.set(_object.position.x, _object.position.y + this.objectLabelYOffset, _object.position.z);
            textSprite.scale.set(0.8, 0.4, 1); // Increased scale to show more text
            textSprite.objectId = i;

            ScenesManager.scene.add(textSprite);
            this.gameController.objects.push(textSprite);
            this.optionLabelObjects.push(textSprite);
        }

        this.gameController.reset_cursor_feedbacks();
        this.gameController.setup_collision_detection();
    }

    /**
     * This function handles ALL animations and game state updates.
     */
    animate() {
        // Rotate the boxes in an orbit around the center
        const time = Date.now() * 0.0001; // Get current time in seconds
        if (this.startTime == 0)
            this.startTime = time;

        this.optionObjects.forEach((box, index) => {
            this._orbit(box, index, time);

            // Rotate the box itself
            if (Object.values(this.collisions).flat().includes(box)) {
                box.rotation.y += 0.08; // Rotate box faster if it's in the collisions
            } else {
                box.rotation.y += 0.01; // Rotate box slightly if it's not in the collisions
            }
        });

        this.optionLabelObjects.forEach((box, index) => {
            this._orbit(box, index, time, this.objectLabelYOffset);
        })
    }

    _orbit(box, index, time, yoffset=0) {
        // Calculate orbital position
        const angle = time - this.startTime + (index * (2 * Math.PI / this.optionObjects.length)); // Divide by 2 since objects include both boxes and text sprites
        const x = Math.cos(angle) * this.orbitRadius;
        const y = Math.sin(angle) * this.orbitRadius + yoffset; // Adjusted to use y for vertical movement
        const z = this.farZ / 4; // Set z to 0 to rotate in the x-y plane
        
        // Update position
        box.position.x = x;
        box.position.y = y; // Adjusted to use y for vertical movement
        box.position.z = z; // Set z to 0 to rotate in the x-y plane
    }

    cleanUp() {
        
    }

    handleGesture(command, handIndex) {
        // Handle gestures for selection
        switch (command) {
            case "opened_fist":
                break;
            case "closed_fist":
                break;
        }

        // Check if there are any new collisions for the current hand index
        this.collisions[handIndex] ??= [];
        if (this.prevFistState[handIndex] == command) {
            if (!this.prevCollisions[handIndex])
                this.prevCollisions[handIndex] = [];
            if (this.collisions[handIndex]) {
                var newCollided = this.collisions[handIndex].filter(obj => !this.prevCollisions[handIndex].includes(obj));
                var newNotCollided = this.prevCollisions[handIndex].filter(obj => !this.collisions[handIndex].includes(obj));
                this.handleNewCollisions(newCollided, newNotCollided, command, false, handIndex);
            }
        } else {
            this.handleNewCollisions(this.collisions[handIndex], [], command, true, handIndex);
        }

        // Default stuff
        this.prevFistState[handIndex] = command;
        this.prevCollisions[handIndex] = [...this.collisions[handIndex]];
    }

    /** Default function, do not implement anything here */
    handleCollision(command, event) {
        // Update the collisions dictionary with the current hand index and collided objects
        this.collisions[event.handIndex] = event.objects ?? [];
    }

    /** 
     * You can implement the customized functions for handling the collisions here
     * 
     */
    handleNewCollisions(newCollided, newNotCollided, fistState, isUnderStateChange, handIndex) {
        if (newCollided.length > 0) {
            var newCollidedIds = newCollided.map(obj => obj.objectId);
            // console.log(`Hand ${handIndex} collides with new Object ID: ${newCollidedIds.join(', ')}`);
            if (fistState == "closed_fist") { // ie: the fist is just closed.
                newCollidedIds.forEach(id => {
                    if (id == undefined)
                        return;
                    // if (isUnderStateChange) {
                        this.handleSelection(id, handIndex);
                        this.showSelectionText(this.optionTexts[id]);
                    // }
                    switch (id) {
                        default:
                            console.log(`${isUnderStateChange ? "Selected" : "Punched"}: ${id} with hand ${handIndex}`);
                    }
                });
            }
        }
        if (newNotCollided.length > 0) {
            var newNotCollidedIds = newNotCollided.map(obj => obj.objectId);
            // console.log(`Hand ${handIndex} ends collision with new Object ID: ${newNotCollidedIds.join(', ')}`);
        }        
    }

    /**
     * Custom utility functions
     */
    handleSelection(objectId, handId) {
        console.log(`SELECTED ${objectId} with hand ${handId}`);
        switch (objectId) {
            case 0:
                this.gameController.updateGamePhase(-1);
                break;
            case 1: 
                this.gameController.updateGamePhase(1);
                break;
        }
    }

    /**
     * Show selection text in the middle of the screen
     * @param {number} objectText just the text.
     */
    showSelectionText(objectText) {
        if (this.gameController.phase != 0)
            return;

        // console.log(this.selectedTextObject, this.selectedTextObject !== null);
        if (this.selectedTextObject !== null) {
            ScenesManager.scene.remove(this.selectedTextObject);
            this.gameController.objects = this.gameController.objects.filter(obj => obj !== this.selectedTextObject);
        }

        const selectedText = objectText;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512; // Width for the selection text
        canvas.height = 512; // Height for the selection text

        // Clear canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.font = 'Bold 24px Arial'; // Font for the selection text
        context.fillStyle = this.gameController.textColor; // Color for the selection text
        context.textAlign = 'center'; // Align text to the center
        context.textBaseline = 'middle'; // Align text to the middle

        // Draw the selection text
        context.fillText(selectedText, canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.premultiplyAlpha = true; // Enable proper alpha blending
        const textMaterial = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            alphaTest: 0.1 // Helps with transparency rendering
        });
        const textSprite = new THREE.Sprite(textMaterial);
        textSprite.position.set(0, 0, 0); // Position at the center of the screen
        textSprite.scale.set(1, 1, 1); // Scale to fit the screen

        ScenesManager.scene.add(textSprite);
        this.gameController.objects.push(textSprite);
        this.selectedTextObject = textSprite;
    }
}