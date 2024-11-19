export class HandAnimator extends THREE.EventDispatcher {
    constructor(scene, settings) {
        super();
        this.scene = scene;

        // Scale and offset parameters
        this.distScale = settings?.distScale ?? 6;
        this.handScale = settings?.handScale ?? 6;
        this.depthScale = settings?.depthScale ?? 1;

        // Hands
        this.hands = [
            { meshes: [], lines: [] },
            { meshes: [], lines: [] }
        ];
        this.connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],           // thumb
            [0, 5], [5, 6], [6, 7], [7, 8],           // index
            [0, 9], [9, 10], [10, 11], [11, 12],      // middle
            [0, 13], [13, 14], [14, 15], [15, 16],    // ring
            [0, 17], [17, 18], [18, 19], [19, 20],    // pinky
            [5, 9], [9, 13], [13, 17]                 // palm
        ];

        // Materials for each hand
        this.materials = [
            {
                joint: new THREE.MeshStandardMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.8,
                    roughness: 0.3,
                    metalness: 0.2,
                    shadowSide: THREE.FrontSide
                }),
                line: new THREE.LineBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.5,
                    linewidth: 2
                })
            },
            {
                joint: new THREE.MeshStandardMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.8,
                    roughness: 0.3,
                    metalness: 0.2,
                    shadowSide: THREE.FrontSide
                }),
                line: new THREE.LineBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.5,
                    linewidth: 2
                })
            }
        ];

        // Geometry for joints
        this.jointGeometry = new THREE.SphereGeometry(0.012*this.handScale, 16, 16);

        // Gesture detection properties
        this.targets = [];
        this.closedFists = [false, false];
        this.selected = [null, null];
        this.gestureCompute = {
            depthFrom: new THREE.Vector3(),
            depthTo: new THREE.Vector3(),
            from: new THREE.Vector3(),
            to: new THREE.Vector3(),
        };
        this.distanceToGrab = 0.25;

        // Initialize hand meshes and targets
        this.initializeHandMeshes();
        this.initializeTargets();
    }

    initializeTargets() {
        for (let i = 0; i < 2; i++) {
            const cursorMat = new THREE.MeshStandardMaterial({
                color: this.materials[i].joint.color,
                transparent: true,
                opacity: 0.8,
                roughness: 0.3,
                metalness: 0.2
            });

            const cursor = new THREE.Mesh(
                new THREE.SphereGeometry(0.03*this.handScale, 32, 16),
                cursorMat
            );
            cursor.castShadow = true;
            cursor.visible = false;
            this.scene.add(cursor);
            this.targets.push(cursor);
        }
    }

    initializeHandMeshes() {
        // Create meshes for each hand
        for (let h = 0; h < 2; h++) {
            // Create 21 joints (landmarks) for each hand
            for (let i = 0; i < 21; i++) {
                const joint = new THREE.Mesh(this.jointGeometry, this.materials[h].joint.clone());
                joint.visible = false;
                joint.castShadow = true;
                joint.receiveShadow = false;
                this.scene.add(joint);
                this.hands[h].meshes.push(joint);
            }

            // Create connections between joints for each hand
            for (const connection of this.connections) {
                const geometry = new THREE.BufferGeometry();
                const line = new THREE.Line(geometry, this.materials[h].line.clone());
                line.visible = false;
                this.scene.add(line);
                this.hands[h].lines.push(line);
            }
        }
    }

    calculateGestures(handIndex, landmarks) {
        const hand = this.hands[handIndex];
        
        // Calculate palm-finger ratio for fist detection
        const node0Pos = hand.meshes[0].position;
        const node9Pos = hand.meshes[9].position;
        const node12Pos = hand.meshes[12].position;
        const palmFingerRatio = node12Pos.clone().sub(node0Pos).length() / 
                               node9Pos.clone().sub(node0Pos).length();
        
        // Update fist state
        const wasClosed = this.closedFists[handIndex];
        this.closedFists[handIndex] = palmFingerRatio < 1.3;
        
        // Emit events on state change
        if (this.closedFists[handIndex] !== wasClosed) {
            if (this.closedFists[handIndex]) {
                this.dispatchEvent({ type: "closed_fist", handIndex });
            } else {
                this.dispatchEvent({ type: "opened_fist", handIndex });
                if (this.selected[handIndex]) {
                    this.dispatchEvent({
                        type: "drag_end",
                        object: this.selected[handIndex],
                        handIndex
                    });
                    this.selected[handIndex] = null;
                }
            }
        }

        // Update target position (hand center)
        const indices = [0, 0, 0, 5, 9, 13, 17];
        let sumX = 0, sumY = 0, sumZ = 0;
        indices.forEach(index => {
            sumX += hand.meshes[index].position.x;
            sumY += hand.meshes[index].position.y;
            sumZ += hand.meshes[index].position.z;
        });
        const numPoints = indices.length;
        this.targets[handIndex].position.set(
            sumX / numPoints,
            sumY / numPoints,
            sumZ / numPoints
        );
        this.targets[handIndex].visible = true;
    }

    updateHandPosition(handsData) {
        // Hide all hands first
        this.hideAllHands();

        // Update each detected hand
        handsData.forEach((handData, handIndex) => {
            if (handIndex >= 2) return; // Only handle up to 2 hands

            const hand = this.hands[handIndex];
            const landmarks = handData.landmarks;
            const depth = handData.depth;
            const depth2Offset = handData.depth2Offset;
            const wrist = handData.wrist;

            // Update joint positions
            for (let i = 0; i < landmarks.length; i++) {
                const landmark = landmarks[i];
                const mesh = hand.meshes[i];
                
                // Convert coordinates to Three.js space
                // Flip X coordinate to match mirrored webcam view
                // console.log(landmark, depth, wrist, handData, landmark.x/depth-wrist.x);

                let x = -landmark.x + .5;
                let y = -landmark.y + .5;
                let z = landmark.z;

                let wristX = -wrist.x + .5;
                let wristY = -wrist.y + .5;

                // console.log(landmark.x);

                x = (x-wristX)/depth*this.handScale+this.distScale*wristX;
                y = (y-wristY)/depth*this.handScale+this.distScale*wristY;
                z = z-depth2Offset*this.depthScale;

                mesh.position.set(x, y, z);
                mesh.visible = true;
            }

            // Update connections
            for (let i = 0; i < this.connections.length; i++) {
                const [startIdx, endIdx] = this.connections[i];
                const startPos = hand.meshes[startIdx].position;
                const endPos = hand.meshes[endIdx].position;

                const geometry = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
                hand.lines[i].geometry.dispose();
                hand.lines[i].geometry = geometry;
                hand.lines[i].visible = true;
            }

            // Calculate gestures
            this.calculateGestures(handIndex, landmarks);
        });
    }

    hideAllHands() {
        this.hands.forEach(hand => {
            hand.meshes.forEach(mesh => mesh.visible = false);
            hand.lines.forEach(line => line.visible = false);
        });
        this.targets.forEach(target => target.visible = false);
    }

    checkCollisions(objects) {
        if (!objects || !objects.length) return;

        // Reset object states
        objects.forEach(obj => {
            if (obj.material) {
                obj.material.opacity = 1;
            }
            obj.userData.hasCollision = false;
        });

        // Check collisions for each hand
        this.targets.forEach((target, handIndex) => {
            if (!target.visible) return;

            const targetBox = new THREE.Box3().setFromObject(target);
            const collidingObjects = objects.filter(obj => {
                const objBox = new THREE.Box3().setFromObject(obj);
                return targetBox.intersectsBox(objBox);
            });

            if (collidingObjects.length > 0) {
                collidingObjects.forEach(obj => {
                    obj.userData.hasCollision = true;
                    if (this.closedFists[handIndex] && !this.selected[handIndex]) {
                        this.selected[handIndex] = obj;
                        this.dispatchEvent({ 
                            type: "drag_start", 
                            object: obj, 
                            handIndex 
                        });
                    }
                    if (obj.material) {
                        obj.material.opacity = 0.4;
                    }
                });
                this.dispatchEvent({ 
                    type: "collision", 
                    state: "on", 
                    objects: collidingObjects, 
                    handIndex 
                });
            } else if (!this.selected.some(s => s !== null)) {
                this.dispatchEvent({ 
                    type: "collision", 
                    state: "off", 
                    objects: null, 
                    handIndex 
                });
            }

            // Update selected object position
            if (this.selected[handIndex] && this.closedFists[handIndex]) {
                this.selected[handIndex].position.lerp(target.position, 0.3);
            }
        });
    }

    dispose() {
        // Clean up Three.js objects
        this.jointGeometry.dispose();
        this.materials.forEach(material => {
            material.joint.dispose();
            material.line.dispose();
        });
        
        this.hands.forEach(hand => {
            hand.meshes.forEach(mesh => {
                mesh.geometry.dispose();
                mesh.material.dispose();
                this.scene.remove(mesh);
            });
            
            hand.lines.forEach(line => {
                line.geometry.dispose();
                line.material.dispose();
                this.scene.remove(line);
            });
        });

        this.targets.forEach(target => {
            target.geometry.dispose();
            target.material.dispose();
            this.scene.remove(target);
        });
    }
}