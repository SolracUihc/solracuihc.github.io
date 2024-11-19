export class ScoreManager {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.scoreElement = document.getElementById('score');
        this.comboElement = document.getElementById('combo');
        this.maxComboElement = document.getElementById('maxCombo');
        this.accuracyHistory = [];
    }

    updateScore(collisions) {
        collisions.forEach(collision => {
            const basePoints = collision.points;
            const accuracyMultiplier = collision.accuracy / 100;
            const comboMultiplier = 1 + (this.combo * 0.1);

            const points = Math.round(
                basePoints * accuracyMultiplier * comboMultiplier
            );

            this.score += points;
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.accuracyHistory.push(collision.accuracy);

            this.displayScore();
            this.displayCombo();
            this.createScorePopup(points, collision.accuracy);
        });
    }

    missedNote() {
        this.combo = 0;
        this.displayScore();
        this.displayCombo();
    }

    createScorePopup(points, accuracy) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points} (${accuracy.toFixed(1)}%)`;

        document.body.appendChild(popup);

        // Animate and remove popup
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }

    displayScore() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
    }

    displayCombo() {
        if (this.comboElement) {
            this.comboElement.textContent = this.combo;
        }
        if (this.maxComboElement) {
            this.maxComboElement.textContent = this.maxCombo;
        }
    }

    getGameStats() {
        const averageAccuracy = this.accuracyHistory.length > 0
            ? this.accuracyHistory.reduce((a, b) => a + b) / this.accuracyHistory.length
            : 0;

        return {
            finalScore: this.score,
            maxCombo: this.maxCombo,
            averageAccuracy: averageAccuracy,
            totalHits: this.accuracyHistory.length
        };
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.accuracyHistory = [];
        this.displayScore();
        this.displayCombo();
    }
}