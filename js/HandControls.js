import * as THREE from "three";

/**
 * HandControls class manages 3D hand gestures and interactions with objects.
 * It allows the user to control and manipulate objects in a 3D scene using hand movements.
 */
export class HandControls extends THREE.EventDispatcher {
  constructor(target, objects, renderer, camera, scene, isDraggable = false) {
    super();

    // Initial setup
    this.target = target; // The cursor represented as an Object3D
    this.objects = objects; // Array of objects that can be dragged
    this.isDraggable = isDraggable; // Determines if objects can be dragged
    this.renderer = renderer; // The WebGL renderer
    this.camera = camera; // The camera used to view the scene
    this.scene = scene; // The 3D scene where objects are added

    // Set up matrices and vectors for calculations
    this.viewProjectionMatrix = new THREE.Matrix4();
    this.objectBox3 = new THREE.Box3();
    this.targetBox3 = new THREE.Box3();
    this.depthPointA = new THREE.Vector3();
    this.depthPointB = new THREE.Vector3();
    
    // Reference objects to calculate depth
    this.refObjFrom = new THREE.Object3D();
    this.scene.add(this.refObjFrom);
    this.refObjTo = new THREE.Object3D();
    this.scene.add(this.refObjTo);

    // Initialize object collision status
    this.objects.forEach((obj) => (obj.userData.hasCollision = false));

    // Variables for hand gesture calculations
    this.pointsDist = 0;
    this.distanceToGrab = 0.25;
    this.gestureCompute = {
      depthFrom: new THREE.Vector3(),
      depthTo: new THREE.Vector3(),
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
    };
  }

  /**
   * Display or hide the 3D hand landmark object.
   * @param {boolean} value - If true, make the landmark visible.
   */
  show3DLandmark(value) {
    if (!this.handsObj) {
      this.handsObj = new THREE.Object3D(); // Create a new 3D object for hands
      this.scene.add(this.handsObj); // Add it to the scene
      this.createHand(); // Create hand visuals
    }

    // Set the opacity of the hand landmark
    this.sphereMat.opacity = value ? 1 : 0;
  }

  /**
   * Convert a 3D object position to 2D screen coordinates.
   * @param {THREE.Object3D} object - The 3D object to project onto the screen.
   * @returns {Object} The 2D coordinates (x, y) of the object.
   */
  to2D(object) {
    if (!this.renderer) {
      console.error("A valid renderer must be used.");
      return;
    }

    // Get dimensions of the rendering canvas
    const rect = this.renderer.domElement.getBoundingClientRect();
    const widthHalf = rect.width / 2;
    const heightHalf = rect.height / 2;

    // Create a vector and apply the view projection matrix
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(object.matrixWorld);
    vector.applyMatrix4(this.viewProjectionMatrix);

    // Return 2D screen coordinates
    return {
      x: vector.x * widthHalf + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf,
    };
  }

  /**
   * Create visual representations of the hand using spheres.
   */
  createHand() {
    // Create a material for hand spheres
    this.sphereMat = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: this.showLandmark ? 1 : 0,
    });

    // Geometry for hand representation
    const sphereGeo = new THREE.SphereGeometry(0.025, 8, 4);
    const sphereMesh = new THREE.Mesh(sphereGeo, this.sphereMat);

    // Clone spheres to represent different hand landmarks
    for (let i = 0; i < 21; i++) {
      const sphereMeshClone = sphereMesh.clone();
      sphereMeshClone.renderOrder = 2; // Ensure correct rendering order
      this.handsObj.add(sphereMeshClone); // Add the sphere to the hand object
    }
  }

/**
 * Update the hand positions based on detected landmarks.
 * @param {Object} landmarks - The detected hand landmarks.
 */
