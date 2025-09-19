from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

# Configuration
DATA_DIR = "data"  # Directory containing XLSX files
ALLOWED_FILES = [
    "war_time_streets_inUse.xlsx",
    "1938_Street_index_inUse.xlsx"
]

class APIHandler(SimpleHTTPRequestHandler):
    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()

    def do_GET(self):
        # Handle API request for XLSX files
        if self.path.startswith("/api/xlsx/"):
            self.serve_xlsx()
        else:
            # Serve static files (HTML, CSS, JS)
            super().do_GET()

    def serve_xlsx(self):
        # Extract filename from path (e.g., /api/xlsx/war_time_streets_inUse.xlsx)
        filename = self.path[len("/api/xlsx/"):].strip("/")
        if filename in ALLOWED_FILES:
            file_path = os.path.join(DATA_DIR, filename)
            if os.path.exists(file_path):
                self.send_response(200)
                self.send_header("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                self.end_headers()
                with open(file_path, "rb") as file:
                    self.wfile.write(file.read())
            else:
                self.send_response(404)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(b"File not found")
        else:
            self.send_response(403)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"Access denied")

def run_server():
    server_address = ("0.0.0.0", 3011)
    httpd = HTTPServer(server_address, APIHandler)
    print("Serving on port 3011...")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
