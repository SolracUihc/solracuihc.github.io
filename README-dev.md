# AI Music Project

## Setting Up Backend

* Install ffmpeg properly and check with `ffmpeg` on cmd.
* Enter the subfolder `backend` and create a new virtual environment:
    ```bash
    python -m venv venv
    .\venv\Script\activate # windows
    source ./venv/bin/activate # linux
    ```
* Install required packages:
    ```bash
    pip install -r requirements.txt
    ```
* Set up Flask by running `app.py`:
    ```bash
    python app.py
    ```
* Testing backend calls:
    * Install Postman (you do not need to log in)
    * Refer to the URL as stated after you run `app.py`:
        ```
        Running on http://127.0.0.1:5000
        ```
    * Go to Postman and enter the relevant URL for the functionality you want to test:
        ![alt text](readme-src/image-5.png)