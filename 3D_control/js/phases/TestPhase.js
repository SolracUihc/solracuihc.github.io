
import { Phase } from "./Phase.js";

export class TestPhase extends Phase {
    constructor(gameController) { //:GameController
        super(gameController);
        
        this.initialize();
        
        this.fingerStates = {};
    }

    initialize() {
        console.log("Initializing Test Phase");
        
        this.gameController.clearScreen();
    }

    animate() {
        // these two lines gets the finger status and hand orientations.
        // will add more later
        const v = this.gameController.gestureDetector.getFingerStatus();
        this.updateFingerStatus(v.fingerStates, v.handOrientations);
    }

    updateFingerStatus(fingerStates, handOrientations) {
        // Clear existing finger status GUI elements
        if (this.gameController.fingerFolder)
            this.gameController.fingerFolder.dispose(); // Dispose of the current pane to reset

        // Create a new pane for finger status
        this.pane = this.gameController.fingerFolder = this.gameController.pane.addFolder({
            title: "Fingers"
        });

        Object.entries(fingerStates).forEach(([handIndex, hand]) => {
            var folder = this.pane.addFolder({
                title: `Hand ${handIndex}`
            });

            const fingerString = hand.map(state => state === '^' ? 'O' : '-').join('');
            folder.addBinding({ fingerString }, 'fingerString', {
                label: 'Fingers',
                readonly: true
            });

            const handOrientation = handOrientations[handIndex];
            folder.addBinding(
                { offset: {x: Math.sin(handOrientation * Math.PI/180), y: -Math.cos(handOrientation * Math.PI/180)} }, 
                'offset', {
                    picker: 'inline',
                    expanded: true,
                }
            );
        });
    }

    cleanUp() {
        if (this.gameController.fingerFolder)
            this.gameController.fingerFolder.dispose(); // Dispose of the current pane to reset
    }

    handleGesture(command, handIndex) {

    }

    handleCollision(command, event) {
        
    }
}