function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class SortableList {
  /** @type HTMLElement */
  element;
  /** @type HTMLElement */
  currentElement = null;
  /** @type HTMLElement */
  placeholder = null;

  onMouseMove = (event) => {
    this.currentElement = this.changePositionElement(this.currentElement, {
      left: event.pageX,
      top: event.pageY
    });

    const elemBefore = document.elementFromPoint(event.clientX, event.clientY);
    if (!elemBefore) return;

    const droppable = elemBefore.closest('.sortable-list__item');
    if (!droppable) return;

    if (this.placeholder !== droppable) {
      if (droppable.offsetTop > this.placeholder.offsetTop) {
        this.placeholder.before(droppable);
      } else {
        this.placeholder.after(droppable);
      }
    }
  }

  onMouseUp = (event) => {
    this.placeholder.after(this.currentElement);
    this.placeholder.remove();
    this.currentElement.classList.remove("sortable-list__item_dragging");
    this.currentElement.style = '';

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  onMouseDown = (event) => {
    const {
      deleteHandle
    } = event.target.dataset;

    if (deleteHandle !== undefined) {
      event.target.closest('.sortable-list__item').remove();
      return;
    }

    this.currentElement = event.target.closest('.sortable-list__item');

    this.createPlaceHolder(this.currentElement);

    this.prepareDroppable();

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }


  constructor({
    items = []
  } = {}) {
    this.items = items;
    this.render();
  }

  prepareDroppable() {
    const {
      offsetWidth,
      offsetHeight,
      offsetLeft,
      offsetTop
    } = this.currentElement;
    this.currentElement.classList.add("sortable-list__item_dragging");
    this.element.append(this.changePositionElement(this.currentElement, {
      width: offsetWidth,
      height: offsetHeight,
      left: offsetLeft,
      top: offsetTop
    }));
  }

  changePositionElement(element, {
    width,
    height,
    left,
    top
  }) {
    if (width) {
      element.style.width = `${width}px`;
    }
    if (height) {
      element.style.height = `${height}px`;
    }
    if (left) {
      element.style.left = `${left}px`;
    }
    if (top) {
      element.style.top = `${top}px`;
    }
    return element;
  }

  get placeholderHtml() {
    return `
    <div class='sortable-list__placeholder'></div>
    `;
  }

  createPlaceHolder(element) {
    this.placeholder = createElementFromString(this.placeholderHtml);
    this.placeholder = this.changePositionElement(this.placeholder, {
      width: this.currentElement.offsetWidth,
      height: this.currentElement.offsetHeight
    });
    element.before(this.placeholder);
  }

  render() {
    this.element = createElementFromString(this.template);
    this.initEventListeners();
  }

  get template() {
    const elements = this.items.map(item => {
      if (!item.classList.contains('sortable-list__item')) {
        item.classList.add('sortable-list__item');
      }
      return item.outerHTML;
    }).join('');
    return `
      <ul class="sortable-list">
        ${elements}
      </ul>
    `;
  }
  
  addImageToHtml(image) {
    this.element.append(image);
  }

  initEventListeners() {
    this.element.addEventListener('pointerdown', this.onMouseDown);
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.removeEventListener();
  }

  removeEventListener() {
    document.removeEventListener('pointerdown', this.onMouseDown);
  }
}
