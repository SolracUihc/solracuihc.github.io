export class HandAnimator extends THREE.EventDispatcher {
    constructor(a, b) { // Constructor takes two parameters: scene (a) and options (b)
        super(), // Call the parent class constructor
        this.scene = a, // Set the scene property to the provided scene
        this.distScale = b?.distScale ?? 6, // Set distance scale, default to 6 if not provided
        this.handScale = b?.handScale ?? 6, // Set hand scale, default to 6 if not provided
        this.depthScale = b?.depthScale ?? 1, // Set depth scale, default to 1 if not provided
        this.hands = [{ meshes: [], lines: [] }, { meshes: [], lines: [] }], // Initialize hands with empty meshes and lines
        this.connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ], // Define connections between hand joints
        this.materials = [
            {
                joint: new THREE.MeshStandardMaterial({
                    color: 65280,
                    transparent: !0,
                    opacity: .8,
                    roughness: .3,
                    metalness: .2,
                    shadowSide: THREE.FrontSide
                }),
                line: new THREE.LineBasicMaterial({
                    color: 65280,
                    transparent: !0,
                    opacity: .5,
                    linewidth: 2
                })
            },
            {
                joint: new THREE.MeshStandardMaterial({
                    color: 65535,
                    transparent: !0,
                    opacity: .8,
                    roughness: .3,
                    metalness: .2,
                    shadowSide: THREE.FrontSide
                }),
                line: new THREE.LineBasicMaterial({
                    color: 65535,
                    transparent: !0,
                    opacity: .5,
                    linewidth: 2
                })
            }
        ], // Define materials for hand joints and lines
        this.jointGeometry = new THREE.SphereGeometry(.012 * this.handScale, 16, 16), // Create geometry for the hand joints
        this.targets = [], // Initialize targets array for gesture detection
        this.closedFists = [!1, !1], // Array to track if fists are closed
        this.selected = [null, null], // Array to track selected objects for each hand
        this.gestureCompute = {
            depthFrom: new THREE.Vector3,
            depthTo: new THREE.Vector3,
            from: new THREE.Vector3,
            to: new THREE.Vector3
        }, // Initialize vectors for gesture computation
        this.distanceToGrab = .25, // Set distance threshold for grabbing
        this.initializeHandMeshes(), // Call method to initialize hand meshes
        this.initializeTargets() // Call method to initialize target objects
    }

    initializeTargets() { // Method to initialize target objects
        for (let a = 0; 2 > a; a++) { // Loop for both hands
            const b = new THREE.MeshStandardMaterial({
                color: this.materials[a].joint.color,
                transparent: !0,
                opacity: .8,
                roughness: .3,
                metalness: .2
            }), // Create material for targets
            c = new THREE.Mesh(new THREE.SphereGeometry(.03 * this.handScale, 32, 16), b); // Create a mesh for the target with sphere geometry
            c.castShadow = !0, // Enable shadow casting for the target
            c.visible = !1, // Set target visibility to false initially
            this.scene.add(c), // Add target mesh to the scene
            this.targets.push(c) // Push target mesh into the targets array
        }
    }

    initializeHandMeshes() { // Method to initialize hand meshes
        for (let a = 0; 2 > a; a++) { // Loop for both hands
            for (let b = 0; 21 > b; b++) { // Loop for each joint (21 joints)
                const b = new THREE.Mesh(this.jointGeometry, this.materials[a].joint.clone()); // Create joint mesh using joint geometry and material
                b.visible = !1, // Set joint visibility to false initially
                b.castShadow = !0, // Enable shadow casting for the joint
                b.receiveShadow = !1, // Disable shadow receiving for the joint
                this.scene.add(b), // Add joint mesh to the scene
                this.hands[a].meshes.push(b) // Add joint to the corresponding hand's meshes array
            }
            for (const b of this.connections) { // Loop through each connection
                const b = new THREE.BufferGeometry, // Create buffer geometry for line connections
                c = new THREE.Line(b, this.materials[a].line.clone()); // Create a line using the geometry and material
                c.visible = !1, // Set line visibility to false initially
                this.scene.add(c), // Add line to the scene
                this.hands[a].lines.push(c) // Add line to the corresponding hand's lines array
            }
        }
    }

    calculateGestures(a) { // Method to calculate gestures for a hand
        const b = this.hands[a], // Get the hand based on index a
        c = b.meshes[0].position, // Get position of the first joint
        d = b.meshes[9].position, // Get position of the thumb base joint
        e = b.meshes[12].position, // Get position of the middle finger base joint
        f = e.clone().sub(c).length() / d.clone().sub(c).length(), // Calculate the ratio of distances for gesture detection
        g = this.closedFists[a]; // Store previous closed fist state
        this.closedFists[a] = 1.3 > f, // Update closed fist state based on ratio
        this.closedFists[a] !== g && ( // Check if the closed fist state has changed
            this.closedFists[a] ? this.dispatchEvent({ type: "closed_fist", handIndex: a }) : // Dispatch closed fist event if now closed
            (this.dispatchEvent({ type: "opened_fist", handIndex: a }), // Dispatch opened fist event if now opened
            this.selected[a] && (
                this.dispatchEvent({ type: "drag_end", object: this.selected[a], handIndex: a }),
                this.selected[a] = null
            )) // If an object is selected, dispatch drag end event and reset selection
        );
        const h = [0, 0, 0, 5, 9, 13, 17]; // Array of joint indices to calculate target position
        let i = 0, j = 0, k = 0; // Initialize coordinates for average position
        h.forEach(a => { // Loop through the joint indices
            i += b.meshes[a].position.x, // Sum x coordinates
            j += b.meshes[a].position.y, // Sum y coordinates
            k += b.meshes[a].position.z // Sum z coordinates
        }); 
        const l = h.length; // Get the count of indices for averaging
        this.targets[a].position.set(i / l, j / l, k / l), // Set target position to the average
        this.targets[a].visible = !0 // Make the target visible
    }

    updateHandPosition(a) { // Method to update the hand position based on input data
        this.hideAllHands(), // Hide all hands before updating
        a.forEach((a, b) => { // Loop through the hand data for each hand
            if (2 <= b) return; // Only process for the first two hands
            const c = this.hands[b], // Get the current hand
            d = a.landmarks, // Get landmarks from input data
            e = a.depth, // Get depth information
            f = a.depth2Offset, // Get secondary depth offset
            g = a.wrist; // Get wrist position
            for (let h = 0; h < d.length; h++) { // Loop through each landmark
                const a = d[h], // Current landmark data
                b = c.meshes[h]; // Corresponding mesh for the landmark
                let i = -a.x + .5, // Calculate x position
                j = -a.y + .5, // Calculate y position
                k = a.z, // Get z position
                l = -g.x + .5, // Calculate wrist x position
                m = -g.y + .5; // Calculate wrist y position
                i = (i - l) / e * this.handScale + this.distScale * l, // Adjust x position based on depth and scaling
                j = (j - m) / e * this.handScale + this.distScale * m, // Adjust y position based on depth and scaling
                k -= f * this.depthScale, // Adjust z position based on depth offset
                b.position.set(i, j, k), // Set the position of the mesh
                b.visible = !0 // Make the mesh visible
            }
            for (let d = 0; d < this.connections.length; d++) { // Loop through each connection
                const [a, b] = this.connections[d], // Get joint indices for the connection
                e = c.meshes[a].position, // Get position of the first joint in the connection
                f = c.meshes[b].position, // Get position of the second joint in the connection
                g = new THREE.BufferGeometry().setFromPoints([e, f]); // Create geometry from the two joint positions
                c.lines[d].geometry.dispose(), // Dispose of the old geometry
                c.lines[d].geometry = g, // Set the new geometry for the line
                c.lines[d].visible = !0 // Make the line visible
            }
            this.calculateGestures(b, d) // Calculate gestures for the hand
        })
    }

    hideAllHands() { // Method to hide all hand meshes and lines
        this.hands.forEach(a => { // Loop through each hand
            a.meshes.forEach(a => a.visible = !1), // Hide all meshes for the hand
            a.lines.forEach(a => a.visible = !1) // Hide all lines for the hand
        }), 
        this.targets.forEach(a => a.visible = !1) // Hide all targets
    }

    checkCollisions(a) { // Method to check for collisions with other objects
        a && a.length && ( // Check if there are any objects to check against
            a.forEach(a => { // Loop through each object
                a.material && (a.material.opacity = 1), // Set opacity to 1 if material exists
                a.userData.hasCollision = !1 // Reset collision state
            }), 
            this.targets.forEach((b, c) => { // Loop through each target
                if (!b.visible) return; // Skip if target is not visible
                const d = new THREE.Box3().setFromObject(b), // Create bounding box from the target
                e = a.filter(a => { // Filter objects to find collisions
                    const b = new THREE.Box3().setFromObject(a); // Create bounding box for the object
                    return d.intersectsBox(b) // Check for intersection with the target's bounding box
                }); 
                0 < e.length ? ( // If there are collisions
                    e.forEach(a => { // Loop through each collided object
                        a.userData.hasCollision = !0, // Set collision state
                        this.closedFists[c] && !this.selected[c] && (this.selected[c] = a, // If fist is closed and no selection, select the collided object
                            this.dispatchEvent({ type: "drag_start", object: a, handIndex: c })), // Dispatch drag start event
                        a.material && (a.material.opacity = .4) // Reduce opacity of the collided object
                    }), 
                    this.dispatchEvent({ type: "collision", state: "on", objects: e, handIndex: c }) : // Dispatch collision event if there are collisions
                    !this.selected.some(a => null !== a) && this.dispatchEvent({ type: "collision", state: "off", objects: null, handIndex: c }), // Dispatch collision off event if nothing is selected
                    this.selected[c] && this.closedFists[c] && this.selected[c].position.lerp(b.position, .3) // Lerp selected object's position towards the target position
                )
            })
        )
    }

    dispose() { // Method to clean up resources
        this.jointGeometry.dispose(), // Dispose of joint geometry
        this.materials.forEach(a => { // Loop through each material
            a.joint.dispose(), // Dispose of joint material
            a.line.dispose() // Dispose of line material
        }), 
        this.hands.forEach(a => { // Loop through each hand
            a.meshes.forEach(a => { // Loop through each mesh
                a.geometry.dispose(), // Dispose of mesh geometry
                a.material.dispose(), // Dispose of mesh material
                this.scene.remove(a) // Remove mesh from the scene
            }), 
            a.lines.forEach(a => { // Loop through each line
                a.geometry.dispose(), // Dispose of line geometry
                a.material.dispose(), // Dispose of line material
                this.scene.remove(a) // Remove line from the scene
            })
        }), 
        this.targets.forEach(a => { // Loop through each target
            a.geometry.dispose(), // Dispose of target geometry
            a.material.dispose(), // Dispose of target material
            this.scene.remove(a) // Remove target from the scene
        }) 
    }
}
