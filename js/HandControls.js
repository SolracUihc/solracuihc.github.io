import * as THREE from "three";
import { ScenesManager } from "./ScenesManager.js";

/**
 * HandControls class manages 3D hand gestures and interactions with objects.
 * It allows the user to control and manipulate objects in a 3D scene using hand movements.
 */
export class HandControls extends THREE.EventDispatcher {
  constructor(objects, renderer, camera, scene, isDraggable = false) {
    super();

    this.landmarkVisible = true;
    this.landmarkTheoreticallyVisible = true;

    // Initial setup
    this.target = []; // The cursor represented as an Object3D
    this.isDraggable = isDraggable; // Determines if objects can be dragged
    this.renderer = renderer; // The WebGL renderer
    this.camera = camera; // The camera used to view the scene
    this.scene = scene; // The 3D scene where objects are added

    // Set up matrices and vectors for calculations
    this.viewProjectionMatrix = new THREE.Matrix4();
    this.objectBox3 = new THREE.Box3();
    this.targetBox3 = [new THREE.Box3()]; // Make targetBox3 a list
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

    // Array to store hand objects
    this.handsObjs = [];
    this.closedFist = []; // Initialize closedFist as array
    this.selected = []; // Initialize selected as array
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
    // Create material if it doesn't exist
    if (!this.sphereMat) {
      this.sphereMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: value ? 1 : 0,
      });
    }

    this.landmarkTheoreticallyVisible = value;
    this.sphereMat.opacity = value ? 1 : 0;
    this.target.forEach(t => t.opacity = value);
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
   * Create visual representations of a single hand using spheres.
   */
  createHand() {
    const handObj = new THREE.Object3D();
    this.scene.add(handObj);

    // Geometry for hand representation
    const sphereGeo = new THREE.SphereGeometry(0.025, 8, 4);

    // Create 21 spheres for each hand landmark
    for (let i = 0; i < 21; i++) {
      const sphereMesh = new THREE.Mesh(sphereGeo, this.sphereMat);
      sphereMesh.renderOrder = 2; // Ensure correct rendering order
      handObj.add(sphereMesh);
    }
    return handObj;
  }

  createTarget() {
    // Create a cursor for hand control feedback
    const cursorMat = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 1
    });

    const cursor = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 32, 16), // Sphere geometry for cursor
        cursorMat
    );
    ScenesManager.scene.add(cursor); // Add cursor to the scene

    return cursor;
  }

  /**
   * Update the hand positions based on detected landmarks.
   * @param {Object} landmarks - The detected hand landmarks.
   */
  update(landmarks) {
    const numHands = landmarks.multiHandLandmarks.length;
    var visibility = numHands >= 1;
    
    if (this.landmarkTheoreticallyVisible) {
      this.handDisappearTime = Date.now();
      this.landmarkTheoreticallyVisible = false;
    }
    if (visibility)
      this.show3DLandmark_(visibility);
    else if (Date.now() - this.handDisappearTime > 200)
      this.show3DLandmark_(visibility);

    // Adjust number of hand objects based on detected hands
    while (this.handsObjs.length < numHands) {
      this.handsObjs.push(this.createHand());
      this.target.push(this.createTarget());
      this.targetBox3.push(new THREE.Box3());
      this.closedFist.push(false);
      this.selected.push(null);
    }
    while (this.handsObjs.length > numHands) {
      const handObj = this.handsObjs.pop();
      this.scene.remove(handObj);
      this.scene.remove(this.target.pop());
      this.targetBox3.pop();
      this.closedFist.pop();
      this.selected.pop();
    }

    const isMobile = window.innerWidth < window.innerHeight;
    this.clip_dist = isMobile ? 4 : 2;

    if (numHands >= 1) {
      // console.log(numHands);
      landmarks.multiHandLandmarks.forEach((handLandmarks, handIndex) => {
        const handObj = this.handsObjs[handIndex];

        // Calculate palm size and depth for this hand
        const wrist = handLandmarks[0];
        const pointsToCheck = [5, 9, 3, 17];
        const thumbIndex = 2;

        let distances = pointsToCheck.map(index => {
          const point = handLandmarks[index];
          return Math.sqrt(Math.pow(wrist.x - point.x, 2) + Math.pow(wrist.y - point.y, 2) + Math.pow(wrist.z - point.z, 2));
        });

        const thumbToPoint17 = Math.sqrt(Math.pow(wrist.x - handLandmarks[thumbIndex].x, 2) +
          Math.pow(wrist.y - handLandmarks[thumbIndex].y, 2) +
          Math.pow(wrist.z - handLandmarks[thumbIndex].z, 2));

        let palm_size_2d = distances.reduce((acc, val) => acc + val, 0) / distances.length;
        palm_size_2d = Math.max(palm_size_2d, thumbToPoint17 * 2);

        let depth2 = this.palmSizeToDepth(palm_size_2d);

        // Update landmark positions for this hand
        for (let l = 0; l < 21; l++) {
          let xpos = -handLandmarks[l].x + 0.5;
          let ypos = -handLandmarks[l].y + 0.5;
          let depth = handLandmarks[l].z;

          handObj.children[l].position.x = xpos / depth2;
          handObj.children[l].position.y = ypos / depth2;
          handObj.children[l].position.z = depth - (depth2) / 2;
          handObj.children[l].position.multiplyScalar(4);
          handObj.children[l].material.color.set(this.depthToColor(handObj.children[l].position.z));
        }

        // Gestures and target updates
        this.calculateGestures(handObj);

        const node0Pos = handObj.children[0].position;
        const node9Pos = handObj.children[9].position;
        const node12Pos = handObj.children[12].position;
        const palmFingerRatio = node12Pos.clone().sub(node0Pos).length() / node9Pos.clone().sub(node0Pos).length();
        this.closedFist[handIndex] = palmFingerRatio < 1.3;

        this.updateTargetPosition(handObj, handIndex);
        this.handleGestureEvents(handIndex);
      });
    }
  }

  /**
   * Calculate the color corresponding to the depth
   */
  depthToColor(depth) {
    const normalizedDepth = THREE.MathUtils.clamp((depth + 12) / 16, 0, 1);
    const color = new THREE.Color();
    color.setRGB(1 - normalizedDepth, 0, normalizedDepth);
    return color;
  }

  /**
   * Calibration function
   */
  palmSizeToDepth(palm_size_2d) {
    return palm_size_2d * 10 + .5;
  }

  /**
   * Calculate gesture positions based on landmarks.
   * @param {Object} handObj - The hand object containing landmarks.
   */
  calculateGestures(handObj) {
    this.gestureCompute.depthFrom.set(
      -handObj.children[0].position.x,
      -handObj.children[0].position.y,
      -handObj.children[0].position.z
    ).multiplyScalar(4);

    this.gestureCompute.depthTo.set(
      -handObj.children[10].position.x,
      -handObj.children[10].position.y,
      -handObj.children[10].position.z
    ).multiplyScalar(4);

    this.gestureCompute.from.set(
      -handObj.children[9].position.x,
      -handObj.children[9].position.y,
      -handObj.children[9].position.z
    ).multiplyScalar(4);

    this.gestureCompute.to.set(
      -handObj.children[12].position.x,
      -handObj.children[12].position.y,
      -handObj.children[12].position.z
    ).multiplyScalar(4);
  }

  /**
   * Update the target position based on gesture calculations.
   * [THE BALL / SPHERE]
   */
  updateTargetPosition(handObj, handIndex) {
    const indices = [0, 5, 9, 3, 17, 2];
    let sumX = 0, sumY = 0, sumZ = 0;
    indices.forEach(index => {
      sumX += handObj.children[index].position.x;
      sumY += handObj.children[index].position.y;
      sumZ += handObj.children[index].position.z;
    });
    const numPoints = indices.length;
    this.target[handIndex].position.set(
      sumX / numPoints,
      sumY / numPoints,
      sumZ / numPoints
    );
  }

  /**
   * Handle events based on the state of the hand gestures.
   */
  handleGestureEvents(handIndex) {
    if (this.closedFist[handIndex]) {
      this.dispatchEvent({ type: "closed_fist", handIndex: handIndex });
      this.dispatchEvent({
        type: "drag_end",
        object: this.selected[handIndex],
        callback: () => {
          this.selected[handIndex] = null;
        },
      });
    } else {
      this.selected[handIndex] = null;
      this.dispatchEvent({ type: "opened_fist", handIndex: handIndex });
    }
  }

  /**
   * Animate the objects based on hand gestures and collisions.
   */
  animate() {
    if (!this.target) return;

    // reset status
    this.objects.forEach((obj) => {
      obj.material.opacity = 1;
    })

    // Check collisions with objects
    this.target.forEach((target, handIndex) => {
      this.targetBox3[handIndex].setFromObject(target);
      this.objects.forEach((obj) => {
        this.objectBox3.setFromObject(obj);
        const targetCollision = this.targetBox3[handIndex].intersectsBox(this.objectBox3);

        if (targetCollision) {
          obj.userData.hasCollision = true;
          if (this.closedFist[handIndex] && !this.selected[handIndex] && this.isDraggable) {
            this.selected[handIndex] = obj;
            this.dispatchEvent({ type: "drag_start", object: obj, handIndex: handIndex });
          }
          this.dispatchEvent({ type: "collision", state: "on", object: obj, handIndex: handIndex });
          obj.material.opacity = 0.4;
        } else {
          if (!this.selected.some(s => s !== null)) {
            this.dispatchEvent({ type: "collision", state: "off", object: null, handIndex: handIndex });
          }
        }
      });

      // Move the selected object if the fist is closed
      if (this.selected[handIndex] && this.closedFist[handIndex] && this.isDraggable) {
        this.selected[handIndex].position.lerp(target.position, 0.3);
      }
    });
  }
}
