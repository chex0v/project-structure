import ProductForm from '../../../components/product-form/index.js'

function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class Page {
  element;
  subElements = {};
  components = {
    product: null
  };
  product = null;

  constructor(productId = null) {
    this.productId = productId;
  }

  async render() {
    
    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);

    await this.initComponents();
    this.renderComponents();

    return this.element;
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
      <div class="products-edit">
          <div class="content__top-panel">
          <h1 class="page-title">
              <a href="/products" class="link">Products</a> / ${this.productId ? 'Edit' : 'Add'}
          </h1>
          </div>
          <div data-element="product" class="content-box"></div>
      </div>
    `;
  }

  async initComponents() {
    this.components.product = new ProductForm(this.productId);
    await this.components.product.render();
  }

  renderComponents() {
    Object.entries(this.components).forEach(([name, component]) => {
      this.subElements[name].append(component.element);
    });
  }
}
