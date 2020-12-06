function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class NotificationMessage {
  element;

  constructor(name = '', {
    duration = 1000,
    type = 'success',
  } = {}) {
    this.name = name;
    this.duration = duration;
    this.type = type;

    this.render();
  }

  get template() {
    return `
      <div class="notification ${this.type}" style="--value:${this.duration / 1000}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">
            ${this.name}
          </div>
        </div>
      </div>
    `;
  }

  show(parent = document.body) {
    parent.append(this.element);
    setTimeout(() => this.remove(), this.duration);
  }

  render() {
    this.element = createElementFromString(this.template);
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
  }
}