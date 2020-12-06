function createElementFromString(string) {
  const div = document.createElement('div');
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class SortableList {
  element;

  onDocumentPointerMove = ({ clientX, clientY }) => {
    this.moveDraggingAt(clientX, clientY);

    const { firstElementChild, children } = this.element;
    const { top: firstElementTop } = firstElementChild.getBoundingClientRect();
    const { bottom } = this.element.getBoundingClientRect();

    if (clientY < firstElementTop) {
      this.movePlaceholderAt(0);
    } else if (clientY > bottom) {
      this.movePlaceholderAt(children.length);
    } else {
      for (let i = 0; i < children.length; i++) {
        const li = children[i];

        if (li !== this.draggingElem) {
          const { top, bottom } = li.getBoundingClientRect();
          const { offsetHeight: height } = li;

          if (clientY > top && clientY < bottom) {
            if (clientY < top + height / 2) {
              this.movePlaceholderAt(i);
              break;
            } else {
              this.movePlaceholderAt(i + 1);
              break;
            }
          }
        }
      }
    }

    this.scrollIfCloseToWindowEdge(clientY);
  };

  onDocumentPointerUp = () => {
    this.dragStop();
  };

  constructor({ items = [] } = {}) {
    this.items = items;

    this.render();
  }

  render() {
    this.element = createElementFromString(this.template);

    this.addItems();
    this.initEventListeners();
  }

  get template() {
    return `<ul class="sortable-list"></ul>`;
  }

  initEventListeners() {
    this.element.addEventListener('pointerdown', event => this.onPointerDown(event));
  }

  addItems() {
    for (let item of this.items) {
      item.classList.add('sortable-list__item');
    }

    this.element.append(...this.items);
  }

  onPointerDown(event) {
    if (event.which !== 1) {
      return false;
    }

    const itemElem = event.target.closest('.sortable-list__item');

    if (itemElem) {
      if (event.target.closest('[data-grab-handle]')) {
        event.preventDefault();

        this.dragStart(itemElem, event);
      }

      if (event.target.closest('[data-delete-handle]')) {
        event.preventDefault();

        itemElem.remove();
      }
    }
  }

  addImageToHtml(image) {
    this.element.append(image);
  }

  dragStart(itemElem, { clientX, clientY }) {
    this.elementInitialIndex = [...this.element.children].indexOf(itemElem);

    this.pointerInitialShift = {
      x: clientX - itemElem.getBoundingClientRect().x,
      y: clientY - itemElem.getBoundingClientRect().y
    };

    this.draggingElem = itemElem;

    this.placeholderElem = document.createElement('li');
    this.placeholderElem.className = 'sortable-list__placeholder';

    itemElem.style.width = `${itemElem.offsetWidth}px`;
    itemElem.style.height = `${itemElem.offsetHeight}px`;

    this.placeholderElem.style.width = itemElem.style.width;
    this.placeholderElem.style.height = itemElem.style.height;

    itemElem.classList.add('sortable-list__item_dragging');

    itemElem.after(this.placeholderElem);

    this.element.append(itemElem);

    this.moveDraggingAt(clientX, clientY);

    document.addEventListener('pointermove', this.onDocumentPointerMove);
    document.addEventListener('pointerup', this.onDocumentPointerUp);
  }

  moveDraggingAt(clientX, clientY) {
    this.draggingElem.style.left = clientX - this.pointerInitialShift.x + 'px';
    this.draggingElem.style.top = clientY - this.pointerInitialShift.y + 'px';
  }

  scrollIfCloseToWindowEdge(clientY) {
    const scrollingValue = 10;
    const threshold = 20;

    if (clientY < threshold) {
      window.scrollBy(0, -scrollingValue);
    } else if (clientY > document.documentElement.clientHeight - threshold) {
      window.scrollBy(0, scrollingValue);
    }
  }

  movePlaceholderAt(index) {
    const currentElement = this.element.children[index];

    if (currentElement !== this.placeholderElem) {
      this.element.insertBefore(this.placeholderElem, currentElement);
    }
  }

  dragStop() {
    const placeholderIndex = [...this.element.children].indexOf(this.placeholderElem);

    this.placeholderElem.replaceWith(this.draggingElem);
    this.draggingElem.classList.remove('sortable-list__item_dragging');

    this.draggingElem.style.left = '';
    this.draggingElem.style.top = '';
    this.draggingElem.style.width = '';
    this.draggingElem.style.height = '';

    document.removeEventListener('pointermove', this.onDocumentPointerMove);
    document.removeEventListener('pointerup', this.onDocumentPointerUp);

    this.draggingElem = null;

    if (placeholderIndex !== this.elementInitialIndex) {
      this.element.dispatchEvent(new CustomEvent('sortable-list-reorder', {
        bubbles: true,
        detail: {
          from: this.elementInitialIndex,
          to: placeholderIndex
        }
      }));
    }
  }

  remove() {
    this.element.remove();
    document.removeEventListener('pointermove', this.onDocumentPointerMove);
    document.removeEventListener('pointerup', this.onDocumentPointerUp);
  }

  destroy() {
    this.remove();
  }
}
