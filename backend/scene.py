from music import MusicStreamer

class Scene:
    def __init__(self, music_object:MusicStreamer):
        self.music_streamer = music_object
        self.boxes = {}
        self.music_streamer.set_hook(self.update_state)

    def update_state(self, signal):
        print('SCENE RECEIVED SIGNAL:',signal)
        pass

    def get_state(self):
        """
        Returns:
        - List of created boxes
        - List of edited boxes
        - List of deleted boxes

        - {boxId: positions}
        """
        return 
