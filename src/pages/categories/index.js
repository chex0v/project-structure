import Categories from '../../components/categories/index.js';
import fetchJson from '../../utils/fetch-json.js';
import BasePage from '../base';

const BACKEND_URL = process.env.BACKEND_URL;

function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}
export default class Page extends BasePage {
  element;
  subElements = {};
  components = {};
  data = {};

  constructor() {
    super();
  }

  async getData () {
    const fetchUrl = new URL("api/rest/categories", BACKEND_URL);
    fetchUrl.searchParams.set("_sort", "weight");
    fetchUrl.searchParams.set("_refs", "subcategory");
    this.data = await fetchJson(fetchUrl);
  }

  initComponents () {
    this.components.categories = new Categories(this.data);
  }

  get template () {
    return `
    <div class="categories">
      <div class="content__top-panel">
        <h1 class="page-title">Категории</h1>
      </div>
      <div data-element="categories">
      </div>
    </div>`;
  }

  async render () {

    this.element = createElementFromString(this.template)
    this.subElements = this.getSubElements(this.element);

    await this.getData();

    this.initComponents();
    this.renderComponents();

    return this.element;
  }

  renderComponents () {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component];
      const { element } = this.components[component];
      root.append(element);
    });
  }

  getSubElements (element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  destroy () {
    super.destroy();
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
