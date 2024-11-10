/**
 * The Game Controller handles the game logic.
 */
import * as THREE from "https://esm.sh/three";
import { Pane } from "https://esm.sh/tweakpane";
import { HandControls } from "./HandControls.js";
import { ScenesManager } from "./ScenesManager.js";
import { SelectionMenu } from "./phases/SelectionMenu.js";
import { Phase1 } from "./phases/Phase1.js"; 
import { TestPhase } from "./phases/TestPhase.js";

export class GameController {
    constructor() {
        // Initialize the GUI panel
        this.pane = new Pane();
        this.gameStart = false;
        this.phase = 0;
        this.gameHandler = null;

        this.prevUpdate = Date.now() * 0.0001;
    }

    /**
     * Build the scene with a ground plane, objects, and hand controls.
     */
    async build() {

        // Setup the 3d scene
        this.build_environment();

        // Setup the cursor feedbacks
        this.setup_hand_controls();

        // Bind the GUI with options provided
        this.bind_gui();

        // Listen to hand gestures
        this.setupGestureListeners();

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
    }

    async setup_hand_controls() {
        // Initialize hand controls with the cursor and objects
        this.handControls = new HandControls(
            this.objects,
            ScenesManager.renderer,
            ScenesManager.camera,
            ScenesManager.scene,
            false // true // Set draggable to true
        );
    }

    async reset_cursor_feedbacks() {
        this.handControls.initializeObjects(this.objects);
    }

    async bind_gui() {
        /**
         * ===========================================================
         * GUI Options
         * ===========================================================
         */
        // Set up GUI parameters for toggling landmark visibility, cursor visibility, close mode, and hand distance
        const PARAMS = {
            showLandmark: true,
            showCursor: true, // New parameter to control cursor visibility
            enterPhase1: false,
            closeMode: true, // New parameter to control close mode
            handDistance: 0 // New parameter to control hand distance
        };

        // Binding for toggling landmark visibility
        this.handControls.show3DLandmark(true);
        this.pane.addBinding(PARAMS, "showLandmark").on("change", (ev) => {
            this.handControls.show3DLandmark(ev.value); // Update landmark visibility
        });

        // Binding for toggling cursor visibility
        this.pane.addBinding(PARAMS, "showCursor").on("change", (ev) => {
            this.handControls.target.forEach(target => {
                target.visible = ev.value; // Update cursor visibility based on GUI toggle
            });
        });

        // Binding for toggling game start/stop
        this.pane.addButton({
            title: "Back to Menu"
        }).on("click", () => {this.updateGamePhase(0)});

        // Binding for close mode control
        this.handControls.handOffsetZDistance = -1.5;
        this.pane.addBinding(PARAMS, "closeMode").on("change", (ev) => {
            this.handControls.handOffsetZDistance = ev.value ? -1.5 : 0; // Update hand distance based on close mode
        });

        // Add a bar to display the target position Z value with annotation on the GUI
        // this.pane.addBinding({
        //     get z() {
        //         return this.handControls?.target[0]?.position?.z || 0;
        //     }
        // }, 'z', {
        //     readonly: true,
        //     view: 'graph',
        //     min: -20,
        //     max: 0,
        // });
        
        // addInput(this.handControls.target.position, 'z', { label: 'Target Z Position', min: -10, max: 10 });
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
            this.handControls.target[event.handIndex].material.opacity = event.state === "on" ? 0.4 : 1; // Adjust cursor opacity based on collision
            this.gameHandler.handleCollision("collision", event);
        });
    }

    onMediaPipeHandsResults(landmarks) {
        if (this.handControls) {
            this.handControls.update(landmarks); // Update hand controls with landmarks
        }
    }

    setupGestureListeners() {
        this.handControls.addEventListener("closed_fist", (ev) => {
            // console.log('Closed Fist', ev.handIndex);
            this.handControls.target[ev.handIndex].material.opacity = .4;
            this.gameHandler.handleGesture("closed_fist", ev.handIndex);
        });

        this.handControls.addEventListener("opened_fist", (ev) => {
            // console.log('Opened Fist', ev.handIndex);
            this.handControls.target[ev.handIndex].material.opacity = 1;
            this.gameHandler.handleGesture("opened_fist", ev.handIndex);
        });
    }

    /**
     * Animate the scene and update hand controls.
     */
    animate() {
        this.currUpdate = Date.now() * 0.0001;
        this.frameTime = this.currUpdate - this.prevUpdate;
        
        this.handControls?.animate(); // Animate hand controls if they exist

        if (this.gameStart && this.gameHandler) {
            this.gameHandler.animate();
        }

        ScenesManager.render(); // Render the scene
        this.prevUpdate = this.currUpdate;
    }

    clearScreen() {
        // Remove all boxes from the scene
        this.objects.forEach(box => {
            ScenesManager.scene.remove(box); // Remove each box from the scene
        });
        this.objects = []; // Clear the array of boxes
    }

    /**
     * Handle window resize events to adjust camera and renderer.
     */
    onWindowResize() {
        ScenesManager.camera.aspect = window.innerWidth / window.innerHeight; // Update aspect ratio
        ScenesManager.camera.updateProjectionMatrix(); // Update projection matrix

        ScenesManager.renderer.setSize(window.innerWidth, window.innerHeight); // Resize renderer
    }

    playIntro() {
        this.updateGamePhase(0);
        this.startGame();
    }

    startGame() {
        this.gameStart = true; // Set the game to start
    }

    updateGamePhase(phase) {
        this.phase = phase;
        if (this.gameHandler)
            this.gameHandler.cleanUp();

        switch (phase) {
            case -1:
                this.gameHandler = new TestPhase(this);
                break;
            case 0: 
                this.gameHandler = new SelectionMenu(this);
                break;
            case 1:
                this.gameHandler = new Phase1(this);
                break;
            default:
                this.gameHandler = null;
                break;
        }
    }
}