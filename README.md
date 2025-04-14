# BEALE-lite

> Bio Echo Acoustic Language Emulator — Lite Edition

BEALE-lite is a web-based prototype inspired by the fictional BEALE machine from a speculative story. It simulates an attempt to interpret humpback whale song by generating poetic, interpretive phrases based on audio signal characteristics. It combines audio visualization, procedural language generation, and a growing log of generated whale phrases.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎧 Audio Upload & Playback | Upload `.mp3` or `.wav` whale song audio files and play them in-browser. |
| 🔊 Real-Time Analysis | Uses Web Audio API to analyze frequency and volume. |
| 🧠 Phrase Generation | Generates interpretive phrases based on audio data. |
| 🎨 Visualizer | Renders real-time frequency activity on canvas. |
| 📜 Persistent Log | Stores generated phrases in `localStorage`. |
| 📋 Copy & Clear Log | Copy all phrases to clipboard or clear the log. |
| 🌊 Ocean Theme | Styled UI with oceanic tones and calming design. |
| 🎯 Interpretation Modes | Switch between Emotionalist and Analyst schools of thought. |
| 📊 Advanced Analysis | Detect tonal shifts and mood dynamics. |
| 📝 Export Logs | Export phrase logs as `.txt` or `.json`. |

---

## 📂 File Structure

```
beale-lite/
├── src/
│   ├── index.html           # Main app interface
│   ├── css/
│   │   ├── styles.css       # Main styles
│   │   └── themes/          # Theme variations
│   ├── js/
│   │   ├── app.js           # Main application logic
│   │   ├── audioProcessor.js # Audio analysis and visualization
│   │   ├── phraseGenerator.js # Phrase generation logic
│   │   ├── logManager.js    # Phrase log management
│   │   └── uiManager.js     # UI state and interactions
│   └── data/
│       ├── whales.json      # Names and poetic bios
│       ├── locations.json   # Locations with tags
│       ├── actions.json     # Actions and contexts
│       └── phrases.json     # Base phrase templates
├── public/
│   └── whale_songs/         # Sample audio files
├── package.json             # Project dependencies
└── README.md                # This document
```

---

## 🥜 Phrase Generation Logic

**Function**: `generatePhrase(freq, avgVol, time, mode)`

**Inputs:**
- `freq`: Peak frequency
- `avgVol`: Average volume
- `time`: Current time in seconds
- `mode`: Interpretation mode ('emotionalist' or 'analyst')

**Outputs:**
A poetic sentence such as:

> _Narael, at Raeth's Deep, her call fading (deep echo, with grief) [42s]_

**Components:**
- Random whale **name** (e.g., Narael, Vey)
- Fictional **location** (e.g., Raeth's Deep, Grey Shelf)
- **Action/context** (e.g., "her call fading")
- **Tone tag**: based on pitch (e.g., "deep echo", "high voice")
- **Mood tag**: based on volume dynamics (e.g., "with grief", "with peace")
- **Interpretation mode**: affects phrase structure and vocabulary

---

## 🛠️ Tech Stack

| Technology | Use |
|------------|-----|
| HTML5      | Markup structure |
| CSS        | Styling and layout |
| JavaScript | Application logic |
| Web Audio API | Audio processing, frequency analysis |
| Canvas API | Visual rendering of spectrum |
| localStorage | Phrase log persistence |
| Clipboard API | Copy to clipboard |
| File API | Export functionality |

---

## ✅ Setup Instructions

1. Clone/download the project
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open in browser: `http://localhost:3000`
5. Upload a whale song and begin interpretation

---

## 🧩 Development Goals

| Feature | Status |
|---------|--------|
| 📆 Expand Phrase Bank | In Progress |
| 🔬 Improved Analysis | Implemented |
| 🌍 Fictional Mapping | Planned |
| 🔍 Phrase Tags | Implemented |
| 🔒 Export Logs | Implemented |
| 🧵 Interpretation Modes | Implemented |
| 🔊 Synthetic Playback | Future |

---

## 📚 Conceptual Background

The BEALE-lite is inspired by the fictional BEALE device from a sci-fi novel project. In that universe:
- Whale song is thought to encode emotion, memory, and context
- Human analysts debate whether these songs are expressive (emotionalists) or structured data (structuralists)
- The machine attempts to translate whale communication into a poetic human-readable form

This tool simulates a simplified version of that machine's output, with support for different schools of interpretation.

---

## 🤖 LLM-Friendly Notes

- Core function is `generatePhrase(freq, avgVol, time, mode)`
- Style: Oceanic, poetic, memory/emotion-driven
- Phrases can be grouped, tagged, or categorized
- Supports multiple interpretation modes
- Modular architecture for easy extension
- Data-driven phrase generation

---

## 🌟 Example Output

```
[Emotionalist Mode]
Narael, at Raeth's Deep, her call fading (deep echo, with grief) [42s]
Vey, near the Grey Shelf, his song looping (high voice, with memory) [21s]

[Analyst Mode]
Olan, in the Broken Swell, pattern 7-3-1 detected (steady tone, with longing) [46s]
Tirren, under Starfall Ridge, sequence complete (deep echo, with peace) [102s]
```

---

### License
MIT or Creative Commons - for educational, narrative, and artistic use.

