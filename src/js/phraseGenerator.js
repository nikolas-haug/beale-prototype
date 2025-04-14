import namesData from '../data/names.json';
import locationsData from '../data/locations.json';
import actionsData from '../data/actions.json';

export class PhraseGenerator {
  constructor() {
    this.names = namesData.names;
    this.locations = locationsData.locations;
    this.actions = actionsData.actions;
  }

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  getToneTag(frequency) {
    if (frequency > 600) return "high voice";
    if (frequency < 200) return "deep echo";
    return "steady tone";
  }

  getMoodTag(volume) {
    if (volume > 100) return "with grief";
    if (volume < 30) return "with peace";
    return "with memory";
  }

  getAnalystAction(frequency, volume) {
    const patterns = [
      "pattern detected",
      "sequence complete",
      "signal analyzed",
      "data processed",
      "transmission received"
    ];
    return this.pick(patterns);
  }

  generatePhrase(frequency, volume, time, mode = 'emotionalist') {
    const name = this.pick(this.names);
    const location = this.pick(this.locations);
    const toneTag = this.getToneTag(frequency);
    const moodTag = this.getMoodTag(volume);

    let action;
    if (mode === 'analyst') {
      action = this.getAnalystAction(frequency, volume);
    } else {
      action = this.pick(this.actions);
    }

    return `${name}, at ${location}, ${action} (${toneTag}, ${moodTag}) [${Math.round(time)}s]`;
  }
} 