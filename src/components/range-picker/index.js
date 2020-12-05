function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class RangePicker {
  element;
  subElements = {};
  leftCalendar = null;
  rightCalendar = null;
  RANGEPICKER_OPEN = 'rangepicker_open';

  onClickRangePicker = event => {
    event.preventDefault();
    this.togglePicker();
    this.renderCalendar();
  }

  renderCalendar() {
    const nextMonth = new Date(new Date(this.dateFrom).setMonth(this.dateFrom.getMonth() + 1));
    if (this.leftCalendar) {
      this.leftCalendar.remove();
    }
    if (this.rightCalendar) {
      this.rightCalendar.remove();
    }
    if (!this.subElements.selector.innerHTML) {
      this.subElements.selector.innerHTML = `
    <div class="rangepicker__selector-arrow"></div>
    <div class="rangepicker__selector-control-left"></div>
    <div class="rangepicker__selector-control-right"></div>
    `;
    }
    this.leftCalendar = createElementFromString(this.getTemplateCalendar(this.dateFrom.getMonth(), this.dateFrom.getFullYear()));
    this.rightCalendar = createElementFromString(this.getTemplateCalendar(nextMonth.getMonth(), nextMonth.getFullYear()));
    this.subElements.selector.append(this.leftCalendar);
    this.subElements.selector.append(this.rightCalendar);
  }

  onClickDocument = event => {
    const isRangePicker = this.element.contains(event.target);

    if (this.isOpen() && !isRangePicker) {
      this.togglePicker();
    }
  }

  onClickLeft = event => {
    this.dateFrom = new Date(this.dateFrom.getFullYear(), this.dateFrom.getMonth() - 1, 1);
    this.renderCalendar();
  }

  onClickRight = event => {
    this.dateFrom = new Date(this.dateFrom.getFullYear(), this.dateFrom.getMonth() + 1, 1);
    this.renderCalendar();
  }

  onClickSelector = event => {

    if (event.target.classList.contains('rangepicker__selector-control-left')) {
      this.onClickLeft();
      return;
    }

    if (event.target.classList.contains('rangepicker__selector-control-right')) {
      this.onClickRight();
      return;
    }

    const {
      value
    } = event.target.dataset;
    if (!event.target.classList.contains('rangepicker__cell') || !value) {
      return;
    }
    event.preventDefault();
    if (this.from && this.to) {
      this.from = this.to = null;
      const elements = this.element.querySelectorAll('.rangepicker__selected-between');
      for (let element of elements) {
        element.classList.remove('rangepicker__selected-between');
      }
    }

    if (!this.from) {
      this.from = new Date(value);
    } else if (!this.to) {
      this.to = new Date(value);
    }

    if (this.from && this.to && this.from.getTime() > this.to.getTime()) {
      [this.from, this.to] = [this.to, this.from];
    }

    if (this.from && this.to) {
      this.subElements.from.innerHTML = RangePicker.formatDate(this.from);
      this.subElements.to.innerHTML = RangePicker.formatDate(this.to);
      this.renderCalendar();
      this.dispatchEvent();
    }

  }


  constructor({
    from,
    to
  }) {
    this.from = new Date(from);
    this.to = new Date(to);
    this.dateFrom = new Date(this.from);
    this.render();
  }


  render() {
    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);
    this.initEventListeners();
  }

  static formatDate(date) {
    return date.toLocaleString('ru', {
      dateStyle: 'short'
    });
  }

  get template() {
    const from = RangePicker.formatDate(this.from);
    const to = RangePicker.formatDate(this.to);

    return `
        <div class="rangepicker">
            <div class="rangepicker__input" data-element="input">
                <span data-element="from">${from}</span> -
                <span data-element="to">${to}</span>
            </div>
            <div class="rangepicker__selector" data-element="selector"></div>
        </div>
        `;
  }

  static daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  get daysOfWeek() {
    return Object.values(Object.fromEntries(new Array(7)
      .fill(1)
      .map((item, index) => {
        const d = new Date(new Date().setDate(index));
        let n = d.getDay();
        if (n === 0) n = 7;
        return [
          n, d.toLocaleString('ru', {
            weekday: 'short'
          })
        ];
      }).sort(([a, ], [b, ]) => a - b)));
  }

  getTemplateCalendar(numberMonth, year, {
    from = this.from,
    to = this.to
  } = {}) {
    const currentMonth = new Date(year, numberMonth, 1);
    const monthEn = currentMonth.toLocaleString('ru', {
      month: 'long'
    });
    const day = currentMonth.getDay();
    const countDays = RangePicker.daysInMonth(currentMonth.getMonth(), currentMonth.getFullYear());

    const dateGrid = [...new Array(countDays).keys()].map(index => {
      const innerDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1);
      const startFrom = index === 0 ? `style="--start-from: ${day}"` : '';
      const currentDate = new Date(year, numberMonth, index + 1);
      const classes = ['rangepicker__cell'];
      if (from && from.getTime() === currentDate.getTime()) {
        classes.push('rangepicker__selected-from');
      } else if (from && to && currentDate.getTime() > from.getTime() && currentDate.getTime() < to.getTime()) {
        classes.push('rangepicker__selected-between');
      } else if (to && to.getTime() === currentDate.getTime()) {
        classes.push('rangepicker__selected-to');
      }
      return `<button
        type="button"
        class="${classes.join(' ')}"
        data-value="${innerDate.toISOString()}"
        ${startFrom}
        >${index + 1}
      </button>`;
    }).join('');


    return `
        <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime="${monthEn}">${monthEn}</time>
        </div>
        <div class="rangepicker__day-of-week">
          ${this.daysOfWeek.map(dayWeek => `<div>${dayWeek}</div>`).join('')}
        </div>
        <div class="rangepicker__date-grid">
          ${dateGrid}
        </div>
      </div>
        `;
  }

  togglePicker() {
    if (!this.element) return;
    if (this.element.classList.contains(this.RANGEPICKER_OPEN)) {
      this.element.classList.remove(this.RANGEPICKER_OPEN);
    } else {
      this.element.classList.add(this.RANGEPICKER_OPEN);
    }
  }

  isOpen() {
    return this.element.classList.contains(this.RANGEPICKER_OPEN);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll("[data-element]");

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  initEventListeners() {
    document.addEventListener('click', this.onClickDocument, true);
    this.subElements.input.addEventListener('click', this.onClickRangePicker);
    this.subElements.selector.addEventListener('click', this.onClickSelector);
  }
  removeEventListeners() {
    document.removeEventListener('click', this.onClickDocument, true);
    this.subElements.input.removeEventListener('click', this.onClickRangePicker);
    this.subElements.selector.removeEventListener('click', this.onClickSelector);
  }

  destroy() {
    this.remove();
    this.removeEventListeners();
  }

  dispatchEvent() {
    this.element.dispatchEvent(new CustomEvent('date-select', {
      bubbles: true,
      detail: {
        from: this.from,
        to: this.to
      }
    }));
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

}
