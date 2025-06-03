export class AudioProcessor {
  constructor(canvas, spectrogramCanvas) {
    this.canvas = canvas;
    this.spectrogramCanvas = spectrogramCanvas;
    this.ctx = canvas.getContext('2d');
    this.spectrogramCtx = spectrogramCanvas.getContext('2d');
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.isPlaying = false;
    this.spectrogramData = [];
    this.maxSpectrogramLength = 200;
    this.fftSize = 2048;
    this.audioDuration = 0;
    this.audioElement = null;
    
    // Initialize frequency data arrays
    this.dataArray = null;
    this.freqData = null;

    console.log('Initializing AudioProcessor with spectrogram:', {
      canvas: !!canvas,
      spectrogramCanvas: !!spectrogramCanvas
    });

    // Set canvas sizes
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = 150;
    this.spectrogramCanvas.width = this.spectrogramCanvas.offsetWidth;
    this.spectrogramCanvas.height = 150;

    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = this.canvas.offsetWidth;
      this.spectrogramCanvas.width = this.spectrogramCanvas.offsetWidth;
      this.updateVisualizer();
    });

    // Create gradient for spectrogram
    this.spectrogramGradient = this.createSpectrogramGradient();

    // Add storage for analyzed units
    this.analyzedUnits = [];
    this.unitThreshold = -70; // Changed to dB threshold for frequency data
    this.minUnitDuration = 0.2;
    this.maxUnitDuration = 2.0;
  }

  createSpectrogramGradient() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0.0, '#000060');   // Dark blue for low intensity
    gradient.addColorStop(0.5, '#00ff00');   // Green for medium intensity
    gradient.addColorStop(0.75, '#ffff00');  // Yellow for high intensity
    gradient.addColorStop(1.0, '#ff0000');   // Red for peak intensity
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 256);
    return ctx.getImageData(0, 0, 1, 256).data;
  }

  initialize(audioElement) {
    console.log('Initializing audio context and analyser');
    this.audioElement = audioElement;
    this.audioDuration = audioElement.duration;
    
    // Create audio context if it doesn't exist
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create analyser if it doesn't exist
    if (!this.analyser) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -30;
      this.analyser.smoothingTimeConstant = 0.85;
      
      // Initialize data arrays with correct size
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    // Only create a new source if the audio element has changed
    if (!this.source || this.source.mediaElement !== audioElement) {
      if (this.source) {
        try {
          this.source.disconnect();
        } catch (e) {
          console.log('No need to disconnect source');
        }
      }
      try {
        this.source = this.audioCtx.createMediaElementSource(audioElement);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      } catch (e) {
        console.log('Error connecting audio source:', e);
        if (e.name !== 'InvalidStateError') {
          throw e;
        }
      }
    }
  }

  updateVisualizer() {
    if (!this.isPlaying) return;

    requestAnimationFrame(() => this.updateVisualizer());
    
    // Make sure we have our data arrays
    if (!this.dataArray || !this.freqData) {
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // Update spectrogram first
    this.updateSpectrogram();
    
    // Clear frequency visualizer canvas
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

  updateSpectrogram() {
    if (!this.isPlaying || !this.freqData) return;

    // Get latest frequency data
    this.analyser.getByteFrequencyData(this.freqData);

    // Move existing data to the right
    const imageData = this.spectrogramCtx.getImageData(0, 0, this.spectrogramCanvas.width, this.spectrogramCanvas.height);
    this.spectrogramCtx.clearRect(0, 0, this.spectrogramCanvas.width, this.spectrogramCanvas.height);
    this.spectrogramCtx.putImageData(imageData, 1, 0);

    // Draw new column of data
    const sliceHeight = this.spectrogramCanvas.height / this.analyser.frequencyBinCount;
    const columnData = this.spectrogramCtx.createImageData(1, this.spectrogramCanvas.height);
    
    // Fill the column with frequency data
    for (let i = 0; i < this.freqData.length; i++) {
      const value = this.freqData[i];
      const y = Math.floor(i * sliceHeight);
      
      // Normalize value to 0-255 range
      const normalizedValue = Math.floor((value / 255) * 255);
      
      // Get color from gradient
      const r = this.spectrogramGradient[normalizedValue * 4];
      const g = this.spectrogramGradient[normalizedValue * 4 + 1];
      const b = this.spectrogramGradient[normalizedValue * 4 + 2];
      
      // Set pixel colors for this frequency bin
      for (let j = 0; j < sliceHeight && y + j < this.spectrogramCanvas.height; j++) {
        const pixelIndex = (y + j) * 4;
        columnData.data[pixelIndex] = r;
        columnData.data[pixelIndex + 1] = g;
        columnData.data[pixelIndex + 2] = b;
        columnData.data[pixelIndex + 3] = 255;
      }
    }
    
    // Draw the new column
    this.spectrogramCtx.putImageData(columnData, 0, 0);

    // Draw time marker and unit markers
    this.drawTimeMarker();
    this.drawUnitMarkers();
  }

  drawTimeMarker() {
    if (!this.audioElement || !this.isPlaying) return;
    
    const currentTime = this.audioElement.currentTime;
    const markerX = (currentTime / this.audioDuration) * this.spectrogramCanvas.width;
    
    this.spectrogramCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.spectrogramCtx.lineWidth = 1;
    this.spectrogramCtx.beginPath();
    this.spectrogramCtx.moveTo(markerX, 0);
    this.spectrogramCtx.lineTo(markerX, this.spectrogramCanvas.height);
    this.spectrogramCtx.stroke();
  }

  drawUnitMarkers() {
    if (!this.analyzedUnits || !this.analyzedUnits.length) return;
    
    this.analyzedUnits.forEach((unit, index) => {
      const startX = (unit.startTime / this.audioDuration) * this.spectrogramCanvas.width;
      const endX = (unit.endTime / this.audioDuration) * this.spectrogramCanvas.width;
      
      // Draw subtle unit region highlight
      this.spectrogramCtx.fillStyle = 'rgba(0, 255, 0, 0.05)';
      this.spectrogramCtx.fillRect(startX, 0, endX - startX, this.spectrogramCanvas.height);
      
      // Draw unit boundaries
      this.spectrogramCtx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      this.spectrogramCtx.lineWidth = 1;
      this.spectrogramCtx.beginPath();
      this.spectrogramCtx.moveTo(startX, 0);
      this.spectrogramCtx.lineTo(startX, this.spectrogramCanvas.height);
      this.spectrogramCtx.moveTo(endX, 0);
      this.spectrogramCtx.lineTo(endX, this.spectrogramCanvas.height);
      this.spectrogramCtx.stroke();
    });
  }

  detectUnits() {
    // Simple unit detection based on volume changes
    const units = [];
    let currentUnit = { start: 0, end: 0, data: [] };
    let silenceThreshold = 20; // Adjust based on your audio
    
    for (let i = 0; i < this.spectrogramData.length; i++) {
      const avgVolume = this.spectrogramData[i].reduce((a, b) => a + b, 0) / this.spectrogramData[i].length;
      
      if (avgVolume > silenceThreshold) {
        if (currentUnit.start === 0) {
          currentUnit.start = i;
        }
        currentUnit.data.push(this.spectrogramData[i]);
      } else if (currentUnit.start !== 0) {
        currentUnit.end = i;
        units.push(currentUnit);
        currentUnit = { start: 0, end: 0, data: [] };
      }
    }
    
    return units;
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
      averageVolume: total / this.dataArray.length,
      units: this.detectUnits()
    };
  }

  async analyzeAudioFile(file) {
    console.log('Analyzing audio file...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const analysisContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await analysisContext.decodeAudioData(arrayBuffer);
      
      // Set up analyzer node for analysis
      const analyzer = analysisContext.createAnalyser();
      analyzer.fftSize = this.fftSize;
      analyzer.minDecibels = -90;
      analyzer.maxDecibels = -30;
      analyzer.smoothingTimeConstant = 0.8;
      
      const bufferLength = analyzer.frequencyBinCount;
      
      // Calculate how many time slices we need based on duration and FFT size
      const samplesPerSlice = this.fftSize;
      const totalSlices = Math.ceil(audioBuffer.length / samplesPerSlice);
      
      console.log('Analysis parameters:', {
        fftSize: this.fftSize,
        bufferLength,
        totalSlices,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        totalSamples: audioBuffer.length
      });

      // Get the audio data
      const audioData = audioBuffer.getChannelData(0); // Get first channel

      // Storage for the complete spectrogram data
      const spectrogramData = new Float32Array(totalSlices * bufferLength);
      
      // Process each slice
      console.log('Starting slice processing...');
      
      // Create temporary canvas for spectrogram
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = totalSlices;
      tempCanvas.height = bufferLength;
      const canvasCtx = tempCanvas.getContext('2d');

      // Process each slice
      for (let sliceIndex = 0; sliceIndex < totalSlices; sliceIndex++) {
        // Extract audio data for this slice
        const start = sliceIndex * samplesPerSlice;
        const end = Math.min(start + samplesPerSlice, audioData.length);
        const sliceLength = end - start;

        // Check max amplitude before processing
        let maxAmplitude = 0;
        for (let i = 0; i < sliceLength; i++) {
          maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[start + i]));
        }

        // Skip processing if the slice is too quiet
        if (maxAmplitude < 0.01) {
          // Fill with silence
          for (let j = 0; j < this.fftSize / 2; j++) {
            spectrogramData[sliceIndex * bufferLength + j] = -90;  // Use minimum dB value
          }
          continue;
        }

        // Create a new context and analyzer for this slice
        const fftContext = new OfflineAudioContext(1, this.fftSize, audioBuffer.sampleRate);
        const fftAnalyzer = fftContext.createAnalyser();
        fftAnalyzer.fftSize = this.fftSize;
        fftAnalyzer.minDecibels = -90;  // Adjusted for better dynamic range
        fftAnalyzer.maxDecibels = -30;
        fftAnalyzer.smoothingTimeConstant = 0.0;

        // Create a buffer for this slice
        const sliceBuffer = fftContext.createBuffer(1, this.fftSize, audioBuffer.sampleRate);
        const sliceData = sliceBuffer.getChannelData(0);

        // Copy data and apply Hanning window
        for (let i = 0; i < this.fftSize; i++) {
          if (i < sliceLength) {
            // Apply Hanning window to reduce spectral leakage
            const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / sliceLength));
            sliceData[i] = audioData[start + i] * windowValue;
          } else {
            sliceData[i] = 0; // Zero padding
          }
        }

        // Set up source with the slice data
        const sliceSource = fftContext.createBufferSource();
        sliceSource.buffer = sliceBuffer;
        sliceSource.connect(fftAnalyzer);
        fftAnalyzer.connect(fftContext.destination);

        // Create a promise to handle the rendering
        const renderPromise = new Promise((resolve, reject) => {
          fftContext.oncomplete = (e) => resolve(e.renderedBuffer);
          fftContext.onerror = reject;
        });

        // Start the source and wait for rendering
        sliceSource.start(0);
        await fftContext.startRendering();
        await renderPromise;  // Wait for the rendering to complete
        
        // Get frequency data
        const freqData = new Float32Array(fftAnalyzer.frequencyBinCount);
        fftAnalyzer.getFloatFrequencyData(freqData);

        // Store frequency data
        for (let j = 0; j < fftAnalyzer.frequencyBinCount; j++) {
          spectrogramData[sliceIndex * bufferLength + j] = freqData[j];
        }

        // Draw this slice to the temporary canvas
        const imageData = canvasCtx.createImageData(1, bufferLength);
        for (let j = 0; j < bufferLength; j++) {
          // Normalize the value from dB scale to 0-1 range
          const dbValue = freqData[j];
          const normalizedValue = (dbValue - fftAnalyzer.minDecibels) / 
            (fftAnalyzer.maxDecibels - fftAnalyzer.minDecibels);
          
          // Ensure the value is within 0-1 range
          const colorValue = Math.max(0, Math.min(1, normalizedValue));
          const colorIndex = Math.floor(colorValue * 255);
          
          // Get color from gradient
          const r = this.spectrogramGradient[colorIndex * 4];
          const g = this.spectrogramGradient[colorIndex * 4 + 1];
          const b = this.spectrogramGradient[colorIndex * 4 + 2];
          
          const pixelIndex = (bufferLength - 1 - j) * 4; // Flip vertically
          imageData.data[pixelIndex] = r;
          imageData.data[pixelIndex + 1] = g;
          imageData.data[pixelIndex + 2] = b;
          imageData.data[pixelIndex + 3] = 255;
        }
        canvasCtx.putImageData(imageData, sliceIndex, 0);

        // Log progress periodically
        if (sliceIndex % 100 === 0) {
          console.log(`Processing slice ${sliceIndex}/${totalSlices}`, {
            timeOffset: sliceIndex * samplesPerSlice / audioBuffer.sampleRate,
            maxAmplitude,
            sampleFreqData: freqData.slice(0, 5),
            minValue: Math.min(...freqData),
            maxValue: Math.max(...freqData),
            avgValue: freqData.reduce((a, b) => a + b, 0) / freqData.length
          });
        }
      }

      console.log('Finished processing all slices');
      
      // Store the full spectrogram data and image
      this.fullSpectrogramData = spectrogramData;
      this.fullSpectrogramImage = tempCanvas;
      
      // Detect units using the complete spectrogram data
      this.analyzedUnits = this.detectUnitsFromSpectrogram(
        spectrogramData,
        audioBuffer.sampleRate,
        samplesPerSlice
      );
      
      console.log('Analysis complete:', {
        unitsFound: this.analyzedUnits.length,
        totalSlices,
        spectrogramWidth: tempCanvas.width,
        spectrogramHeight: tempCanvas.height
      });
      
      // Initial render of the spectrogram
      this.renderFullSpectrogram();
      
      return {
        units: this.analyzedUnits,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate
      };
      
    } catch (error) {
      console.error('Error analyzing audio file:', error);
      throw error;
    }
  }

  renderFullSpectrogram() {
    // Clear the canvas
    this.spectrogramCtx.clearRect(0, 0, this.spectrogramCanvas.width, this.spectrogramCanvas.height);
    
    // Draw the full spectrogram
    this.spectrogramCtx.drawImage(
      this.fullSpectrogramImage,
      0, 0,
      this.fullSpectrogramImage.width,
      this.fullSpectrogramImage.height,
      0, 0,
      this.spectrogramCanvas.width,
      this.spectrogramCanvas.height
    );

    // Draw unit markers if available
    if (this.analyzedUnits) {
      this.drawUnitMarkers();
    }

    // Draw current time marker if playing
    if (this.isPlaying && this.audioElement) {
      this.drawTimeMarker();
    }
  }

  updateSpectrogram() {
    if (!this.fullSpectrogramImage) return;
    
    // Re-render the full spectrogram
    this.renderFullSpectrogram();
  }

  drawTimeMarker() {
    if (!this.audioElement) return;
    
    const currentTime = this.audioElement.currentTime;
    const markerX = (currentTime / this.audioDuration) * this.spectrogramCanvas.width;
    
    // Draw time marker
    this.spectrogramCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.spectrogramCtx.lineWidth = 2;
    this.spectrogramCtx.beginPath();
    this.spectrogramCtx.moveTo(markerX, 0);
    this.spectrogramCtx.lineTo(markerX, this.spectrogramCanvas.height);
    this.spectrogramCtx.stroke();
  }

  drawUnitMarkers() {
    if (!this.analyzedUnits) return;
    
    this.analyzedUnits.forEach((unit, index) => {
      const startX = (unit.startTime / this.audioDuration) * this.spectrogramCanvas.width;
      const endX = (unit.endTime / this.audioDuration) * this.spectrogramCanvas.width;
      
      // Draw unit region highlight
      this.spectrogramCtx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      this.spectrogramCtx.fillRect(startX, 0, endX - startX, this.spectrogramCanvas.height);
      
      // Draw unit boundaries
      this.spectrogramCtx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      this.spectrogramCtx.lineWidth = 1;
      this.spectrogramCtx.beginPath();
      this.spectrogramCtx.moveTo(startX, 0);
      this.spectrogramCtx.lineTo(startX, this.spectrogramCanvas.height);
      this.spectrogramCtx.moveTo(endX, 0);
      this.spectrogramCtx.lineTo(endX, this.spectrogramCanvas.height);
      this.spectrogramCtx.stroke();
    });
  }

  detectUnitsFromSpectrogram(spectrogramData, sampleRate, samplesPerSlice) {
    const units = [];
    let currentUnit = null;
    const frequencyBinCount = this.fftSize / 2;
    
    // Calculate the bin indices for whale song frequency range (50Hz to 4000Hz)
    const minBin = Math.floor(50 * this.fftSize / sampleRate);
    const maxBin = Math.floor(4000 * this.fftSize / sampleRate);
    
    // Base threshold and minimum duration
    const baseThreshold = -70;  // Base threshold in dB
    this.minUnitDuration = 0.1; // Shorter minimum duration to catch more potential units
    
    console.log('Unit detection parameters:', {
      minBin,
      maxBin,
      sampleRate,
      samplesPerSlice,
      totalSlices: spectrogramData.length / frequencyBinCount,
      baseThreshold,
      minDuration: this.minUnitDuration
    });

    // First pass: calculate average intensity and standard deviation
    let totalIntensity = 0;
    let intensities = [];
    let frameCount = 0;
    
    for (let i = 0; i < spectrogramData.length / frequencyBinCount; i++) {
      const timeSliceStart = i * frequencyBinCount;
      const whaleFreqBins = spectrogramData.slice(
        timeSliceStart + minBin,
        timeSliceStart + maxBin
      );
      const avgIntensity = whaleFreqBins.reduce((sum, val) => sum + val, 0) / whaleFreqBins.length;
      totalIntensity += avgIntensity;
      intensities.push(avgIntensity);
      frameCount++;
    }
    
    const averageIntensity = totalIntensity / frameCount;
    
    // Calculate standard deviation
    const variance = intensities.reduce((sum, intensity) => {
      const diff = intensity - averageIntensity;
      return sum + (diff * diff);
    }, 0) / frameCount;
    const stdDev = Math.sqrt(variance);
    
    console.log('Signal statistics:', {
      averageIntensity,
      stdDev,
      maxIntensity: Math.max(...intensities),
      minIntensity: Math.min(...intensities)
    });
    
    // Set adaptive threshold to 2 standard deviations above mean
    const adaptiveThreshold = Math.max(baseThreshold, averageIntensity + (2 * stdDev));
    
    console.log('Using adaptive threshold:', adaptiveThreshold);
    
    // Second pass: detect units using adaptive threshold
    let consecutiveFrames = 0;
    const minConsecutiveFrames = Math.ceil(this.minUnitDuration * sampleRate / samplesPerSlice);
    
    for (let i = 0; i < spectrogramData.length / frequencyBinCount; i++) {
      const timeSliceStart = i * frequencyBinCount;
      const timestamp = i * (samplesPerSlice / sampleRate);
      
      // Extract the frequency bins for this time slice
      const whaleFreqBins = spectrogramData.slice(
        timeSliceStart + minBin,
        timeSliceStart + maxBin
      );
      
      // Calculate average intensity for this time slice
      const avgIntensity = whaleFreqBins.reduce((sum, val) => sum + val, 0) / whaleFreqBins.length;
      
      // Debug log every 100th frame
      if (i % 100 === 0) {
        console.log(`Frame ${i}:`, {
          avgIntensity,
          threshold: adaptiveThreshold,
          timestamp,
          consecutiveFrames,
          minConsecutiveFrames
        });
      }
      
      // Detect if this is part of a unit
      if (avgIntensity > adaptiveThreshold) {
        consecutiveFrames++;
        
        if (!currentUnit) {
          console.log(`Potential unit start at ${timestamp}s with intensity ${avgIntensity}dB`);
          currentUnit = {
            startTime: timestamp,
            endTime: timestamp,
            peakFrequencies: [],
            avgIntensity: [],
            spectrogramSlices: []
          };
        }
        
        // Update current unit
        currentUnit.endTime = timestamp;
        
        // Store the full frequency data for this slice
        const fullSlice = spectrogramData.slice(
          timeSliceStart,
          timeSliceStart + frequencyBinCount
        );
        currentUnit.spectrogramSlices.push(Array.from(fullSlice));
        
        // Find peak frequency
        let peakBin = 0;
        let peakValue = whaleFreqBins[0];
        for (let j = 1; j < whaleFreqBins.length; j++) {
          if (whaleFreqBins[j] > peakValue) {
            peakValue = whaleFreqBins[j];
            peakBin = j;
          }
        }
        
        const peakFreq = (50 + (peakBin * sampleRate / this.fftSize));
        currentUnit.peakFrequencies.push(peakFreq);
        currentUnit.avgIntensity.push(avgIntensity);
        
      } else {
        if (currentUnit && consecutiveFrames >= minConsecutiveFrames) {
          // Unit meets minimum duration requirement
          const unitDuration = currentUnit.endTime - currentUnit.startTime;
          currentUnit.dominantFrequency = this.calculateDominantFrequency(
            currentUnit.peakFrequencies
          );
          currentUnit.averageIntensity = currentUnit.avgIntensity.reduce((a, b) => a + b) /
            currentUnit.avgIntensity.length;
          currentUnit.duration = unitDuration;
          
          console.log('Found unit:', {
            startTime: currentUnit.startTime,
            endTime: currentUnit.endTime,
            duration: unitDuration,
            dominantFreq: currentUnit.dominantFrequency,
            avgIntensity: currentUnit.averageIntensity,
            consecutiveFrames
          });
          
          units.push(currentUnit);
        }
        currentUnit = null;
        consecutiveFrames = 0;
      }
    }
    
    // Process the last unit if it exists and meets duration requirement
    if (currentUnit && consecutiveFrames >= minConsecutiveFrames) {
      const unitDuration = currentUnit.endTime - currentUnit.startTime;
      currentUnit.dominantFrequency = this.calculateDominantFrequency(
        currentUnit.peakFrequencies
      );
      currentUnit.averageIntensity = currentUnit.avgIntensity.reduce((a, b) => a + b) /
        currentUnit.avgIntensity.length;
      currentUnit.duration = unitDuration;
      units.push(currentUnit);
    }
    
    return units;
  }

  findPeakFrequency(frequencies, sampleRate) {
    let peakIndex = 0;
    let peakValue = frequencies[0];
    
    for (let i = 1; i < frequencies.length; i++) {
      if (frequencies[i] > peakValue) {
        peakValue = frequencies[i];
        peakIndex = i;
      }
    }
    
    // Convert bin index to frequency, accounting for the slice offset
    const binWidth = sampleRate / (this.fftSize * 2);
    return (100 + peakIndex * binWidth); // Add 100Hz offset since we sliced from 100Hz
  }

  calculateDominantFrequency(peakFrequencies) {
    // Use a simple mode calculation for now
    const frequencyMap = new Map();
    let maxCount = 0;
    let dominantFreq = peakFrequencies[0];
    
    peakFrequencies.forEach(freq => {
      // Round to nearest 10 Hz for binning
      const roundedFreq = Math.round(freq / 10) * 10;
      const count = (frequencyMap.get(roundedFreq) || 0) + 1;
      frequencyMap.set(roundedFreq, count);
      
      if (count > maxCount) {
        maxCount = count;
        dominantFreq = roundedFreq;
      }
    });
    
    return dominantFreq;
  }
} 