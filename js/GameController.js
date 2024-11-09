/**
 * The Game Controller handles the game logic.
 */
import * as THREE from "https://esm.sh/three";
import { Pane } from "https://esm.sh/tweakpane";
import { HandControls } from "./HandControls.js";
import { ScenesManager } from "./ScenesManager.js";

export class GameController {
    constructor() {
        // Initialize the GUI panel
        this.pane = new Pane();
        this.game_start = false;
        this.phase = 0;
    }

    /**
     * Build the scene with a ground plane, objects, and hand controls.
     */
    async build() {

        // Setup the 3d scene
        this.build_environment();

        // Setup the cursor feedbacks
        this.setup_cursor_feedbacks();

        // Bind the GUI with options provided
        this.bind_gui();

        // Collision Detection
        this.setup_collision_detection();

        // Set up resize event listener for responsive design
        window.addEventListener("resize", this.onWindowResize.bind(this), false);

    }

    async build_environment() {
        // Ground Plane: Create
        const planeGeometry = new THREE.PlaneGeometry(100, 100);
        planeGeometry.rotateX(-Math.PI / 2); // Rotate plane to be horizontal
        const planeMaterial = new THREE.ShadowMaterial({
            color: 0x000000,
            opacity: 0.2, // Semi-transparent shadow
        });

        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.y = -1; // Position the plane slightly below the origin
        plane.receiveShadow = true; // Enable shadow reception
        ScenesManager.scene.add(plane); // Add plane to the scene

        // Ground Plane: Grid Helper
        const helper = new THREE.GridHelper(20, 10);
        helper.position.y = -0.9; // Position the grid slightly above the plane
        helper.material.opacity = 0.25; // Make the grid semi-transparent
        helper.material.transparent = true;
        ScenesManager.scene.add(helper); // Add grid helper to the scene

        // Create and position random objects in the scene
        this.objects = []; // Store references to the boxes
        const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15); // Box geometry for objects
        const object = new THREE.Mesh(
            geometry,
            new THREE.MeshNormalMaterial({ transparent: true })
        );

        /**
         * ===========================================================
         * ONLY FOR PRINTING CUBES, ETC (ENVIRONMENT)
         * ===========================================================
         */
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
            this.objects.push(_object); // Store reference to the object
        }
    }

    async setup_cursor_feedbacks() {
        // Create a cursor for hand control feedback
        this.cursorMat = new THREE.MeshNormalMaterial({
            depthTest: false,
            depthWrite: false,
        });
        const cursor = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 32, 16), // Sphere geometry for cursor
            this.cursorMat
        );
        ScenesManager.scene.add(cursor); // Add cursor to the scene

        // Initialize hand controls with the cursor and objects
        this.handControls = new HandControls(
            cursor,
            this.objects,
            ScenesManager.renderer,
            ScenesManager.camera,
            ScenesManager.scene,
            false // true // Set draggable to true
        );
    }

    async bind_gui() {
        /**
         * ===========================================================
         * GUI Options
         * ===========================================================
         */
        // Set up GUI parameters for toggling landmark visibility and cursor visibility
        const PARAMS = {
            showLandmark: true,
            showCursor: true, // New parameter to control cursor visibility
            gameStart: false,
        };

        // Binding for toggling landmark visibility
        this.handControls.show3DLandmark(true);
        this.pane.addBinding(PARAMS, "showLandmark").on("change", (ev) => {
            this.handControls.show3DLandmark(ev.value); // Update landmark visibility
        });

        // Binding for toggling cursor visibility
        this.pane.addBinding(PARAMS, "showCursor").on("change", (ev) => {
            cursor.visible = ev.value; // Update cursor visibility based on GUI toggle
        });

        // Binding for toggling game start/stop
        this.pane.addBinding(PARAMS, "gameStart").on("change", (ev) => {
            this.game_start = ev.value;
        });
    }
    
    async setup_collision_detection() {
        // Add event listeners for hand control interactions
        //this.handControls.addEventListener("drag_start", (event) => {
        //event.object.material.opacity = 0.4; // Change opacity on drag start 
        //});
        //this.handControls.addEventListener("drag_end", (event) => {
        //if (event.object) event.object.material.opacity = 1; // Reset opacity on drag end
        //event.callback(); // Execute callback after drag ends
        //});

        // Adjust cursor opacity based on collision
        this.handControls.addEventListener("collision", (event) => {
            this.cursorMat.opacity = event.state === "on" ? 0.4 : 1; // Adjust cursor opacity based on collision
        });
    }

    /**
     * Handle results from MediaPipeHands tracking.
     * @param {Object} landmarks - The detected hand landmarks.
     */
    onMediaPipeHandsResults(landmarks) {
        if (this.handControls) {
            this.handControls.update(landmarks); // Update hand controls with landmarks
        }
    }

    /**
     * Animate the scene and update hand controls.
     */
    animate() {
        this.handControls?.animate(); // Animate hand controls if they exist

        if (this.game_start) {
            switch (this.phase) {
                case 0:
                    this.game_phase_0();
                    break;
                default:
                    break;
            }
        }

        ScenesManager.render(); // Render the scene
    }

    game_phase_0() {
        // Move boxes towards the camera
        this.objects.forEach((box) => {
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

    /**
     * Handle window resize events to adjust camera and renderer.
     */
    onWindowResize() {
        ScenesManager.camera.aspect = window.innerWidth / window.innerHeight; // Update aspect ratio
        ScenesManager.camera.updateProjectionMatrix(); // Update projection matrix

        ScenesManager.renderer.setSize(window.innerWidth, window.innerHeight); // Resize renderer
    }
}