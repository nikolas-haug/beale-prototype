import namesData from '../data/names.json';
import locationsData from '../data/locations.json';
import actionsData from '../data/actions.json';
import emotionsData from '../data/emotions.json';
import eventsData from '../data/events.json';
import patternsData from '../data/patterns.json';
import segmentsData from '../data/segments.json';
import signalFlagsData from '../data/signal_flags.json';

export class PhraseGenerator {
  constructor() {
    this.names = namesData.names;
    this.locations = locationsData.locations;
    this.actions = actionsData.actions;
    this.emotions = emotionsData.emotions;
    this.events = eventsData.events;
    this.patterns = patternsData.patterns;
    this.segments = segmentsData.segments;
    this.signalFlags = signalFlagsData.signal_flags;

    this.templates = [
      // Classic
      "{name}, at {location}, {action}",
      // Event-centric
      "During {event}, {name} at {location} {action}",
      "{name} remembers {event} at {location}, {action}",
      "At {location}, {event} echoes in {name}'s {emotion}",
      // Emotion-centric
      "{name}, at {location}, with {emotion}, {action}",
      "In {location}, {name} felt {emotion} during {event}",
      "With {emotion}, {name} {action} at {location}",
      // Action-centric
      "{name}'s {action} at {location}, under the shadow of {event}",
      "As {event} unfolds, {name} {action} with {emotion}",
      // Minimalist/Poetic
      "{event} at {location}",
      "{name}, {emotion}",
      "{name} and {name2}, {action}, {emotion}"
    ];

    this.analystTemplates = [
      // Pattern-centric
      "Segment {segment}: {pattern} detected",
      "{pattern} in {segment}, {signal_flag}",
      "{segment} analysis: {pattern} with {signal_flag}",
      // Signal-centric
      "{signal_flag} during {pattern}",
      "{segment} shows {pattern}, {signal_flag}",
      // Technical
      "{pattern} → {segment} → {signal_flag}",
      "{segment} {pattern} {signal_flag}",
      // Minimalist
      "{pattern}",
      "{segment}",
      "{signal_flag}"
    ];
  }

  pick(array, exclude = []) {
    const available = array.filter(item => !exclude.includes(item));
    return available[Math.floor(Math.random() * available.length)];
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
    if (mode === 'analyst') {
      return this.generateAnalystPhrase(frequency, volume, time);
    }
    return this.generateEmotionalistPhrase(frequency, volume, time);
  }

  generateEmotionalistPhrase(frequency, volume, time) {
    // Pick a template
    const template = this.pick(this.templates);
    // Pick elements, ensuring no duplicates where needed
    const name = this.pick(this.names);
    let name2 = this.pick(this.names, [name]);
    const location = this.pick(this.locations);
    const action = this.pick(this.actions);
    const emotion = this.pick(this.emotions);
    const event = this.pick(this.events);

    // Fallback for templates that don't use all variables
    const values = {
      name,
      name2,
      location,
      action,
      emotion,
      event
    };

    // Replace placeholders in the template
    let phrase = template.replace(/\{(\w+)\}/g, (_, key) => values[key] || '');

    // Add time tag
    phrase += ` [${Math.round(time)}s]`;
    return phrase;
  }

  generateAnalystPhrase(frequency, volume, time) {
    // Pick a template
    const template = this.pick(this.analystTemplates);
    
    // Pick elements
    const pattern = this.pick(this.patterns);
    const segment = this.pick(this.segments);
    const signalFlag = this.pick(this.signalFlags);

    // Replace placeholders in the template
    let phrase = template
      .replace('{pattern}', pattern)
      .replace('{segment}', segment)
      .replace('{signal_flag}', signalFlag);

    // Add time tag
    phrase += ` [${Math.round(time)}s]`;
    return phrase;
  }
} 