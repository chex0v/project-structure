function createElementFromString(string) {
  const div = document.createElement('div');
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class DoubleSlider {
  /** @type HTMLElement */
  element;
  subElements = {};

  onThumbPointerDown(event) {
    event.preventDefault();

    const thumbElem = event.target;

    const {
      left,
      right
    } = thumbElem.getBoundingClientRect();

    if (thumbElem === this.subElements.thumbLeft) {
      this.shiftX = right - event.clientX;
    } else {
      this.shiftX = left - event.clientX;
    }

    this.dragging = thumbElem;

    this.element.classList.add('range-slider_dragging');

    document.addEventListener('pointermove', this.onThumbPointerMove);
    document.addEventListener('pointerup', this.onThumbPointerUp);
  }

  onThumbPointerMove = event => {
    event.preventDefault();

    const {
      left: innerLeft,
      right: innerRight,
      width
    } = this.subElements.inner.getBoundingClientRect();

    if (this.dragging === this.subElements.thumbLeft) {
      let newLeft = (event.clientX - innerLeft + this.shiftX) / width;

      if (newLeft < 0) {
        newLeft = 0;
      }
      newLeft *= 100;
      let right = parseFloat(this.subElements.thumbRight.style.right);

      if (newLeft + right > 100) {
        newLeft = 100 - right;
      }

      this.dragging.style.left = this.subElements.progress.style.left = newLeft + '%';
      this.subElements.from.innerHTML = this.formatValue(this.getValue().from);
    } else {
      let newRight = (innerRight - event.clientX - this.shiftX) / width;

      if (newRight < 0) {
        newRight = 0;
      }
      newRight *= 100;

      let left = parseFloat(this.subElements.thumbLeft.style.left);

      if (left + newRight > 100) {
        newRight = 100 - left;
      }
      this.dragging.style.right = this.subElements.progress.style.right = newRight + '%';
      this.subElements.to.innerHTML = this.formatValue(this.getValue().to);
    }
  };

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    document.removeEventListener('pointermove', this.onThumbPointerMove);
    document.removeEventListener('pointerup', this.onThumbPointerUp);
  }

  onThumbPointerUp = () => {
    this.element.classList.remove('range-slider_dragging');

    document.removeEventListener('pointermove', this.onThumbPointerMove);
    document.removeEventListener('pointerup', this.onThumbPointerUp);

    this.element.dispatchEvent(new CustomEvent('range-select', {
      detail: this.getValue(),
      bubbles: true
    }));
  };

  constructor({
    min = 0,
    max = 100,
    formatValue = value => '$' + value,
    selected = {
      from: min,
      to: max
    }
  } = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.selected = selected;
    this.range = max - min;
    this.render();
  }

  get template() {
    const left = this.left;
    const right = this.right;
    return `
    <div class="range-slider">
    <span data-element="from">${this.formatValue(this.selected.from)}</span>
    <div data-element="inner" class="range-slider__inner">
      <span data-element="progress" class="range-slider__progress" style="left: ${left}%; right: ${right}%;"></span>
      <span data-element="thumbLeft" class="range-slider__thumb-left" style="left: ${left}%;"></span>
      <span data-element="thumbRight" class="range-slider__thumb-right" style="right: ${right}%;"></span>
    </div>
    <span data-element="to">${this.formatValue(this.selected.to)}</span>
  </div>
    `;
  }

  reset() {
    this.subElements.progress.style.left = `0%`;
    this.subElements.progress.style.right = `0%`;
    this.subElements.thumbLeft.style.left = `0%`;
    this.subElements.thumbRight.style.right = `0%`;

    this.subElements.from.innerHTML = this.formatValue(this.min);
    this.subElements.to.innerHTML = this.formatValue(this.max);
  }

  get left() {
    return Math.floor((this.selected.from - this.min) / this.range * 100);
  }

  get right() {
    return Math.floor((this.max - this.selected.to) / this.range * 100);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  render() {
    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);
    this.initEventListeners();
  }

  initEventListeners() {
    this.subElements.thumbLeft.addEventListener('pointerdown', event => this.onThumbPointerDown(event));
    this.subElements.thumbRight.addEventListener('pointerdown', event => this.onThumbPointerDown(event));
  }

  getValue() {
    const rangeTotal = this.max - this.min;
    const {
      left
    } = this.subElements.thumbLeft.style;
    const {
      right
    } = this.subElements.thumbRight.style;

    const from = Math.round(this.min + parseFloat(left) * 0.01 * rangeTotal);
    const to = Math.round(this.max - parseFloat(right) * 0.01 * rangeTotal);

    return {
      from,
      to
    };
  }


}
