export class LogManager {
  constructor(logListElement) {
    this.logList = logListElement;
    this.phrases = JSON.parse(localStorage.getItem('bealePhrases') || '[]');
    this.renderLog();
  }

  addPhrase(phrase) {
    this.phrases.push({
      text: phrase,
      timestamp: new Date().toISOString()
    });
    this.saveToStorage();
    this.renderLog();
  }

  clearLog() {
    this.phrases = [];
    this.saveToStorage();
    this.renderLog();
  }

  copyToClipboard() {
    const text = this.phrases.map(p => p.text).join('\n');
    navigator.clipboard.writeText(text);
  }

  exportAsTxt() {
    const text = this.phrases.map(p => p.text).join('\n');
    this.downloadFile(text, 'beale-log.txt', 'text/plain');
  }

  exportAsJson() {
    const json = JSON.stringify(this.phrases, null, 2);
    this.downloadFile(json, 'beale-log.json', 'application/json');
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  saveToStorage() {
    localStorage.setItem('bealePhrases', JSON.stringify(this.phrases));
  }

  renderLog() {
    this.logList.innerHTML = '';
    this.phrases.forEach(phrase => {
      const li = document.createElement('li');
      li.textContent = phrase.text;
      this.logList.appendChild(li);
    });
  }
} 