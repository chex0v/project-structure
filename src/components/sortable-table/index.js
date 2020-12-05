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
      await this.sortOnServer(this.sortConfig.id, this.sortConfig.type);
      this.load = false;
      this.toggleLoad();
    }
  };

  constructor(header = [], {
    isSortLocal = false,
    url,
    data = []
  }) {
    this.header = header;
    this.data = data;
    this.sortConfig = {
      type: 'asc',
      id: header.find(item => item.sortable).id
    };
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
        (item) => `
      <a href="/products/${item.id}" class="sortable-table__row">
        ${this.getRow(headerDescription, item).join("")}
      </a>
      `
      )
      .join("");
  }

  setData(data) {
    this.data = data;
    this.subElements.body.innerHTML = this.bodyData;
  }

  get template() {
    return `
    <div data-element="productsContainer" class="products-list__container">
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headerData}
        </div>
        <div data-element="body" class="sortable-table__body">
        ${this.bodyData}
        </div>
        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          <div>
            <p>No products satisfies your filter criteria</p>
            <button type="button" class="button-primary-outline">Reset all filters</button>
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
      this.element.classList.toggle('sortable-table_loading');
    }
  }

  async sortOnServer(field, type) {
    await this.loadData({
      id: field,
      order: type
    });
  }

  async loadData({
    id = this.sortConfig.id,
    order = this.sortConfig.type
  }, start = this.start, end = this.end) {
    this.url.searchParams.set('_sort', id);
    this.url.searchParams.set('_order', order);
    this.url.searchParams.set('_start', start);
    this.url.searchParams.set('_end', end);

    this.toggleLoad();
    try {
      this.data = await fetchJson(this.url);
      this.subElements.body.innerHTML = this.bodyData;
    } catch (e) {
      // TODO: показать сообщение о ошибке
    } finally {
      this.toggleLoad();
    }
  }

  initEventListeners() {
    document.addEventListener('pointerdown', this.onSortClick);
    document.addEventListener('scroll', this.onScroll);
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
