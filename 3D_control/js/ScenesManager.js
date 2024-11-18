import {
  Scene,
  PerspectiveCamera,
  Color,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  SpotLight,
  Clock,
} from "three";

/**
 * ScenesManager class is responsible for setting up the 3D scene,
 * camera, lighting, and rendering using Three.js.
 */
export class ScenesManager {
  static scene; // The main scene
  static camera; // The camera used to view the scene
  static renderer; // The WebGL renderer
  static clock; // Clock to manage time

  /**
   * Set up the 3D scene, camera, lights, and renderer.
   */
  static setup() {
    // Initialize the scene with a background color
    ScenesManager.scene = new Scene();
    ScenesManager.scene.background = new Color(0x000000); // Light gray background
    // ScenesManager.scene.background = new Color(0xcccccc); // Light gray background

    // Create a perspective camera
    ScenesManager.camera = new PerspectiveCamera(
      45, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.01, // Near clipping plane
      100 // Far clipping plane
    );

    // Set camera position based on device type (mobile or desktop)
    const isMobile = window.innerWidth < window.innerHeight;
    ScenesManager.camera.position.set(0, 0, isMobile ? 4 : 2);

    // Initialize the clock to manage time-based operations
    ScenesManager.clock = new Clock();

    // Create and configure the WebGL renderer
    ScenesManager.renderer = new WebGLRenderer({ antialias: true }); // Smooth edges
    ScenesManager.renderer.setSize(window.innerWidth, window.innerHeight); // Fullscreen
    ScenesManager.renderer.setPixelRatio(window.devicePixelRatio); // High DPI support
    ScenesManager.renderer.shadowMap.enabled = true; // Enable shadows

    // Set up ambient light for general illumination
    const ambLight = new AmbientLight(0xffffff, 1); // White light with intensity 1
    ScenesManager.scene.add(ambLight); // Add ambient light to the scene

    // Set up directional light to simulate sunlight
    const dirLight = new DirectionalLight(0xffffff, 1); // White light with intensity 1
    dirLight.position.set(-30, 30, 30); // Position of the light source
    ScenesManager.scene.add(dirLight); // Add directional light to the scene

    // Set up a spotlight for focused lighting
    const light = new SpotLight(0xffffff, 4.5); // White spotlight
    light.position.set(0, 10, 5); // Position of the spotlight
    light.angle = Math.PI * 0.2; // Angle of the spotlight cone
    light.decay = 0; // No decay
    light.castShadow = true; // Enable shadows for the spotlight
    light.shadow.camera.near = 0.1; // Near clipping for shadow camera
    light.shadow.camera.far = 500; // Far clipping for shadow camera
    light.shadow.bias = -0.000222; // Bias to reduce shadow artifacts
    light.shadow.mapSize.width = 1024; // Shadow map width
    light.shadow.mapSize.height = 1024; // Shadow map height
    ScenesManager.scene.add(light); // Add spotlight to the scene

    // Append the renderer's DOM element to the document body
    document.body.appendChild(ScenesManager.renderer.domElement);
  }

  /**
   * Render the scene using the camera.
   */
  static render() {
    ScenesManager.renderer.render(ScenesManager.scene, ScenesManager.camera);
  }
}
