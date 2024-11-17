import time
import threading

class MusicStreamer:
    def __init__(self):
        self.playing = False
        self.t = 0

    def start_playing(self):
        self.playing = True
        self.t = 0
        self.thread = threading.Thread(target=self.play)
        self.thread.start()
    
    def play(self):
        while self.playing:
            signal = {'beat': 'A'}
            self.hook_fn(signal)
            time.sleep(1)
            self.t += 1

    def stop_playing(self):
        self.playing = False
        if self.thread is not None:
            self.thread.join()  # Wait for the thread to finish

    def set_hook(self, fn):
        self.hook_fn = fn

    # def get_stream(self):

    #     return 