import { AudioProcessor } from './audioProcessor.js';
import { PhraseGenerator } from './phraseGenerator.js';
import { LogManager } from './logManager.js';
import { AudioLibrary } from './audioLibrary.js';

class BEALELite {
  constructor() {
    console.log('Initializing BEALELite...');
    
    // DOM Elements
    this.audioFile = document.getElementById('audioFile');
    this.audio = document.getElementById('audio');
    this.canvas = document.getElementById('visualizer');
    this.spectrogramCanvas = document.getElementById('spectrogram');
    this.phraseOutput = document.getElementById('phrase');
    this.logList = document.getElementById('logList');
    this.emotionalistMode = document.getElementById('emotionalistMode');
    this.analystMode = document.getElementById('analystMode');
    this.copyLog = document.getElementById('copyLog');
    this.exportTxt = document.getElementById('exportTxt');
    this.exportJson = document.getElementById('exportJson');
    this.clearLog = document.getElementById('clearLog');
    this.customPlayBtn = document.getElementById('customPlay');
    this.playIcon = document.getElementById('playIcon');
    this.pauseIcon = document.getElementById('pauseIcon');
    this.audioStatus = document.getElementById('audioStatus');
    this.audioProgressBar = document.getElementById('audioProgressBar');
    this.audioProgress = document.getElementById('audioProgress');
    this.audioCurrentTime = document.getElementById('audioCurrentTime');
    this.audioDuration = document.getElementById('audioDuration');
    this.customAudioInterface = document.querySelector('.custom-audio-interface');
    this.hazyModeNote = document.getElementById('hazyModeNote');
    this.unitIndex = 0;
    this.lastUnitTime = 0;
    this.nextPhraseTime = 0;
    this.wasHazyMode = false;

    console.log('DOM elements initialized:', {
      audioFile: !!this.audioFile,
      audio: !!this.audio,
      canvas: !!this.canvas,
      spectrogramCanvas: !!this.spectrogramCanvas
    });

    // Initialize modules
    this.audioProcessor = new AudioProcessor(this.canvas, this.spectrogramCanvas);
    this.phraseGenerator = new PhraseGenerator();
    this.logManager = new LogManager(this.logList);

    // State
    this.currentMode = 'emotionalist';
    this.lastLoggedTime = 0;
    this.logInterval = 4; // seconds between logs
    this.isAudioInitialized = false;
    this.analyzedUnits = [];

    // Bind event handlers
    this.bindEvents();
  }

