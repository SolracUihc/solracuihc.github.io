export class GameAnimator {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.boxes = [];
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

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 2);
        this.scene.add(directionalLight);

        // Add grid
        const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // // Add coordinate axes
        // const axesHelper = new THREE.AxesHelper(5);
        // this.scene.add(axesHelper);

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
            beatData.position.x * 4 - 2, // Scale and center x position
            beatData.position.y * 4 - 2, // Scale and center y position
            -20 // Start far away
        );

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