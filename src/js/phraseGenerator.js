import namesData from '../data/names.json';
import locationsData from '../data/locations.json';
import actionsData from '../data/actions.json';
import emotionsData from '../data/emotions.json';
import eventsData from '../data/events.json';

export class PhraseGenerator {
  constructor() {
    this.names = namesData.names;
    this.locations = locationsData.locations;
    this.actions = actionsData.actions;
    this.emotions = emotionsData.emotions;
    this.events = eventsData.events;

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
  }

  pick(arr, exclude = []) {
    // Pick a random element not in exclude
    const filtered = arr.filter(x => !exclude.includes(x));
    return filtered[Math.floor(Math.random() * filtered.length)];
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

    // Optionally, add time or mode tags
    phrase += ` [${Math.round(time)}s]`;
    return phrase;
  }
} 