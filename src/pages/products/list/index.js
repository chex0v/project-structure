import SortableTable from '../../../components/sortable-table/index.js';
import header from './header.js';

function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class Page {
   /** @type HTMLElement */
   element;
   subElements = {};
   components = {
    sortableTable: null
   };

  async render() {
    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);
    
    this.initComponents();
    this.renderComponents();
   
    return this.element;
  }

  initComponents() {
    this.components.sortableTable = new SortableTable(header, {
      url: `/api/rest/products?_embed=subcategory.category&_sort=title&_order=asc&_start=0&_end=30`,
    });
  }

  getSubElements(element) {
    const elements = element.querySelectorAll("[data-element]");

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  
  get template() {
    return `
    <div class="products-list">
        <div class="content__top-panel">
          <h1 class="page-title">Products</h1>
          <a href="/products/add" class="button-primary">Add product</a>
        </div>
        <div class="content-box content-box_small">
          <form class="form-inline">
            <div class="form-group">
              <label class="form-label">Filter:</label>
              <input type="text" data-element="filterName" class="form-control" placeholder="Product name">
            </div>
            <div class="form-group" data-element="slider">
              <label class="form-label">Price:</label>
            </div>
            <div class="form-group">
              <label class="form-label">Status:</label>
              <select class="form-control" data-element="filterStatus">
                <option value="" selected="">Any</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </form>
        </div>
        <div class="products-list__container" data-element="sortableTable">
        </div>
      </div>
    `
  }


  async renderComponents() {
    Object.entries(this.components).forEach(([name, component]) => {
      this.subElements[name].append(component.element);
    });
  }

  destroy() {
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
