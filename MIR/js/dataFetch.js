export class DataFetcher {
    constructor() {
        this.songData = null;
        this.baseUrl = 'songData.json';
    }

    async fetchSongList() {
        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            this.songData = this.processSongData(data);
            return this.songData;
        } catch (error) {
            console.error('Error fetching song data:', error);
            throw error;
        }
    }

    processSongData(data) {
        return data.songs;
    }

    processBeatMap(beatMap) {
        return beatMap.map(beat => ({
            time: beat.time,
            position: {
                x: beat.x,
                y: beat.y,
                z: beat.z
            },
            points: beat.points
        }));
    }

    async getSongById(id) {
        if (!this.songData) {
            await this.fetchSongList();
        }
        return this.songData.find(song => song.id === id);
    }

    async getSongsByCategory(category) {
        if (!this.songData) {
            await this.fetchSongList();
        }
        if (category === 'all') {
            return this.songData;
        }
        return this.songData.filter(song => song.category === category);
    }
}
