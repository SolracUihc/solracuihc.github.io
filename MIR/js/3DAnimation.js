export class GameAnimator {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.boxes = [];
        this.initialize();
    }

    initialize() {
        // Setup renderer with shadow support
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        // this.renderer.shadowMap.enabled = true;
        // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);

        // Add lights for white shadows
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        // directionalLight.castShadow = true;
        // directionalLight.shadow.camera.near = 0.1;
        // directionalLight.shadow.camera.far = 20;
        // directionalLight.shadow.camera.left = -10;
        // directionalLight.shadow.camera.right = 10;
        // directionalLight.shadow.camera.top = 10;
        // directionalLight.shadow.camera.bottom = -10;
        // directionalLight.shadow.mapSize.width = 2048;
        // directionalLight.shadow.mapSize.height = 2048;
        // Make shadows white
        // directionalLight.shadow.bias = -0.001;
        this.scene.add(directionalLight);

        // Add ground plane for white shadows
        const planeGeometry = new THREE.PlaneGeometry(10, 10);
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.4,
            metalness: 0.2,
            transparent: true,
            opacity: 0.95
        });
        // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        // plane.rotation.x = -Math.PI / 2;
        // plane.position.y = -0.01; // Slightly below 0 to avoid z-fighting
        // // plane.receiveShadow = true;
        // this.scene.add(plane);

        // Add grid
        const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    createBox(beatData) {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });

        const box = new THREE.Mesh(geometry, material);
        box.position.set(
            beatData.position.x * 4 - 2,
            beatData.position.y * 4 - 2,
            -20
        );

        // Enable shadow casting for boxes
        // box.castShadow = true;

        box.userData = {
            points: beatData.points,
            isHit: false,
            startTime: beatData.time
        };

        this.boxes.push(box);
        this.scene.add(box);
        return box;
    }

    updateBoxes(currentTime, speed = 0.1) {
        for (let i = this.boxes.length - 1; i >= 0; i--) {
            const box = this.boxes[i];
            
            // Move box towards camera
            box.position.z += speed;

            // Rotate box
            box.rotation.x += 0.01;
            box.rotation.y += 0.01;

            // Remove box if it's too close or has been hit
            if (box.position.z > 5 || box.userData.isHit) {
                this.scene.remove(box);
                this.boxes.splice(i, 1);
            }
        }
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