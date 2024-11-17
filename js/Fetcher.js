export class Fetcher {
    static async fetch(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching hello:', error);
            throw error;
        }
    }
    
    static async fetchHello() {
        return this.fetch('http://127.0.0.1:5000/api/hello')
    }

    static async startStreaming(scene_id) {
        return this.fetch(`http://127.0.0.1:5000/api/start_streaming/${scene_id}`)
    }

    static async stopStreaming() {
        return this.fetch('http://127.0.0.1:5000/api/stop_streaming')
    }

    static async fetchScene() {
        return this.fetch('http://127.0.0.1:5000/api/stream')
    }
}
