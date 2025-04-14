export class AudioProcessor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.isPlaying = false;

    // Set canvas size
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = 150;

    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = this.canvas.offsetWidth;
      this.updateVisualizer();
    });
  }

  initialize(audioElement) {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    this.source = this.audioCtx.createMediaElementSource(audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
  }

  updateVisualizer() {
    if (!this.isPlaying) return;

    requestAnimationFrame(() => this.updateVisualizer());
    this.analyser.getByteFrequencyData(this.dataArray);

    // Clear canvas
    this.ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-color');
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw frequency bars
    const barWidth = (this.canvas.width / this.dataArray.length) * 2.5;
    let x = 0;
    let peak = 0;
    let total = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      const barHeight = this.dataArray[i];
      total += barHeight;
      if (barHeight > this.dataArray[peak]) peak = i;

      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, '#4a90e2');
      gradient.addColorStop(1, '#1a3a4a');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, this.canvas.height - barHeight / 2, barWidth, barHeight / 2);

      x += barWidth + 1;
    }

    return {
      peakFrequency: peak * (this.audioCtx.sampleRate / 2) / this.dataArray.length,
      averageVolume: total / this.dataArray.length
    };
  }

  start() {
    this.isPlaying = true;
    this.updateVisualizer();
  }

  stop() {
    this.isPlaying = false;
  }

  getAudioData() {
    if (!this.analyser || !this.dataArray) return null;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    let total = 0;
    let peak = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      total += this.dataArray[i];
      if (this.dataArray[i] > this.dataArray[peak]) peak = i;
    }

    return {
      peakFrequency: peak * (this.audioCtx.sampleRate / 2) / this.dataArray.length,
      averageVolume: total / this.dataArray.length
    };
  }
} 