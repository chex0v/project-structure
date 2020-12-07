import ProductForm from '../../../components/product-form/index.js'
import NotificationMessage from '../../../components/notification';
import Router from '../../../router';
import BasePage from '../../base';

function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class Page extends BasePage {
  element;
  subElements = {};
  components = {
    product: null
  };
  product = null;

  onProductSaved = ({detail: id}) => {
    Router.instance().navigate(`/products/${id}`);
    new NotificationMessage('Product saved').show();
  }

  onProductUpdated = () => {
    new NotificationMessage('Product updated').show(this.element);
  }

  constructor(productId = null) {
    super();
    this.productId = productId;
  }

  async render() {

    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);

    await this.initComponents();
    this.renderComponents();
    this.initEventListeners();

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

  initEventListeners() {
    this.components.product.element.addEventListener('product-saved', this.onProductSaved);
    this.components.product.element.addEventListener('product-updated', this.onProductUpdated);
  }

  removeEventListeners() {
    if (this.components.product && this.components.product.element) {
      this.components.product.element.removeEventListeners('product-saved', this.onProductSaved);
      this.components.product.element.removeEventListeners('product-updated', this.onProductUpdated);
    }
  }

  destroy() {
    super.destroy();
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
    this.removeEventListeners();
  }
}
