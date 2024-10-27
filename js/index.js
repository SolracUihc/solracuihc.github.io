import * as THREE from "https://esm.sh/three";
import { Pane } from "https://esm.sh/tweakpane";
import { MediaPipeHands } from "./MediaPipeHands.js";
import { ScenesManager } from "./ScenesManager.js";

/**
 * App class initializes the 3D application, sets up scene, camera, 
 * hand tracking, and user interface controls.
 */
export class App {
  constructor() {
    // Initialize the GUI panel
    this.pane = new Pane();

    // Set up the scene, camera, and renderer
    ScenesManager.setup();

    // Build the scene with objects and controls
    this.build();

    // Check if webcam access is available
    if (this.hasGetUserMedia()) {
      const enableWebcamButton = document.getElementById("webcamButton");
      enableWebcamButton.addEventListener("click", (e) => {
        if (this.hasCamera) return; // Prevent multiple camera accesses
        e.preventDefault();
        this.hasCamera = true;

        // Initialize MediaPipeHands for hand tracking
        const videoElement = document.getElementById("inputVideo");
        this.mediaPipeHands = new MediaPipeHands(videoElement, (landmarks) =>
          this.onMediaPipeHandsResults(landmarks)
        );
        this.mediaPipeHands.start(); // Start the hand tracking
        enableWebcamButton.remove(); // Remove the button after enabling the camera
      });
    } else {
      console.warn("getUserMedia() is not supported by your browser");
    }

    // Set animation loop for rendering
    ScenesManager.renderer.setAnimationLoop(() => this.animate());
  }

  /**
   * Check if the browser supports getUserMedia for webcam access.
   * @returns {boolean} True if supported, false otherwise.
   */
  hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
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
   * Build the scene with a ground plane, objects, and hand controls.
   */
  async build() {
    // Create and configure the ground plane
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

    // Create a grid helper for visual reference
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

    // Create a cursor for hand control feedback
    const cursorMat = new THREE.MeshNormalMaterial({
      depthTest: false,
      depthWrite: false,
    });
    const cursor = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 32, 16), // Sphere geometry for cursor
      cursorMat
    );
    ScenesManager.scene.add(cursor); // Add cursor to the scene

    // Initialize hand controls with the cursor and objects
    this.handControls = new HandControls(
      cursor,
      this.objects,
      ScenesManager.renderer,
      ScenesManager.camera,
      ScenesManager.scene,
      false // Set draggable to false
    );

    // Set up GUI parameters for toggling landmark visibility and cursor visibility
    const PARAMS = {
      showLandmark: false,
      showCursor: true, // New parameter to control cursor visibility
    };

    // Binding for toggling landmark visibility
    this.pane.addBinding(PARAMS, "showLandmark").on("change", (ev) => {
      this.handControls.show3DLandmark(ev.value); // Update landmark visibility
    });

    // Binding for toggling cursor visibility
    this.pane.addBinding(PARAMS, "showCursor").on("change", (ev) => {
      cursor.visible = ev.value; // Update cursor visibility based on GUI toggle
    });

    // Remove dragging feature
    // this.handControls.addEventListener("drag_start", (event) => { ... });
    // this.handControls.addEventListener("drag_end", (event) => { ... });

    // Adjust cursor opacity based on collision
    this.handControls.addEventListener("collision", (event) => {
      cursorMat.opacity = event.state === "on" ? 0.4 : 1; // Adjust cursor opacity based on collision
      if (event.state === "on") {
        event.object.material.opacity = 0.4; // Maintain box opacity after collision
      }
    });

    // Set up resize event listener for responsive design
    window.addEventListener("resize", this.onWindowResize.bind(this), false);
  }

  /**
   * Animate the scene and update hand controls.
   */
  animate() {
    this.handControls?.animate(); // Animate hand controls if they exist

    // Move boxes towards the camera
    this.objects.forEach((box) => {
      box.position.z += 0.05; // Move box towards the camera

      // Check if the box has passed the camera
      if (box.position.z > 0) {
        // Reset the box to a far Z position with random X and Y
        box.position.z = -10; // Reset to far Z
        box.position.x = Math.random() * 2 - 1; // Randomize X position
        box.position.y = Math.random() * 0.5 - 0.25; // Randomize Y position
        box.material.opacity = 1; // Reset opacity when moved back to far Z
      }
    });

    ScenesManager.render(); // Render the scene
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

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => new App());
