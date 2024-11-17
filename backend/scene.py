import math
import random
from streamer import MusicStreamer

class Scene:
    def __init__(self, music_object:MusicStreamer):
        self.music_streamer = music_object
        self.boxes = {}
        self.scene_id = 0
        self.music_streamer.set_hook(self.update_state)

        self.farZ = -10

    def initialize_scene(self, scene_id=0):
        self.scene_id = scene_id = int(scene_id)
        print('INITIALIZE SCENE:', scene_id)
        match scene_id:
            case 1:
                self.boxes = {i: self.new_box(scene_id) for i in range(5)}
                print('BOXES', self.boxes)

    def new_box(self, scene_id):
        match scene_id:
            case 1:
                return {
                    'position': {
                        'x': random.uniform(-1, 1),
                        'y': random.uniform(-.25, .25),
                        'z': self.farZ
                    },
                    'rotation': {
                        'x': random.uniform(0, 2*math.pi),
                        'y': random.uniform(0, 2*math.pi),
                        'z': random.uniform(0, 2*math.pi)
                    }
                }

    def clear_scene(self):
        self.boxes = {}

    def update_state(self, signal):
        # print('SCENE RECEIVED SIGNAL:',signal, self.boxes)
        # self.boxes
        if signal['signal'] == 'time':
            match self.scene_id:
                case 1:
                    for i, box in self.boxes.items():
                        box['position']['z'] += .1
                        if box['position']['z'] > 2.5:
                            box['position'] = self.new_box(self.scene_id)['position']
        pass

    def get_state(self):
        """
        Returns:
        - List of created boxes
        - List of edited boxes
        - List of deleted boxes

        - {boxId: positions}
        """
        return self.boxes
