import SortableTable from '../../../components/sortable-table/index.js';
import DoubleSlider from '../../../components/double-slider';

import header from './header.js';
import BasePage from '../../base';

function createElementFromString(string) {
  const div = document.createElement('div');
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class Page extends BasePage {
  /** @type HTMLElement */
  element;
  subElements = {};
  components = {
    sortableTable: null,
    slider: null
  };

  filters = {
    name: '',
    priceLeft: '',
    priceRight: '',
    status: ''
  };

  onRangeSelect = async ({ detail: { from, to } }) => {
    this.filters.priceLeft = from;
    this.filters.priceRight = to;
    await this.updateTableComponent();
  };

  onInputProductName = async (event) => {
    const value = event.target.value.trim();
    this.filters.name = value;
    await this.updateTableComponent();
  };

  onChangeStatus = async (event) => {
    const value = event.target.value;
    this.filters.status = value;
    await this.updateTableComponent();
  }

  constructor() {
    super();
  }

  get filterUrl() {
    const url = new URL('api/rest/products', process.env.BACKEND_URL);
    url.searchParams.set('_embed', 'subcategory.category');

    const { name, priceLeft, priceRight, status } = this.filters;
    if (name) url.searchParams.set('title_like', name);
    if (priceLeft) url.searchParams.set('price_gte', priceLeft);
    if (priceRight) url.searchParams.set('price_lte', priceRight);
    if (status) url.searchParams.set('status', status);

    return url;
  }

  async updateTableComponent() {
    this.components.sortableTable.start = 0;
    this.components.sortableTable.end = 30;
    this.components.sortableTable.setUrl(this.filterUrl);
    await this.components.sortableTable.loadData();
  }

  async render() {
    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);

    this.initComponents();
    this.renderComponents();
    this.initEventListeners();

    return this.element;
  }

  initComponents() {
    this.components.slider = new DoubleSlider({
      min: 0,
      max: 4000,
      formatValue: value => `$${value}`
    });

    this.components.sortableTable = new SortableTable(header, {
      url: `/api/rest/products?_embed=subcategory.category&_sort=title&_order=asc&_start=0&_end=30`
    });
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }


  get template() {
    return `
    <div class="products-list">
        <div class="content__top-panel">
          <h1 class="page-title">Товары</h1>
          <a href="/products/add" class="button-primary">Добавить товар</a>
        </div>
        <div class="content-box content-box_small">
          <form class="form-inline">
            <div class="form-group">
              <label class="form-label">Искать:</label>
              <input type="text" data-element="filterName" class="form-control" placeholder="Название товара">
            </div>
            <div class="form-group" data-element="slider">
              <label class="form-label">Цена:</label>
            </div>
            <div class="form-group">
              <label class="form-label">Статус:</label>
              <select class="form-control" data-element="filterStatus">
                <option value="" selected="">Любой</option>
                <option value="1">Активный</option>
                <option value="0">Неактивный</option>
              </select>
            </div>
          </form>
        </div>
        <div class="products-list__container" data-element="sortableTable">
        </div>
      </div>
    `;
  }

  initEventListeners() {
    this.components.slider.element.addEventListener('range-select', this.onRangeSelect);
    if (this.subElements.filterName) {
      this.subElements.filterName.addEventListener('input', this.onInputProductName);
    }
    if (this.subElements.filterStatus) {
      this.subElements.filterStatus.addEventListener('change', this.onChangeStatus);
    }
  }

  removeEventListeners() {
    if (this.components.slider) {
      this.components.slider.element.removeEventListener('range-select', this.onRangeSelect);
    }
    if (this.subElements.filterName) {
      this.subElements.filterName.removeEventListener('input', this.onInputProductName);
    }
    if (this.subElements.filterStatus) {
      this.subElements.filterStatus.removeEventListener('change', this.onChangeStatus);
    }
  }


  async renderComponents() {
    Object.entries(this.components).forEach(([name, component]) => {
      this.subElements[name].append(component.element);
    });
  }

  destroy() {
    super.destroy();
    this.removeEventListeners();
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
