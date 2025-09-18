from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

# Configuration
XLSX_PATH = "data/data.xlsx"  # Path to your XLSX file relative to the server directory

class APIHandler(SimpleHTTPRequestHandler):
    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()

    def do_GET(self):
        # Handle API request for XLSX
        if self.path == "/api/xlsx":
            self.serve_xlsx()
        else:
            # Serve static files (HTML, CSS, JS)
            super().do_GET()

    def serve_xlsx(self):
        if os.path.exists(XLSX_PATH):
            self.send_response(200)
            self.send_header("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            self.end_headers()
            with open(XLSX_PATH, "rb") as file:
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