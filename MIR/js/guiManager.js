export class GUIManager {
    constructor() {
        this.timeBar = document.getElementById('time-bar-fill');
    }

    updateTimeBar(time) {
        // console.log(time)
        if (time < 0 || time > 1) return;
        this.timeBar.style.width = `${time * 100}%`;
    }
}