update(landmarks) {
  if (landmarks.multiHandLandmarks.length === 1) {
    if (this.handsObj) {
      const numLandmarks = 21;
      let meanX = 0, meanY = 0, meanZ = 0;

      // Calculate the mean of the coordinates
      for (let l = 0; l < numLandmarks; l++) {
        meanX += landmarks.multiHandLandmarks[0][l].x;
        meanY += landmarks.multiHandLandmarks[0][l].y;
        meanZ += landmarks.multiHandLandmarks[0][l].z;
      }
      meanX /= numLandmarks;
      meanY /= numLandmarks;
      meanZ /= numLandmarks;

      // Calculate the variance of the coordinates
      let varianceX = 0, varianceY = 0, varianceZ = 0, varianceMean = 0;
      for (let l = 0; l < numLandmarks; l++) {
        varianceX += Math.pow(landmarks.multiHandLandmarks[0][l].x - meanX, 2);
        varianceY += Math.pow(landmarks.multiHandLandmarks[0][l].y - meanY, 2);
        varianceZ += Math.pow(landmarks.multiHandLandmarks[0][l].z - meanZ, 2);
      }
      varianceX /= numLandmarks;
      varianceY /= numLandmarks;
      varianceZ /= numLandmarks;
      varianceMean = (varianceX+varianceY+varianceZ) * 64

      // Update hand landmark positions based on detected coordinates
      for (let l = 0; l < numLandmarks; l++) {
        this.handsObj.children[l].position.x =
          (-landmarks.multiHandLandmarks[0][l].x + 0.5) / varianceMean;
        this.handsObj.children[l].position.y =
          (-landmarks.multiHandLandmarks[0][l].y + 0.5) / varianceMean;
        this.handsObj.children[l].position.z =
          landmarks.multiHandLandmarks[0][l].z / varianceZ / 64; // Assuming you want to apply variance to z as well
        // Apply scaling based on distance
        this.handsObj.children[l].position.multiplyScalar(4); // Scale positions
      }
    }

    // Calculate gesture points
    this.calculateGestures(landmarks.multiHandLandmarks[0]);

    // Check for closed fist gesture
    const pointsDist = this.gestureCompute.from.distanceTo(this.gestureCompute.to);
    this.closedFist = pointsDist < 0.35; // Threshold for closed fist

    // Update target position based on gesture
    this.updateTargetPosition();

    // Dispatch events based on gesture state
    this.handleGestureEvents();
  }
}


  /**
   * Calculate gesture positions based on landmarks.
   * @param {Array} landmarks - The array of landmark positions.
   */
  calculateGestures(landmarks) {
    // Calculate positions for gesture control
    this.gestureCompute.depthFrom.set(
      -landmarks[0].x + 0.5,
      -landmarks[0].y + 0.5,
      -landmarks[0].z
    ).multiplyScalar(4);

    this.gestureCompute.depthTo.set(
      -landmarks[10].x + 0.5,
      -landmarks[10].y + 0.5,
      -landmarks[10].z
    ).multiplyScalar(4);

    this.gestureCompute.from.set(
      -landmarks[9].x + 0.5,
      -landmarks[9].y + 0.5,
      -landmarks[9].z
    ).multiplyScalar(4);

    this.gestureCompute.to.set(
      -landmarks[12].x + 0.5,
      -landmarks[12].y + 0.5,
      -landmarks[12].z
    ).multiplyScalar(4);
  }

  /**
   * Update the target position based on gesture calculations.
   */
  updateTargetPosition() {
    // Convert landmark positions to screen depth
    this.refObjFrom.position.copy(this.gestureCompute.depthFrom);
    const depthA = this.to2D(this.refObjFrom);
    this.depthPointA.set(depthA.x, depthA.y);

    this.refObjTo.position.copy(this.gestureCompute.depthTo);
    const depthB = this.to2D(this.refObjTo);
    this.depthPointB.set(depthB.x, depthB.y);

    // Calculate distance for depth movement
    const depthDistance = this.depthPointA.distanceTo(this.depthPointB);
    this.depthZ = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(depthDistance, 0, 1000, -3, 5),
      -2,
      4
    );

    // Set target position based on gestures
    this.target.position.set(
      this.gestureCompute.from.x,
      this.gestureCompute.from.y,
      -this.depthZ
      // this.depthZ
    );
  }

  /**
   * Handle events based on the state of the hand gestures.
   */
  handleGestureEvents() {
    if (!this.closedFist) {
      this.dispatchEvent({ type: "closed_fist" });
      this.dispatchEvent({
        type: "drag_end",
        object: this.selected,
        callback: () => {
          this.selected = null; // Reset selected object
        },
      });
    } else {
      this.selected = null; // No object selected
      this.dispatchEvent({ type: "opened_fist" });
    }
  }

  /**
   * Animate the objects based on hand gestures and collisions.
   */
  animate() {
    if (!this.target) return; // Exit if no target

    // Check collisions with objects
    this.targetBox3.setFromObject(this.target);
    this.objects.forEach((obj) => {
      this.objectBox3.setFromObject(obj);
      const targetCollision = this.targetBox3.intersectsBox(this.objectBox3);
      
      if (targetCollision) {
        obj.userData.hasCollision = true; // Mark as collided
        if (this.closedFist && !this.selected && this.isDraggable) {
          this.selected = obj; // Select object for dragging
          this.dispatchEvent({ type: "drag_start", object: obj });
        }
        this.dispatchEvent({ type: "collision", state: "on", object: obj });
        obj.material.opacity = 0.4; // Change opacity on collision
      } else {
        obj.material.opacity = 1; // Reset opacity if no collision
        if (!this.selected) {
          this.dispatchEvent({ type: "collision", state: "off", object: null });
        }
      }
    });

    // Move the selected object if the fist is closed
    if (this.selected && this.closedFist && this.isDraggable) {
      this.selected.position.lerp(this.target.position, 0.3); // Smoothly move the object
    }
  }
}
