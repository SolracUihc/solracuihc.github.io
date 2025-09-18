from http.server import SimpleHTTPRequestHandler, HTTPServer
import os
from urllib.parse import urlparse, parse_qs

# Configuration
DATA_DIR = "data"  # Directory containing XLSX files

class APIHandler(SimpleHTTPRequestHandler):
    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()

    def do_GET(self):
        # Parse the URL to check for API request
        parsed_url = urlparse(self.path)
        if parsed_url.path == "/api/xlsx":
            query_params = parse_qs(parsed_url.query)
            filename = query_params.get("file", [None])[0]
            if filename:
                self.serve_xlsx(filename)
            else:
                self.send_error(400, "Missing file parameter")
        else:
            # Serve static files (HTML, CSS, JS)
            super().do_GET()

    def serve_xlsx(self, filename):
        # Sanitize filename to prevent directory traversal
        filename = os.path.basename(filename)
        file_path = os.path.join(DATA_DIR, filename)
        if os.path.exists(file_path) and file_path.endswith(".xlsx"):
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

def run_server():
    server_address = ("0.0.0.0", 3011)
    httpd = HTTPServer(server_address, APIHandler)
    print("Serving on port 3011...")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()