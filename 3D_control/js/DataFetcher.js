export class DataFetcher {
    constructor() {
        this.songData = null;
    }

    async fetchSongList() {
        try {
            const response = await fetch('../songData.json');
            this.songData = await response.json();
            return this.songData;
        } catch (error) {
            console.error('Error fetching song data:', error);
            throw error;
        }
    }

    getSongsByCategory(category) {
        if (!this.songData) return [];
        return this.songData.filter(song => song.category === category);
    }

    getSongById(id) {
        if (!this.songData) return null;
        return this.songData.find(song => song.id === id);
    }
}
