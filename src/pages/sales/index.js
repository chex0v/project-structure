import RangePicker from '../../components/range-picker';
import SortableTable from '../../components/sortable-table';
import header from './header.js';

function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class SalesPage {
  element;
  subElements = {};
  components = {};

  onDateSelect = async event => {
    const { from, to } = event.detail;
    await this.updateTableComponent(from, to);
  }

  get template() {
    return `
      <div class="sales full-height flex-column">
        <div class="content__top-panel" data-element="topPanel">
          <h1 class="page-title">Продажи</h1>
        </div>
        <div data-element="ordersContainer" class="full-height flex-column"></div>
      </div>
    `;
  }

  render() {
    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);

    this.initComponents();
    this.renderComponents();
    this.initEventListeners();

    return this.element;
  }

  getSubElements ($element) {
    const elements = $element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;
      return accum;
    }, {});
  }

  initComponents() {
    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - 1);

    this.components.sortableTable = new SortableTable(header, {
      url: this.getTableUrl(from, to),
      sorted: {
        id: 'id',
        order: 'desc',
      },
      link: null
    });
    this.components.rangePicker = new RangePicker({ from: from, to: to });
  }

  getTableUrl(from, to) {
    const url = new URL('api/rest/orders', process.env.BACKEND_URL);
    url.searchParams.set('createdAt_gte', from.toISOString());
    url.searchParams.set('createdAt_lte', to.toISOString());
    return url;
  }

  renderComponents() {
    this.subElements.topPanel.append(this.components.rangePicker.element);
    this.subElements.ordersContainer.append(this.components.sortableTable.element);
  }

  initEventListeners() {
    this.components.rangePicker.element.addEventListener('date-select', this.onDateSelect);
  }

  removeEventListeners() {
    if (this.components.rangePicker) {
      this.components.rangePicker.element.removeEventListener('date-select', this.onDateSelect);
    }
  }

  async updateTableComponent(from, to) {
    this.components.sortableTable.setUrl(this.getTableUrl(from, to));
    await this.components.sortableTable.loadData();
  }

  destroy() {
    this.removeEventListeners();
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
