export class CollisionDetector {
    constructor() {
        this.collisionThreshold = 0.5;
    }

    checkCollision(keypoints, boxes) {
        const collisions = [];

        boxes.forEach(box => {
            if (keypoints[0].visible) { //target
                keypoints.forEach(
                    kpt => {
                        if (!box.userData.isHit) {
                            const distance = this.calculateDistance(
                                kpt.position,
                                box.position
                            );
            
                            if (distance < this.collisionThreshold) {
                                box.userData.isHit = true;
                                collisions.push({
                                    box: box,
                                    points: box.userData.points,
                                    accuracy: this.calculateAccuracy(distance)
                                });
                            }
                        }
                    }
                )
            }
        });

        return collisions;
    }

    calculateDistance(handPos, boxPos) {
        const dx = handPos.x - boxPos.x;
        const dy = handPos.y - boxPos.y;
        const dz = handPos.z - boxPos.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    calculateAccuracy(distance) {
        // Convert distance to accuracy percentage
        const accuracy = 1 - (distance / this.collisionThreshold);
        return Math.max(0, Math.min(1, accuracy)) * 100;
    }

    setCollisionThreshold(threshold) {
        this.collisionThreshold = threshold;
    }
}