import fetchJson from '../../utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

const LOADING_CLASS = "column-chart_loading";

export default class ColumnChart {
  /** @type HTMLElement */
  element;
  /** @type Number */
  chartHeight = 50;
  subElements = {};

  constructor({
    url,
    data = [],
    range = {
      from: new Date('2020-04-06'),
      to: new Date('2020-05-06'),
    },
    label = "",
    value = 0,
    link = null,
    formatHeading = data => data,
    formatTooltip = ([key, value]) => {
      const maxValue = Math.max(...Object.values(this.data));
      const percent = ((value / maxValue) * 100).toFixed();
      return `${percent}%`;
    }
  } = {}) {
    this.data = data;
    this.label = label;
    this.value = value;
    this.link = link;
    this.url = new URL(url, BACKEND_URL);
    this.range = range;
    this.formatHeading = formatHeading;
    this.formatTooltip = formatTooltip;
    this.render();
    this.update();
  }

  renderLink() {
    return this.link ?
      `<a data-element="link" class="column-chart__link" href="${this.link}">Подробнее</a>` :
      "";
  }


  renderTitle() {
    const title = `${this.label.charAt(0) + this.label.slice(1)}`;
    return `
     <div data-element="title" class="column-chart__title">
      ${title}
      ${this.renderLink()}
     </div>
    `;
  }

  renderData(data) {
    if (!data || !Object.values(data).length) return "";

    const maxValue = Math.max(...Object.values(this.data));
    const scale = this.chartHeight / maxValue;

    return Object.entries(this.data)
      .map(([key, value]) => {
        const v = Math.floor(value * scale);
        return `<div style="--value: ${v}" data-tooltip="${this.formatTooltip([key, value])}"></div>`;
      })
      .join("");
  }

  render() {
    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);
  }

  get template() {
    return `
    <div
    class="column-chart"
    style="--chart-height: ${this.chartHeight}"
  >
    ${this.renderTitle()}
    <div data-element="container" class="column-chart__container">
      <div data-element="header" class="column-chart__header">
        ${this.formatHeading(this.value)}
      </div>
      <div data-element="body" class="column-chart__chart">
        ${this.renderData(this.data)}
      </div>
    </div>
  </div>
  `;
  }

  getSubElements(element) {
    const elements = element.querySelectorAll("[data-element]");

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }


  updateData(data) {
    this.data = data;
    this.subElements.body.innerHTML = this.renderData(this.data);
  }

  toggleLoad() {
    if (this.element) {
      this.element.classList.toggle(LOADING_CLASS);
    }
  }

  async update(dateStart = this.range.from, dateEnd = this.range.to) {
    this.url.searchParams.set("from", dateStart);
    this.url.searchParams.set("to", dateEnd);
    this.toggleLoad();
    try {
      const response = await fetchJson(this.url);
      const data = {};
      this.value = Object.entries(response).reduce((sum, [date, value]) => {
        data[date] = value;
        return sum + value;
      }, 0);
      this.updateData(data);
      this.subElements.header.innerHTML = this.formatHeading(this.value);
    } finally {
      this.toggleLoad();
    }
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
