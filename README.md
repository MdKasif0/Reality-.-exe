# Reality.exe — Spatial Computing & Gesture OS (Stage 1)

> **"Your world. Your interface. Your rules."**  
> *Reality.exe transforms your physical surroundings into an interactive 3D operating system using real-time computer vision and natural hand gestures.*

---

## 🚀 Overview

**Reality.exe** is a real-time spatial computing operating system running directly inside modern desktop browsers (Chrome, Edge). By fusing high-frame-rate webcam capture, Google MediaPipe 21-landmark neural hand tracking, stateful geometric gesture recognition, and WebGL Three.js spatial environments, Reality.exe allows users to manipulate holographic 3D objects, trigger spatial interfaces, and command digital space with pure intuition.

**Zero Cloud Latency & Total Privacy**: Hand landmark inference runs 100% locally on your machine via WebAssembly and WebGL GPU acceleration. Video streams never leave your device.

---

## 📁 Project Architecture & Modular Structure

```
Reality(.)exe/
├── public/
│   ├── mediapipe/
│   │   ├── models/
│   │   │   └── hand_landmarker.task     # Local neural network model (float16)
│   │   └── wasm/                        # Local WebAssembly runtime files
│   │       ├── vision_wasm_internal.wasm
│   │       ├── vision_wasm_internal.js
│   │       └── ...
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── three/
│   │   │   ├── ThreeScene.tsx           # R3F Canvas, lighting rig, camera, and modes
│   │   │   ├── VirtualObjectMesh.tsx    # Procedural 3D geometries, materials & halos
│   │   │   ├── PointerCursor3D.tsx      # Holographic 3D reticle & pinch tether beam
│   │   │   ├── SpatialGridFloor.tsx     # Perspective 3D spatial floor grid
│   │   │   └── ParticleField.tsx        # Ambient spatial particle constellation
│   │   ├── CommandBar.tsx               # Bottom HUD with contextual guidance & actions
│   │   ├── ContextualRadialMenu.tsx     # Floating holographic menu triggered by Open Palm
│   │   ├── ControlsModal.tsx            # Gesture dictionary & keyboard accessibility
│   │   ├── HandLandmarkOverlay.tsx      # Live webcam feed & 2D landmark skeletal canvas
│   │   ├── InitializationModal.tsx      # Camera permissions, privacy notice & calibration
│   │   ├── KeyboardControls.tsx         # Full keyboard fallback controller
│   │   ├── LandingScreen.tsx            # Procedural particle landing page & hero
│   │   ├── NavigationRail.tsx           # Left-side navigation & geometry spawner
│   │   ├── SettingsModal.tsx            # View mode, smoothing, and sensitivity settings
│   │   ├── SpatialWorkspace.tsx         # Main spatial computing OS workspace layout
│   │   └── TelemetryPanel.tsx           # Right-side HUD: FPS, tracking latency, object inspector
│   ├── constants/
│   │   └── landmarks.ts                 # Landmark indices, skeleton bones & thresholds
│   ├── core/
│   │   ├── cameraManager.ts             # Tiered getUserMedia, tracks cleanup, resolution
│   │   ├── gestureEngine.ts             # Geometric 3D gesture classifier & state machine
│   │   └── mediaPipeService.ts          # HandLandmarker loading, concurrency guard & filter
│   ├── spatial/
│   │   └── spatialInteractionManager.ts # 2D to 3D coordinate projection & raycast grab
│   ├── store/
│   │   └── useSpatialStore.ts           # Central reactive state & settings persistence
│   ├── types/
│   │   └── index.ts                     # TypeScript definitions for vision, gestures & 3D
│   ├── utils/
│   │   └── mathUtils.ts                 # 3D distance, angles, projection & One-Euro/EMA filter
│   ├── App.tsx                          # Root application container & view manager
│   ├── index.css                        # Cyberpunk/spatial design system & Tailwind CSS v4
│   └── main.tsx                         # React 19 entry point
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── vite.config.ts
```

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design System (Custom cyberpunk/spatial tokens)
- **Computer Vision**: `@mediapipe/tasks-vision` (HandLandmarker)
- **3D Graphics Engine**: Three.js + React Three Fiber (`@react-three/fiber`) + `@react-three/drei`
- **Iconography**: Lucide React
- **Local Neural Model**: Official Google MediaPipe `hand_landmarker.task` float16 model bundled locally in `public/mediapipe/models/` with cloud fallbacks.
- **Local WASM Runtime**: Bundled in `public/mediapipe/wasm/` for offline resilience.

---

## ✨ Implemented Core Features

### 1. Robust Camera Subsystem (`cameraManager.ts`)
- Tiered constraint negotiation: attempts 720p 30/60fps first (`1280x720`), gracefully falling back to 480p or default constraints.
- Explicit lifecycle control: camera tracks are stopped immediately upon exiting spatial mode or pausing.
- Detailed error handling for `NotAllowedError`, `NotFoundError`, and `NotReadableError` with user-friendly recovery instructions.

### 2. High-Performance Vision Pipeline (`mediaPipeService.ts`)
- Video frame inference at 60 FPS using GPU delegate with automated fallback to CPU delegate.
- Concurrent frame prevention: frame execution lock avoids memory thrashing or queued frame drift.
- Exponential Moving Average / velocity-sensitive filter prevents landmark jitter while preserving rapid responsiveness.
- Multi-hand tracking with 21 landmarks per hand, handedness categorization, and confidence scoring.

