import fetchJson from "../../utils/fetch-json.js";

const BACKEND_URL = 'https://course-js.javascript.ru';

function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class SortableTable {
  /**@type HTMLElement */
  element;
  subElements = {};
  limit = 20;
  start = 1;
  load = false;

  onSortClick = event => {
    const col = event.target.closest("[data-sortable='true']");
    if (!col) return;

    const toggleType = oldType => {
      switch (oldType) {
        case 'asc':
          return 'desc';
        case 'desc':
          return 'asc';
        default:
          return 'asc';
      }
    }

    if (col) {
      const {
        id,
        order
      } = col.dataset;

      const arrow = document.body.querySelector('.sortable-table__sort-arrow');
      this.sortConfig = {
        type: toggleType(order),
        id
      };
      col.dataset.order = this.sortConfig.type;

      if (arrow) {
        col.append(arrow);
      }

      if (this.isSortLocal) {
        this.sort(id, this.sortConfig.type);
      } else {
        this.sortOnServer(this.sortConfig.id, this.sortConfig.type);
      }
    }
  }

  onScroll = async () => {
    const { bottom } = this.element.getBoundingClientRect();

    if (bottom < document.documentElement.clientHeight && !this.isSortLocal && !this.load) {
      this.start = this.end;
      this.end = this.start + this.limit;
      this.load = true;
      this.toggleLoad();
      const newData = await this.getDataFromServer();
      this.data = [...this.data, ...newData];
      this.subElements.body.innerHTML = this.bodyData;
      this.load = false;
      this.toggleLoad();
    }
  };

  onClickClearBtn = event => {
    if (event.target.closest('[type="button"]')) {
      this.element.dispatchEvent(new CustomEvent('clear-filter', {
        bubbles: true
      }));
    }
  }

  constructor(header = [], {
    isSortLocal = false,
    url = '',
    data = [],
    link = '/products/'
  } = {}) {
    this.header = header;
    this.data = data;
    this.sortConfig = {
      type: 'asc',
      id: header.find(item => item.sortable).id
    };
    this.link = link;
    this.end = this.start + this.limit;
    this.url = new URL(url, BACKEND_URL);
    this.isSortLocal = isSortLocal;
    this.renderTemplate();
    this.initEventListeners();
  }

  get sortableArrow() {
    return `
    <span data-element="arrow" class="sortable-table__sort-arrow">
              <span class="sort-arrow"></span>
            </span>
    `;
  }

  setUrl(url) {
    this.url = url;
  }

  get headerData() {
    return this.header
      .map((item) => {
        const sortable = item.sortable && item.id === this.sortConfig.id ? this.sortableArrow : "";
        return `
      <div
        class="sortable-table__cell"
        data-id="${item.id}"
        data-sortable="${item.sortable}"
        data-order="${this.sortConfig.type}"
      >
        <span>${item.title}</span>
        ${sortable}
      </div>
      `;
      })
      .join("");
  }

  headerDescription() {
    return this.header.map((description) => {
      return {
        id: description.id,
        template: description.template,
      };
    });
  }

  getRow(headerDescription, rowData) {
    return headerDescription.map((header) => {
      if (header.template) {
        return header.template(rowData[header.id]);
      }
      return `<div class="sortable-table__cell">${rowData[header.id]}</div>`;
    });
  }

  get bodyData() {
    const headerDescription = this.headerDescription();
    return this.data
      .map(
        (item) => {
          const row = `${this.getRow(headerDescription, item).join("")}`
          if (this.link) {
            return `<a href="${this.link}${item.id}" class="sortable-table__row">${row}</a>`
          }
          return `<div class="sortable-table__row">${row}</div>`;
        }
      )
      .join("");
  }

  setData(data) {
    this.data = data;
    this.subElements.body.innerHTML = this.bodyData;
    if (!this.data || !this.data.length) {
      this.element.firstElementChild.classList.add('sortable-table_empty');
    } else {
      this.element.firstElementChild.classList.remove('sortable-table_empty');
    }
  }

  get template() {
    return `
    <div data-element="productsContainer" class="products-list__container">
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headerData}
        </div>
        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
        <div data-element="body" class="sortable-table__body">
        ${this.bodyData}
        </div>
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          <div>
            <p>Не найдено товаров удовлетворяющих выбранному критерию</p>
            <button type="button" class="button-primary-outline">Очистить фильтры</button>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  async renderTemplate() {
    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);
    await this.render();
  }

  async render() {
    await this.loadData(this.sortConfig);
  }

  toggleLoad() {
    if (this.element) {
      this.element.firstElementChild.classList.toggle('sortable-table_loading');
    }
  }

  async sortOnServer(field, type) {
    await this.loadData({
      id: field,
      order: type
    });
  }

  async getDataFromServer() {
    this.url.searchParams.set('_sort', this.sortConfig.id);
    this.url.searchParams.set('_order', this.sortConfig.type);
    this.url.searchParams.set('_start', this.start);
    this.url.searchParams.set('_end', this.end);
    return await fetchJson(this.url);
  }

  async loadData({
    id = this.sortConfig.id,
    order = this.sortConfig.type
  } = {}, start = this.start, end = this.end) {
    this.url.searchParams.set('_sort', id);
    this.url.searchParams.set('_order', order);
    this.url.searchParams.set('_start', start);
    this.url.searchParams.set('_end', end);

    this.toggleLoad();
    try {
      this.data = await fetchJson(this.url);
      this.setData(this.data);
    } catch (e) {
      // TODO: показать сообщение о ошибке
    } finally {
      this.toggleLoad();
    }
  }

  initEventListeners() {
    document.addEventListener('pointerdown', this.onSortClick);
    document.addEventListener('scroll', this.onScroll);
    if (this.subElements.emptyPlaceholder) {
      this.subElements.emptyPlaceholder.addEventListener('click', this.onClickClearBtn);
    }
  }

  getSubElements(element) {
    const elements = element.querySelectorAll("[data-element]");

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  destroy() {
    this.remove();
    document.removeEventListener('pointerdown', this.onSortClick);
    document.removeEventListener('scroll', this.onScroll);
  }


  remove() {
    if (this.subElements.emptyPlaceholder) {
      this.subElements.emptyPlaceholder.removeEventListener('click', this.onClickClearBtn);
    }
    if (this.element) {
      this.element.remove();
    }
    this.element = null;
    this.subElements = null;
  }

  sort(field, type = "asc") {
    const header = this.header.find((h) => h.id === field);
    if (header && header.sortable) {
      const {
        sortType
      } = header;
      this.data = [...this.data].sort((a, b) => {
        switch (type) {
          case "desc":
            return this.compare(b[field], a[field], sortType);
          case "asc":
          default:
            return this.compare(a[field], b[field], sortType);
        }
      });
      if (this.subElements.body) {
        this.subElements.body.innerHTML = this.bodyData;
      }
    }
  }

  compare(first, second, type = "number") {
    switch (type) {
      case "number":
        return first - second;
      case "string":
        return first.localeCompare(second, ["ru", "en"], {
          caseFirst: "upper",
        });
    }
    return 0;
  }
}
