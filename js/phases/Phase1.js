import * as THREE from "https://esm.sh/three";
import { GameController } from "../GameController.js";
import { ScenesManager } from "../ScenesManager.js";

export class Phase1 {
    constructor(gameController) { //:GameController
        this.gameController = gameController;
        this.initialize();
    }

    initialize() {
        console.log("Initializing Phase 1");
        
        this.gameController.clearScreen();

        const boxSize = 0.2 // 0.15
        const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize); // Box geometry for objects
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

            ScenesManager.scene.add(_object); // Add object to the scene
            this.gameController.objects.push(_object); // Store reference to the object
        }

        this.gameController.reset_cursor_feedbacks();
        this.gameController.setup_collision_detection();
    }

    animate() {
        // Move boxes towards the camera
        this.gameController.objects.forEach((box) => {
            box.position.z += 0.05; // Move box towards the camera

            // Check if the box has passed the camera
            if (box.position.z > 2.5) {
                // Reset the box to a far Z position with random X and Y
                box.position.z = -10; // Reset to far Z
                box.position.x = Math.random() * 2 - 1; // Randomize X position
                box.position.y = Math.random() * 0.5 - 0.25; // Randomize Y position
                box.material.opacity = 1; // Reset opacity when moved back to far Z
            }
        });
    }
}