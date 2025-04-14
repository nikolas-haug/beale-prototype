import { AudioProcessor } from './audioProcessor.js';
import { PhraseGenerator } from './phraseGenerator.js';
import { LogManager } from './logManager.js';

class BEALELite {
  constructor() {
    // DOM Elements
    this.audioFile = document.getElementById('audioFile');
    this.audio = document.getElementById('audio');
    this.canvas = document.getElementById('visualizer');
    this.phraseOutput = document.getElementById('phrase');
    this.logList = document.getElementById('logList');
    this.emotionalistMode = document.getElementById('emotionalistMode');
    this.analystMode = document.getElementById('analystMode');
    this.copyLog = document.getElementById('copyLog');
    this.exportTxt = document.getElementById('exportTxt');
    this.exportJson = document.getElementById('exportJson');
    this.clearLog = document.getElementById('clearLog');

    // Initialize modules
    this.audioProcessor = new AudioProcessor(this.canvas);
    this.phraseGenerator = new PhraseGenerator();
    this.logManager = new LogManager(this.logList);

    // State
    this.currentMode = 'emotionalist';
    this.lastLoggedTime = 0;
    this.logInterval = 4; // seconds between logs

    // Bind event handlers
    this.bindEvents();
  }

  bindEvents() {
    // Audio file selection
    this.audioFile.addEventListener('change', (e) => this.handleFileSelect(e));

    // Audio playback
    this.audio.addEventListener('play', () => {
      this.audioProcessor.initialize(this.audio);
      this.audioProcessor.start();
      this.lastLoggedTime = 0;
    });

    this.audio.addEventListener('pause', () => {
      this.audioProcessor.stop();
    });

    // Mode selection
    this.emotionalistMode.addEventListener('click', () => this.setMode('emotionalist'));
    this.analystMode.addEventListener('click', () => this.setMode('analyst'));

    // Log controls
    this.copyLog.addEventListener('click', () => this.logManager.copyToClipboard());
    this.exportTxt.addEventListener('click', () => this.logManager.exportAsTxt());
    this.exportJson.addEventListener('click', () => this.logManager.exportAsJson());
    this.clearLog.addEventListener('click', () => this.logManager.clearLog());

    // Animation frame for phrase generation
    requestAnimationFrame(() => this.update());
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    this.audio.src = url;
  }

  setMode(mode) {
    this.currentMode = mode;
    this.emotionalistMode.classList.toggle('active', mode === 'emotionalist');
    this.analystMode.classList.toggle('active', mode === 'analyst');
  }

  update() {
    requestAnimationFrame(() => this.update());

    if (!this.audioProcessor.isPlaying) return;

    const audioData = this.audioProcessor.getAudioData();
    if (!audioData) return;

    const currentTime = this.audio.currentTime;
    if (currentTime - this.lastLoggedTime >= this.logInterval) {
      const phrase = this.phraseGenerator.generatePhrase(
        audioData.peakFrequency,
        audioData.averageVolume,
        currentTime,
        this.currentMode
      );

      this.phraseOutput.textContent = phrase;
      this.logManager.addPhrase(phrase);
      this.lastLoggedTime = currentTime;
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new BEALELite();
}); 