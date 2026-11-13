# Lyra — Interactive Talking AI Storyteller Avatar

An original, animated, interactive virtual character built with **HTML, CSS, and JavaScript** (no paid APIs required).

## Features Implemented
- **Original Character & Personality:** **Lyra**, the Midnight Observatory Storyteller, with a custom-crafted layered SVG character rig, floating starlight lantern, and ambient particle stage.
- **Living Character Animations (`character.js`):**
  - Natural random blinking (including occasional double-blinks)
  - Real-time eye gaze tracking (follows your pointer and glances upward while thinking)
  - Organic idle breathing, head sway, and speaking head nods
  - 6 dynamic facial expressions (`Warm`, `Happy`, `Excited`, `Thinking`, `Surprised`, `Curious`) with manual preview buttons and automatic mood shifts
  - Syllable-driven lip-sync mouth animation (teeth, tongue, cavity, and lip outline) synchronized with speech
- **Text & Voice Interaction (`app.js`):**
  - Text chat input + clickable interactive story choice chips
  - **Voice Output (TTS):** Web Speech API (`speechSynthesis`) with voice selector, speed, and pitch controls
  - **Voice Input (STT):** Microphone button using Web Speech API (`SpeechRecognition`)
- **Clear Purpose & Dual AI Brain (`brain.js`):**
  - **Built-in Interactive Storyteller Engine (100% Free / Offline):** Three branching stories (*The Clockwork Observatory*, *The Sunken Library of Aurelia*, *Midnight at the Sky-Tram*) plus conversational responses.
  - **Optional Gemini API Mode:** Paste a free Google Gemini API key in **Settings** to enable open-ended generative AI storytelling while keeping all animations and lip-sync.

## How to Run Locally
Option 1: Open `index.html` directly in Chrome or Edge.
Option 2 (Recommended for microphone access): Serve the folder over localhost:
```powershell
python -m http.server 8080
```
Then open `http://localhost:8080` in Chrome or Edge.
