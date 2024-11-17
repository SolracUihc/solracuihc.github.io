export class Fetcher {
    static async fetchHello() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/hello');
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
}
