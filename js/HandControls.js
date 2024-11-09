import * as THREE from "three";

/**
 * HandControls class manages 3D hand gestures and interactions with objects.
 * It allows the user to control and manipulate objects in a 3D scene using hand movements.
 */
export class HandControls extends THREE.EventDispatcher {
  constructor(target, objects, renderer, camera, scene, isDraggable = false) {
    super();

    this.landmarkVisible = true;
    this.landmarkTheoreticallyVisible = true;

    // Initial setup
    this.target = target; // The cursor represented as an Object3D
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

    this.initializeObjects(objects);

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

  initializeObjects(objects) {
    this.objects = objects; // Array of objects that can be dragged

    // Initialize object collision status
    this.objects.forEach((obj) => (obj.userData.hasCollision = false));
  }

  /**
   * Display or hide the 3D hand landmark object.
   * @param {boolean} value - If true, make the landmark visible.
   */
  show3DLandmark(value) {
    this.landmarkVisible = value;
    this.show3DLandmark_(value);
  }

  show3DLandmark_(value) {
    if (!this.handsObj) {
      this.handsObj = new THREE.Object3D(); // Create a new 3D object for hands
      this.scene.add(this.handsObj); // Add it to the scene
      this.createHand(); // Create hand visuals
    }

    // Set the opacity of the hand landmark
    this.landmarkTheoreticallyVisible = value;
    this.sphereMat.opacity = value ? 1 : 0;
    this.target.visible = value;
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
    this.sphereMat = new THREE.MeshBasicMaterial({
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
    var visibility = landmarks.multiHandLandmarks.length >= 1;
    if (this.landmarkTheoreticallyVisible) {
      this.handDisappearTime = Date.now();
      this.landmarkTheoreticallyVisible = false;
    }
    if (visibility)
      this.show3DLandmark_(visibility);
    else if (Date.now() - this.handDisappearTime > 200)
      this.show3DLandmark_(visibility);

    const isMobile = window.innerWidth < window.innerHeight;
    this.clip_dist = isMobile ? 4 : 2; // THIS PART RELATES TO ScenesManager.js
    // The clip distance of the camera.

    if (landmarks.multiHandLandmarks.length >= 1) {
      if (this.handsObj) {
        // Update hand landmark positions based on detected coordinates
        /***
         * =========================================
         * The z axis is only for reference for now
         * Goal: Adjust the z axis (and scale x, y) 
         * according to the calculated estimated 
         * distance of hand to camera
         * =========================================
         */

        // let wrist_depth = 1;//Math.abs(landmarks.multiHandLandmarks[0][0].z);
        // wrist_depth: closer to screen -> larger value (1e-6 ~ 1e-7)
        // div 1E-6 -> 1 ~ 0

        /**
         * ======================
         *   DEPTH OF THE HAND
         * ======================
         */
        // Calculate distances for wrist depth
        const wrist = landmarks.multiHandLandmarks[0][0]; // Wrist (node 0)
        const pointsToCheck = [5, 9, 3, 17]; // Nodes to compare with
        const thumbIndex = 2; // Node 2 (thumb)

        let distances = pointsToCheck.map(index => {
          const point = landmarks.multiHandLandmarks[0][index];
          return Math.sqrt(Math.pow(wrist.x - point.x, 2) + Math.pow(wrist.y - point.y, 2) + Math.pow(wrist.z - point.z, 2));
        });

        // Calculate distance between landmark 2 (thumb) and 17
        const thumbToPoint17 = Math.sqrt(Math.pow(wrist.x - landmarks.multiHandLandmarks[0][thumbIndex].x, 2) +
          Math.pow(wrist.y - landmarks.multiHandLandmarks[0][thumbIndex].y, 2) +
          Math.pow(wrist.z - landmarks.multiHandLandmarks[0][thumbIndex].z, 2));

        // distances.push(thumbToPoint17); // Add the thumb to point 17 distance

        // Calculate the mean distance
        let palm_size_2d = distances.reduce((acc, val) => acc + val, 0) / distances.length;
        // console.log(palm_size_2d, thumbToPoint17, Math.max(palm_size_2d, thumbToPoint17*2));
        palm_size_2d = Math.max(palm_size_2d, thumbToPoint17 * 2);

        // console.log(palm_size_2d);
        // normalizes the hand size (visually)
        // palm_size: small -> far away from camera, large -> close to camera
        // always positive.
        let depth2 = this.palmSizeToDepth(palm_size_2d);

        /**
         * ===============================
         *   POSITION AND COLOR OF HAND 
         * ===============================
         */

        for (let l = 0; l < 21; l++) {
          let xpos = -landmarks.multiHandLandmarks[0][l].x + 0.5;
          let ypos = -landmarks.multiHandLandmarks[0][l].y + 0.5;
          let depth = landmarks.multiHandLandmarks[0][l].z;

          this.handsObj.children[l].position.x = xpos / depth2//(wrist_depth/1E-6)*.2;
          this.handsObj.children[l].position.y = ypos / depth2//(wrist_depth/1E-6)*.2;
          this.handsObj.children[l].position.z = depth - (depth2) / 2;
          this.handsObj.children[l].position.multiplyScalar(4); // Scale positions
          // console.log(this.handsObj.children[l].position.z);
          // Set color based on depth
          // -10 ~ 1
          this.handsObj.children[l].material.color.set(this.depthToColor(this.handsObj.children[l].position.z));
        }

        // // Calculate gesture points
        this.calculateGestures(this.handsObj);

        // Check for closed fist gesture
        const node0Pos = this.handsObj.children[0].position;
        const node9Pos = this.handsObj.children[9].position;
        const node12Pos = this.handsObj.children[12].position;
        const palmFingerRatio = node12Pos.clone().sub(node0Pos).length() / node9Pos.clone().sub(node0Pos).length();
        console.log(palmFingerRatio);
        this.closedFist = palmFingerRatio < 1.3; // Threshold for closed fist
        // console.log(this.closedFist);

        // Update target position based on gesture
        this.updateTargetPosition();

        // Dispatch events based on gesture state
        this.handleGestureEvents();
      }
    }
  }

  /**
   * Calculate the color corresponding to the depth
   */
  depthToColor(depth) {
    const normalizedDepth = THREE.MathUtils.clamp((depth + 12) / 16, 0, 1); // Adjust this based on your scene scale
    const color = new THREE.Color();
    color.setRGB(1 - normalizedDepth, 0, normalizedDepth); // Blue to red gradient
    return color;
  }

  /**
   * Calibration function
   */
  palmSizeToDepth(palm_size_2d) {
    return palm_size_2d * 10;
  }

  /**
   * Calculate gesture positions based on landmarks.
   * @param {Array} landmarks - The array of landmark positions.
   */
  calculateGestures(landmarks) {
    // Calculate positions for gesture control
    this.gestureCompute.depthFrom.set(
      -landmarks.children[0].position.x,
      -landmarks.children[0].position.y,
      -landmarks.children[0].position.z
    ).multiplyScalar(4);

    this.gestureCompute.depthTo.set(
      -landmarks.children[10].position.x,
      -landmarks.children[10].position.y,
      -landmarks.children[10].position.z
    ).multiplyScalar(4);

    this.gestureCompute.from.set(
      -landmarks.children[9].position.x,
      -landmarks.children[9].position.y,
      -landmarks.children[9].position.z
    ).multiplyScalar(4);

    this.gestureCompute.to.set(
      -landmarks.children[12].position.x,
      -landmarks.children[12].position.y,
      -landmarks.children[12].position.z
    ).multiplyScalar(4);
  }

  /**
   * Update the target position based on gesture calculations.
   * [THE BALL / SPHERE]
   */
  updateTargetPosition() {
    // Convert landmark positions to screen depth
    const indices = [0, 5, 9, 3, 17, 2]; // Indices of points to consider
    let sumX = 0, sumY = 0, sumZ = 0;
    indices.forEach(index => {
      sumX += this.handsObj.children[index].position.x;
      sumY += this.handsObj.children[index].position.y;
      sumZ += this.handsObj.children[index].position.z;
    });
    const numPoints = indices.length;
    this.target.position.set(
      sumX / numPoints,
      sumY / numPoints,
      sumZ / numPoints
    );
  }

  /**
   * Handle events based on the state of the hand gestures.
   */
  handleGestureEvents() {
    if (this.closedFist) {
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
