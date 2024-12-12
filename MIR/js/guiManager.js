export class GUIManager {
    constructor() {
        this.timeBar = document.getElementById('time-bar-fill');
        this.accuracyBar = document.getElementById('accuracy-bar-fill');
    }

    updateTimeBar(time) {
        // console.log(time)
        if (time < 0 || time > 1) return;
        this.timeBar.style.width = `${time * 100}%`;
    }

    updateAccuracyBar(accuracy) {
        if (accuracy < 0 || accuracy > 100) return;
        this.accuracyBar.style.width = `${accuracy}%`;
    }
}