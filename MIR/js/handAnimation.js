export class HandAnimator {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.maxParticles = 50;
        this.particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        this.particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.6
        });
    }

    updateHandPosition(position) {
        // Convert webcam coordinates to Three.js coordinates
        const x = (position.x / 640) * 2 - 1;
        const y = -(position.y / 480) * 2 + 1;
        const z = position.z / 100;

        // Create new particles
        this.createParticle(x, y, z);
        
        // Update existing particles
        this.updateParticles();
    }

    createParticle(x, y, z) {
        if (this.particles.length >= this.maxParticles) {
            const oldParticle = this.particles.shift();
            this.scene.remove(oldParticle.mesh);
        }

        const mesh = new THREE.Mesh(this.particleGeometry, this.particleMaterial.clone());
        mesh.position.set(x, y, z);

        this.particles.push({
            mesh: mesh,
            life: 1.0
        });

        this.scene.add(mesh);
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= 0.02;

            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                this.particles.splice(i, 1);
            } else {
                particle.mesh.material.opacity = particle.life * 0.6;
            }
        }
    }

    clear() {
        this.particles.forEach(particle => {
            this.scene.remove(particle.mesh);
        });
        this.particles = [];
    }
}