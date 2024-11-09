import * as THREE from "https://esm.sh/three";
import { GameController } from "../GameController.js";
import { ScenesManager } from "../ScenesManager.js";

export class SelectionMenu {
    constructor(gameController) { //:GameController
        this.gameController = gameController;
        this.initialize();
    }

    initialize() {
        console.log("Initializing Phase 0");
        
        this.gameController.clearScreen();
    }

    animate() {
        
    }
}