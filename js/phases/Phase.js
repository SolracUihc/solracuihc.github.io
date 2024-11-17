export class Phase {
    constructor(gameController) { //:GameController
        if (new.target === Phase) {
            throw new Error("Cannot instantiate abstract class Phase directly.");
        }
        this.gameController = gameController;
    }

    initialize() {
        console.log("Initializing Base Phase");
        this.gameController.clearScreen();
    }

    animate() {
        throw new Error("Method 'animate()' must be implemented.");
    }

    cleanUp() {
        throw new Error("Method 'cleanUp()' must be implemented.");
    }

    handleGesture(command, handIndex) {
        throw new Error("Method 'handleGesture()' must be implemented.");
    }

    handleCollision(command, event) {
        throw new Error("Method 'handleCollision()' must be implemented.");
    }
}