  bindEvents() {
    console.log('Binding events...');
    
    // Audio file selection
    this.audioFile.addEventListener('change', async (e) => {
      console.log('File selected, handling file select...');
      await this.handleFileSelect(e);
    });

    // Audio playback
    this.audio.addEventListener('play', () => {
      console.log('Audio playback started...');
      if (!this.isAudioInitialized) {
        console.log('Initializing audio processor...');
        this.audioProcessor.initialize(this.audio);
        this.isAudioInitialized = true;
      }
      this.audioProcessor.start();
      this.lastLoggedTime = 0;
      this.playIcon.style.display = 'none';
      this.pauseIcon.style.display = '';
    });

    this.audio.addEventListener('pause', () => {
      console.log('Audio paused, stopping audio processor...');
      this.audioProcessor.stop();
      this.playIcon.style.display = '';
      this.pauseIcon.style.display = 'none';
    });

    // Mode selection
    this.emotionalistMode.addEventListener('click', () => this.setMode('emotionalist'));
    this.analystMode.addEventListener('click', () => this.setMode('analyst'));

    // Log controls
    this.copyLog.addEventListener('click', () => this.logManager.copyToClipboard());
    this.exportTxt.addEventListener('click', () => this.logManager.exportAsTxt());
    this.exportJson.addEventListener('click', () => this.logManager.exportAsJson());
    this.clearLog.addEventListener('click', () => this.logManager.clearLog());

    // Custom play/pause button logic
    this.customPlayBtn.addEventListener('click', () => {
      if (this.audio.src && !this.customPlayBtn.disabled) {
        if (this.audio.paused) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      }
    });

    // Animation frame for phrase generation
    requestAnimationFrame(() => this.update());

    // Custom audio progress bar logic
    this.audio.addEventListener('timeupdate', () => {
      this.updateAudioProgress();
    });
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateAudioProgress();
    });
    this.audioProgressBar.addEventListener('click', (e) => {
      const rect = this.audioProgressBar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      if (!isNaN(this.audio.duration)) {
        this.audio.currentTime = percent * this.audio.duration;
      }
    });
  }

  async handleFileSelect(event) {
    console.log('Handling file select...');
    const file = event.target.files[0];
    if (!file) {
      console.log('No file selected');
      this.setAudioLoadedState(false);
      return;
    }

    console.log('File selected:', file.name);
    
    try {
      // Show loading state
      this.phraseOutput.textContent = 'Analyzing audio file';
      this.phraseOutput.classList.add('loading-text');
      
      // Analyze the file before playing
      const analysis = await this.audioProcessor.analyzeAudioFile(file);
      this.analyzedUnits = analysis.units;
      this.unitIndex = 0;
      this.lastUnitTime = 0;
      this.nextPhraseTime = 0;
      
      // Remove loading state
      this.phraseOutput.classList.remove('loading-text');
      
      console.log('Analysis results:', {
        numberOfUnits: this.analyzedUnits.length,
        duration: analysis.duration,
        sampleRate: analysis.sampleRate
      });

      // Log detailed information about each unit
      this.logManager.addPhrase(`Found ${this.analyzedUnits.length} distinct units in the audio file (${analysis.duration.toFixed(2)} seconds):`);
      
      this.analyzedUnits.forEach((unit, index) => {
        const startTime = unit.startTime.toFixed(2);
        const endTime = unit.endTime.toFixed(2);
        const duration = unit.duration.toFixed(2);
        const dominantFreq = unit.dominantFrequency.toFixed(0);
        const avgIntensity = unit.averageIntensity.toFixed(1);
        
        const unitInfo = [
          `Unit ${index + 1}:`,
          `  Time: ${startTime}s to ${endTime}s (duration: ${duration}s)`,
          `  Dominant Frequency: ${dominantFreq} Hz`,
          `  Average Intensity: ${avgIntensity} dB`,
          `  Peak Frequencies Range: ${Math.min(...unit.peakFrequencies).toFixed(0)}Hz - ${Math.max(...unit.peakFrequencies).toFixed(0)}Hz`
        ].join('\n');
        
        this.logManager.addPhrase(unitInfo);
      });

      // Create object URL and set up audio
      const url = URL.createObjectURL(file);
      this.audio.src = url;
      
      // Reset audio initialization flag
      this.isAudioInitialized = false;
      
      // Update status
      this.phraseOutput.textContent = 'Analysis complete - Ready to play';
      
      // Remove existing unit view if present
      const existingUnitView = document.getElementById('unit-view');
      if (existingUnitView) {
        existingUnitView.remove();
      }

      // Create and add new unit view
      if (analysis.units && analysis.units.length > 0) {
        const unitView = this.createUnitView(analysis.units);
        document.querySelector('.container').appendChild(unitView);
      }

      this.setAudioLoadedState(true);

    } catch (error) {
      console.error('Error analyzing file:', error);
      this.phraseOutput.textContent = 'Error analyzing audio file';
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    this.emotionalistMode.classList.toggle('active', mode === 'emotionalist');
    this.analystMode.classList.toggle('active', mode === 'analyst');
    
    // Update UI elements based on mode
    if (mode === 'analyst') {
      this.phraseOutput.classList.add('analyst-mode');
      this.phraseOutput.classList.remove('emotionalist-mode');
      if (this.hazyModeNote) {
        this.hazyModeNote.textContent = 'Analyst Mode: Technical interpretation of audio patterns and signals';
      }
    } else {
      this.phraseOutput.classList.add('emotionalist-mode');
      this.phraseOutput.classList.remove('analyst-mode');
      if (this.hazyModeNote) {
        this.hazyModeNote.textContent = 'Emotionalist Mode: Poetic interpretation of whale song';
      }
    }
    
    // Generate a new phrase in the current mode if audio is playing
    if (this.audioProcessor.isPlaying) {
      const audioData = this.audioProcessor.getAudioData();
      if (audioData) {
        const phrase = this.phraseGenerator.generatePhrase(
          audioData.peakFrequency,
          audioData.averageVolume,
          this.audio.currentTime,
          mode
        );
        this.phraseOutput.textContent = phrase;
        this.logManager.addPhrase(`[Mode Switch] ${phrase}`);
      }
    }
  }

  update() {
    requestAnimationFrame(() => this.update());

    if (!this.audioProcessor.isPlaying) return;

    const audioData = this.audioProcessor.getAudioData();
    if (!audioData) return;

    const currentTime = this.audio.currentTime;
    const units = this.analyzedUnits && this.analyzedUnits.length > 0 ? this.analyzedUnits : null;

    if (units) {
      // If we just switched from hazy mode, show a note
      if (this.wasHazyMode && this.hazyModeNote) {
        this.hazyModeNote.textContent = 'Units detected: Interpretation is now synchronized to song structure.';
        this.hazyModeNote.style.display = '';
        setTimeout(() => {
          if (this.hazyModeNote.textContent.startsWith('Units detected')) {
            this.hazyModeNote.style.display = 'none';
          }
        }, 3500);
      } else if (this.hazyModeNote && !this.hazyModeNote.textContent.startsWith('Units detected')) {
        this.hazyModeNote.style.display = 'none';
      }
      this.wasHazyMode = false;
      // Sync phrase display to unit start times
      if (this.unitIndex < units.length && currentTime >= units[this.unitIndex].startTime) {
        const phrase = this.phraseGenerator.generatePhrase(
          audioData.peakFrequency,
          audioData.averageVolume,
          currentTime,
          this.currentMode
        );
        this.phraseOutput.textContent = phrase;
        this.logManager.addPhrase(phrase);
        this.lastUnitTime = currentTime;
        this.unitIndex++;
      }
      // Reset unit index if audio is restarted
      if (currentTime < this.lastUnitTime) {
        this.unitIndex = 0;
      }
    } else {
      // Hazy mode: show note and use dynamic interval
      if (this.hazyModeNote) {
        this.hazyModeNote.textContent = 'Hazy Mode: No clear units detected—interpretation is experimental';
        this.hazyModeNote.style.display = '';
      }
      this.wasHazyMode = true;
      // Dynamic interval based on volume (louder = faster)
      const minInterval = 2;
      const maxInterval = 6;
      const volume = audioData.averageVolume || 0;
      const dynamicInterval = maxInterval - ((volume / 255) * (maxInterval - minInterval));
      if (currentTime >= this.nextPhraseTime) {
        const phrase = this.phraseGenerator.generatePhrase(
          audioData.peakFrequency,
          audioData.averageVolume,
          currentTime,
          this.currentMode
        );
        this.phraseOutput.textContent = phrase;
        this.logManager.addPhrase(phrase);
        this.nextPhraseTime = currentTime + dynamicInterval;
      }
    }
  }

  createUnitView(units) {
    const unitViewContainer = document.createElement('div');
    unitViewContainer.id = 'unit-view';
    unitViewContainer.style.cssText = `
      margin-top: 20px;
      padding: 20px;
      background: var(--secondary-bg);
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Detected Units';
    title.style.marginBottom = '15px';
    unitViewContainer.appendChild(title);

    const unitsGrid = document.createElement('div');
    unitsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    `;

    units.forEach((unit, index) => {
      const unitCard = document.createElement('div');
      unitCard.className = 'unit-card';
      unitCard.style.cssText = `
        padding: 15px;
        background: var(--primary-bg);
        border-radius: 6px;
        border: 1px solid var(--border-color);
      `;

      const unitTitle = document.createElement('h3');
      unitTitle.textContent = `Unit ${index + 1}`;
      unitTitle.style.marginBottom = '10px';

      // Create mini spectrogram canvas
      const spectrogramCanvas = document.createElement('canvas');
      spectrogramCanvas.width = 280; // Adjust based on card width
      spectrogramCanvas.height = 80;
      spectrogramCanvas.style.cssText = `
        width: 100%;
        height: 80px;
        background: #000;
        border-radius: 4px;
        margin-bottom: 10px;
      `;

      // Draw the unit's spectrogram
      this.drawUnitSpectrogram(spectrogramCanvas, unit);

      const details = document.createElement('div');
      details.innerHTML = `
        <div style="margin-bottom: 8px;">
          <strong>Time Range:</strong> ${unit.startTime.toFixed(2)}s - ${unit.endTime.toFixed(2)}s
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Duration:</strong> ${unit.duration.toFixed(2)}s
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Dominant Frequency:</strong> ${unit.dominantFrequency.toFixed(1)} Hz
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Average Intensity:</strong> ${unit.averageIntensity.toFixed(1)} dB
        </div>
      `;

      // Add play button with progress indicator
      const playButton = document.createElement('button');
      playButton.textContent = 'Play Unit';
      playButton.style.cssText = `
        background: var(--accent-color);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        width: 100%;
        position: relative;
        overflow: hidden;
      `;

      // Add progress bar
      const progressBar = document.createElement('div');
      progressBar.style.cssText = `
        position: absolute;
        left: 0;
        bottom: 0;
        height: 2px;
        width: 0%;
        background: rgba(255, 255, 255, 0.5);
        transition: width 0.1s linear;
      `;
      playButton.appendChild(progressBar);

      let isPlaying = false;
      playButton.onclick = () => {
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          if (isPlaying) {
            audioElement.pause();
            playButton.textContent = 'Play Unit';
            progressBar.style.width = '0%';
            isPlaying = false;
          } else {
            audioElement.currentTime = unit.startTime;
            audioElement.play();
            playButton.textContent = 'Stop';
            isPlaying = true;

            // Update progress bar
            const updateProgress = () => {
              if (!isPlaying) return;
              const progress = ((audioElement.currentTime - unit.startTime) / unit.duration) * 100;
              progressBar.style.width = `${Math.min(100, progress)}%`;
              
              if (audioElement.currentTime < unit.startTime + unit.duration && isPlaying) {
                requestAnimationFrame(updateProgress);
              } else {
                // Reset when finished
                isPlaying = false;
                playButton.textContent = 'Play Unit';
                progressBar.style.width = '0%';
              }
            };
            updateProgress();

            // Stop after unit duration
            setTimeout(() => {
              if (isPlaying) {
                audioElement.pause();
                playButton.textContent = 'Play Unit';
                progressBar.style.width = '0%';
                isPlaying = false;
              }
            }, unit.duration * 1000);
          }
        }
      };

      unitCard.appendChild(unitTitle);
      unitCard.appendChild(spectrogramCanvas);
      unitCard.appendChild(details);
      unitCard.appendChild(playButton);
      unitsGrid.appendChild(unitCard);
    });

    unitViewContainer.appendChild(unitsGrid);
    return unitViewContainer;
  }

  drawUnitSpectrogram(canvas, unit) {
    const ctx = canvas.getContext('2d');
    const slices = unit.spectrogramSlices;
    
    if (!slices || slices.length === 0) return;

    const sliceWidth = canvas.width / slices.length;
    const height = canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find min and max intensity values for normalization
    let minIntensity = Infinity;
    let maxIntensity = -Infinity;
    slices.forEach(slice => {
      slice.forEach(intensity => {
        minIntensity = Math.min(minIntensity, intensity);
        maxIntensity = Math.max(maxIntensity, intensity);
      });
    });

    // Use default range if we don't have valid min/max
    if (!isFinite(minIntensity)) minIntensity = -90;
    if (!isFinite(maxIntensity)) maxIntensity = -30;

    slices.forEach((slice, i) => {
      const x = i * sliceWidth;
      
      // Draw each frequency bin in the slice
      slice.forEach((intensity, j) => {
        // Normalize intensity to 0-1 range
        const normalizedIntensity = (intensity - minIntensity) / (maxIntensity - minIntensity);
        const y = height * (j / slice.length);
        const binHeight = height / slice.length;

        // Use the same gradient as main spectrogram
        const colorIndex = Math.floor(normalizedIntensity * 255);
        const color = this.getSpectrogramColor(colorIndex);
        ctx.fillStyle = color;
        ctx.fillRect(x, height - y, sliceWidth, -binHeight);
      });
    });
  }

  getSpectrogramColor(index) {
    // Create a gradient similar to the main spectrogram
    if (index < 64) {
      return `rgb(0, 0, ${Math.floor(index * 4)})`;
    } else if (index < 128) {
      return `rgb(0, ${Math.floor((index - 64) * 4)}, 255)`;
    } else if (index < 192) {
      return `rgb(${Math.floor((index - 128) * 4)}, 255, ${Math.floor(255 - (index - 128) * 4)})`;
    } else {
      return `rgb(255, ${Math.floor(255 - (index - 192) * 4)}, 0)`;
    }
  }

  setAudioLoadedState(loaded) {
    if (loaded) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.customPlayBtn.disabled = false;
      this.playIcon.style.display = '';
      this.pauseIcon.style.display = 'none';
      this.audioStatus.textContent = '';
      this.customAudioInterface.classList.add('audio-loaded');
    } else {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.customPlayBtn.disabled = true;
      this.playIcon.style.display = '';
      this.pauseIcon.style.display = 'none';
      this.audioStatus.textContent = 'No audio loaded. Please select or upload a track.';
      this.customAudioInterface.classList.remove('audio-loaded');
    }
  }

  async analyzeLibraryAudio(libraryFile) {
    // Fetch the audio file as a Blob and analyze it
    try {
      this.phraseOutput.textContent = 'Analyzing audio file';
      this.phraseOutput.classList.add('loading-text');
      const response = await fetch(`audio/${libraryFile.filename}`);
      const blob = await response.blob();
      const file = new File([blob], libraryFile.filename, { type: blob.type });
      await this.handleFileSelect({ target: { files: [file] } });
      this.unitIndex = 0;
      this.lastUnitTime = 0;
      this.nextPhraseTime = 0;
    } catch (error) {
      this.phraseOutput.textContent = 'Error analyzing audio file';
      console.error('Error analyzing library audio:', error);
    }
  }

  updateAudioProgress() {
    const duration = this.audio.duration || 0;
    const currentTime = this.audio.currentTime || 0;
    const percent = duration ? (currentTime / duration) * 100 : 0;
    this.audioProgress.style.width = percent + '%';
    this.audioCurrentTime.textContent = this.formatTime(currentTime);
    this.audioDuration.textContent = this.formatTime(duration);
  }

  formatTime(time) {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  let bealeLiteInstance;
  new AudioLibrary(
    (libraryFile) => {
      if (!bealeLiteInstance) return;
      bealeLiteInstance.analyzeLibraryAudio(libraryFile);
    },
    (loaded = true) => {
      if (!bealeLiteInstance) return;
      bealeLiteInstance.setAudioLoadedState(loaded);
    }
  );
  bealeLiteInstance = new BEALELite();
}); 