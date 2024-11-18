// webcam.js

async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true // Only video, no audio
        });
        
        const video = document.getElementById('webcam-video');
        video.srcObject = stream; // Set the video source to the webcam stream
        
        // Play the video
        video.play();
        
    } catch (error) {
        console.error("Error accessing the webcam: ", error);
        alert("Unable to access the webcam. Please check your permissions.");
    }
}

// Start the webcam on page load
startWebcam();
