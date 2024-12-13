# Methodologies

## Gesture Extraction

Relevant code: `handDetection.js` and `handAnimation.js`.

1. **Multi-Hand Detection**
   - Simultaneous detection of up to two hands (`initialize` and `detectHands` in `handDetection.js`)

2. **Depth Estimation**
   - Calculates hand depth using palm size and landmark distances (`calculateHandDepth` in `handDetection.js`):
     $$A_\text{palmSize}=\max_{p\in S}{\text{dist}(w,p)}$$
   - The coordinates of other keypoints within each hand are also scaled down centered at the wrist to maintain a consistent palm size in the gameplay (`updateHandPosition` in `handAnimation.js`):
     $$d_\text{hand}=10A_\text{palmSize}\\
     p_x'=c_\text{handScale}\cdot(p_x-w_x)/d_\text{hand}+c_\text{distScale}\cdot w_x\\
     p_z'=p_z-c_\text{depthScale}\cdot (d_\text{hand}-2)$$

3. **Visualization**
    - Place the keypoints, the linkages between them, and the palm center (`target`) into the scene (`handAnimation.js`)
    - Each point has a collision detector attached.

4. **Want more Challenging Gameplay?**
    - The final coordinates of the wrists in the gameplay depend directly and linearly on the relative position of the hand to the center of the screen, instead of the actual distance from the body
    - Larger motions are required if a person stands further away from the camera
    - Implies: The game is more challenging and requires the user to move more if they stand further away from the camera