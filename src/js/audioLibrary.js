import audioLibraryData from '../data/audioLibrary.json';

export class AudioLibrary {
  constructor(onAnalyzeLibraryAudio, onAudioLoaded) {
    this.audioFiles = audioLibraryData.audioFiles;
    this.select = document.getElementById('audioLibrary');
    this.audioElement = document.getElementById('audio');
    this.descriptionDiv = document.getElementById('audioDescription');
    this.analyzeBtn = document.getElementById('analyzeLibraryAudio');
    this.onAnalyzeLibraryAudio = onAnalyzeLibraryAudio;
    this.onAudioLoaded = onAudioLoaded;
    this.selectedFile = null;
    this.initializeLibrary();
  }

  initializeLibrary() {
    // Populate the dropdown with audio files
    this.audioFiles.forEach(file => {
      const option = document.createElement('option');
      option.value = file.filename;
      option.textContent = `${file.title} (${file.duration})`;
      this.select.appendChild(option);
    });

    // Add event listener for selection changes
    this.select.addEventListener('change', (e) => {
      const selected = this.audioFiles.find(f => f.filename === e.target.value);
      if (selected) {
        this.selectedFile = selected;
        this.loadAudioFile(selected.filename);
        this.descriptionDiv.innerHTML = `<strong>Description:</strong> ${selected.description}<br><strong>Source:</strong> ${selected.source}`;
        this.analyzeBtn.disabled = false;
        this.analyzeBtn.classList.add('show');
        if (this.onAudioLoaded) {
          this.onAudioLoaded();
        }
      } else {
        this.selectedFile = null;
        this.descriptionDiv.innerHTML = '';
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.classList.remove('show');
        if (this.onAudioLoaded) {
          this.onAudioLoaded(false);
        }
      }
    });

    // Analyze button event
    this.analyzeBtn.addEventListener('click', () => {
      if (this.selectedFile && this.onAnalyzeLibraryAudio) {
        this.onAnalyzeLibraryAudio(this.selectedFile);
      }
    });
  }

  loadAudioFile(filename) {
    const audioPath = `/public/audio/${filename}`;
    this.audioElement.src = audioPath;
    this.audioElement.load();
  }

  getCurrentAudio() {
    return this.audioElement;
  }
} 