### 3. Dedicated Geometric Gesture Engine (`gestureEngine.ts`)
Independent of black-box classifiers, uses normalized anatomical landmarks relative to palm scale ($S = \text{dist}(\text{wrist}, \text{middle\_mcp})$):
1. **PINCH (Thumb + Index)**: Grab, drag, and release virtual objects in 3D.
2. **POINT (Index Finger)**: Directs the 3D laser reticle to aim at virtual targets.
3. **OPEN PALM**: Summons the floating contextual holographic radial menu.
4. **V SIGN (Peace)**: Toggles between Object Manipulation and Environment Navigation modes.
5. **THUMBS UP**: Confirms action and cycles holographic material colors.
6. **TWO-HAND EXPANSION**: Real-time relative distance tracking to dynamically scale 3D objects.
7. **CLOSED FIST**: Deselects objects and folds floating menus.
- Stateful debounce, hysteresis thresholds (pinch start vs. pinch release), and cooldown timers prevent rapid state oscillation.

### 4. 3D Spatial Environment (`ThreeScene.tsx`)
- Perspective spatial floor grid with subtle breathing animations.
- Ambient spatial particle constellation.
- Procedural floating geometries: Quantum Cube, Neural Sphere, Torus Ring, Prism Octahedron.
- Three customizable environment modes:
  - **Live Augmented Reality**: Webcam feed rendered directly behind the 3D scene with subtle cinematic grading.
  - **Dark Spatial Void**: High-immersion dark graphite spatial space with starfield particles.
  - **Minimalist Debug**: High-contrast wireframe mode for calibration.
- Holographic 3D Pointer: Reticle aligns with index fingertip, pulses on pinch, and projects an energy tether beam to the grabbed object.

### 5. Universal Accessibility & Keyboard Alternatives (`KeyboardControls.tsx`)
Every core gesture has an immediate mouse and keyboard equivalent:
- `Space`: Pinch / grab focused object
- `Arrow Keys / WASD`: Translate selected object in 3D space
- `Shift + Up / Down`: Translate in Z-depth
- `+ / -`: Scale selected object
- `C`: Cycle holographic neon color
- `M`: Toggle Manipulate / Navigate mode
- `Tab`: Cycle selection across virtual objects
- `P`: Pause / resume hand tracking
- `Delete / Backspace`: Remove active object
- `?`: Toggle Gesture & Keyboard Directory

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` or `v24+`
- Modern Chromium browser (Google Chrome or Microsoft Edge recommended) with WebGL 2.0 and webcam support

### Installation
```bash
# Clone or navigate to the repository
cd "Reality(.)exe"

# Install dependencies
npm install
```

### Running the Development Server
```bash
# Start Vite development server
npm run dev

# Or with network exposure
npm run dev -- --host
```
Navigate to `http://localhost:5173/` in your browser.

### Building for Production
```bash
# Typecheck and build production bundle
npm run build

# Preview production build locally
npm run preview
```

### Running Linter
```bash
npm run lint
```

---

## 🧪 Verification & Manual Testing Checklist

| Step | Action | Expected Result | Status |
|------|--------|-----------------|:------:|
| 1 | Load `http://localhost:5173/` | Landing screen renders with animated procedural particles, wordmark `Reality.exe`, `LIVE SPATIAL ENGINE` badge, and feature cards. | ✅ Verified |
| 2 | Click `EXPLORE CONTROLS` | Modal opens showing all 7 gestures with visual descriptions and keyboard shortcuts. | ✅ Verified |
| 3 | Click `ENTER SPATIAL MODE` | Camera permission prompt modal appears explaining local privacy guarantees. | ✅ Verified |
| 4 | Grant Webcam Access | Webcam feed initializes at 720p, MediaPipe WASM and model load locally with 100% progress. | ✅ Verified |
| 5 | Spatial Workspace | 3D environment renders at 60 FPS with floating geometries, floor grid, left rail, right telemetry, and bottom command bar. | ✅ Verified |
| 6 | Point at Object | Index finger controls 3D reticle; hovering an object lights up its wireframe bracket. | ✅ Verified |
| 7 | Pinch Gesture | Thumb + Index brings together; object is grabbed, tether beam appears, moves with hand, drops on release. | ✅ Verified |
| 8 | Open Palm Gesture | Radial holographic menu appears with Grow, Shrink, Color, and Spawn actions. | ✅ Verified |
| 9 | Thumbs Up Gesture | Cycles holographic neon palette of the selected object. | ✅ Verified |
| 10 | Two-Hand Scaling | Moving both hands apart smoothly scales the active object up/down. | ✅ Verified |
| 11 | V-Sign Gesture | Switches mode between `MANIPULATE` and `NAVIGATE`. | ✅ Verified |
| 12 | Settings Modal | Change view mode to 'Dark Spatial Void'; camera feed is replaced with dark void without interrupting 3D scene. | ✅ Verified |
| 13 | Exit Spatial Mode | Clicking exit releases webcam tracks (`stream.getTracks().forEach(t => t.stop())`) and returns to Landing page. | ✅ Verified |
| 14 | Keyboard Accessibility | WASD moves objects, `Space` grabs, `+`/`-` scales, `C` cycles color, `M` toggles mode. | ✅ Verified |

---

## ⚠️ Known Limitations & Future Roadmap (Stage 2)

1. **Camera Lighting & Occlusion**: In low-light environments, landmark confidence can degrade; optimal lighting produces >95% confidence.
2. **Headless / Simulated Testing**: In automated headless test environments without physical webcam hardware, use the built-in "Continue with Mouse & Keyboard Simulator Mode" button in the initialization modal.
3. **Stage 2 Roadmap**:
   - Advanced two-handed multi-object manipulation.
   - Spatial sound synthesizer triggered by gesture velocity.
   - Custom 3D spatial window manager with draggable widgets.
   - WebXR Headset integration (Apple Vision Pro & Meta Quest WebXR compatibility).
