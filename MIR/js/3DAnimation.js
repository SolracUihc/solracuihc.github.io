import { hash } from "./mathUtils.js";

export class GameAnimator {
    constructor(settings) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.boxes = [];
        this.boxScale = 1;
        this.lastTime = undefined;

        this.boxMinX = settings?.boxMinX ?? -2;
        this.boxMaxX = settings?.boxMaxX ?? 2;
        this.boxMinY = settings?.boxMinY ?? 0;
        this.boxMaxY = settings?.boxMaxY ?? 3;
        this.hitTimeOffset = settings?.hitTimeOffset ?? 2;
        this.hitTimeWindow = settings?.hitTimeWindow ?? .2;
        this.hintTimeWindow = settings?.hintTimeWindow ?? .7;

        this.initialize();
    }

    initialize() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Create ground plane
        this.planeGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
        this.planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        this.groundPlane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
        this.groundPlane.rotation.x = -Math.PI / 2;
        
        // Set the y position lower
        this.groundPlane.position.y = -1; // Adjust this value as needed
        
        this.scene.add(this.groundPlane);

        // Add grid
        // const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
        // this.scene.add(gridHelper);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    reset_seed(audio_file) {
        THREE.MathUtils.seededRandom(hash(audio_file));
    }

    createBox(beatData) {
        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });

        let rand = THREE.MathUtils.seededRandom();
        material.color.setHSL(rand, 1, 0.5);

        rand = (rand * 2 - 1) * 2;
        rand = THREE.MathUtils.clamp(rand, -1.5, 1.5);

        const box = new THREE.Mesh(geometry, material);
        box.position.set(
            rand * (beatData.x * (this.boxMaxX - this.boxMinX) + this.boxMinX) * this.boxScale,
            (beatData.y * (this.boxMaxY - this.boxMinY) + this.boxMinY) * this.boxScale,
            -20
        );
        box.transparent = true;
        box.material.opacity = .5;
        box.supposedHitTime = beatData.time; // custom tags

        box.userData = {
            points: beatData.points,
            isHit: false,
            startTime: beatData.time
        };

        this.boxes.push(box);
        this.scene.add(box);
        return box;
    }

    updateGround(beatMap) {
        // Change ground color based on beatMap.x
        const colorValue = beatMap.x * 10;
        this.planeMaterial.color.setHSL(colorValue % 1, 1, 0.5); // Normalize to 0-1 range
    
        // generate a wave at specific coordinates
        const vertices = this.groundPlane.geometry.attributes.position.array;
        const waveRadius = 2; // Radius of the wave effect
    
        for (let i = 0; i < vertices.length; i += 3) {
            const vertX = vertices[i];
            const vertZ = vertices[i + 2];
            
            // Calculate distance from the wave center
            const distance = Math.sqrt((vertX - beatMap.x) ** 2 + (vertZ - beatMap.x) ** 2);
            
            // If within the wave radius, increase the height
            if (distance < waveRadius) {
                const waveHeight = beatMap.y * Math.cos((distance / waveRadius) * Math.PI); // Smooth wave effect
                vertices[i + 1] += waveHeight;
            }
        
            this.groundPlane.geometry.attributes.position.needsUpdate = true; // Update geometry
        }
    }

    updateBoxes(currentTime, speed = 10) {
        let boxRemoved = false;
        if (this.lastTime === undefined) {
            this.lastTime = currentTime;
            return boxRemoved;
        }

        const timeDiff = currentTime - this.lastTime;
        this.lastTime = currentTime;

        for (let i = this.boxes.length - 1; i >= 0; i--) {
            const box = this.boxes[i];

            // Move box towards camera
            box.position.z += speed * timeDiff;

            // Rotate box
            box.rotation.x += 1 * timeDiff;
            box.rotation.y += 1 * timeDiff;

            const diff = currentTime - box.supposedHitTime - this.hitTimeOffset;
            const diff2 = diff / this.hintTimeWindow;
            box.material.opacity = Math.abs(diff) < this.hitTimeWindow ? 1 : Math.max(.5, Math.min(1, 1 - diff2*diff2));
            // Remove box if it's too close or has been hit
            if (box.position.z > 5) {
                this.scene.remove(box);
                this.boxes.splice(i, 1);
                boxRemoved = true;
            } else if (box.userData.isHit) {
                this.scene.remove(box);
                this.boxes.splice(i, 1);
            }
        }
        return boxRemoved;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    clear() {
        this.boxes.forEach(box => {
            this.scene.remove(box);
        });
        this.boxes = [];
    }
}
