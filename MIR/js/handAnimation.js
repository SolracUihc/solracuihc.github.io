export class HandAnimator {
    constructor(scene) {
        this.scene = scene;
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
                joint: new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.8
                }),
                line: new THREE.LineBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.5,
                    linewidth: 2
                })
            },
            {
                joint: new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.8
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
        this.jointGeometry = new THREE.SphereGeometry(0.05, 8, 8);

        // Scale and offset parameters
        this.handScale = 4;
        this.offsetX = 0;
        this.offsetY = 0;
        this.offsetZ = -2;

        // Initialize hand meshes
        this.initializeHandMeshes();
    }

    initializeHandMeshes() {
        // Create meshes for each hand
        for (let h = 0; h < 2; h++) {
            // Create 21 joints (landmarks) for each hand
            for (let i = 0; i < 21; i++) {
                const joint = new THREE.Mesh(this.jointGeometry, this.materials[h].joint.clone());
                joint.visible = false;
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

    updateHandPosition(handsData) {
        // Hide all hands first
        this.hideAllHands();

        // Update each detected hand
        handsData.forEach((handData, handIndex) => {
            if (handIndex >= 2) return; // Only handle up to 2 hands

            const hand = this.hands[handIndex];
            const landmarks = handData.landmarks;

            // Update joint positions
            for (let i = 0; i < landmarks.length; i++) {
                const landmark = landmarks[i];
                const mesh = hand.meshes[i];
                
                // Convert coordinates to Three.js space
                const x = (landmark.x - 0.5) * this.handScale + this.offsetX;
                const y = -(landmark.y - 0.5) * this.handScale + this.offsetY;
                const z = -landmark.z * this.handScale + this.offsetZ;

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
        });
    }

    hideAllHands() {
        this.hands.forEach(hand => {
            hand.meshes.forEach(mesh => mesh.visible = false);
            hand.lines.forEach(line => line.visible = false);
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
    }
}