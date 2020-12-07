import SortableList from '../sortable-list/index.js';
import escapeHtml from '../../utils/escape-html.js';
import fetchJson from '../../utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}


export default class ProductForm {
  element;
  subElements = {};
  defaultData = {
    title: '',
    description: '',
    quantity: 1,
    subcategory: '',
    status: 1,
    price: 0,
    discount: 0,
    images: []
  };
  category = [];
  sortableListElement = null;

  onSubmit = event => {
    event.preventDefault();
    this.save();
  }

  onUploadImage = () => {
    const inputFile = createElementFromString("<input type='file' accept ='image/*'>");
    inputFile.onchange = async () => {
      const [file] = inputFile.files
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      this.processLoadImage(true);
      try {
        const result = await fetchJson('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
          },
          body: formData
        });
        this.sortableListElement.addImageToHtml(createElementFromString(
          this.renderImageLi({
            source: file.name,
            url: result.data.link
          })));
      } catch (e) {
        alert(e.message || "Ошибка загрузки картинки");
      } finally {
        this.processLoadImage(false);
      }
      inputFile.remove();
    };
    document.body.append(inputFile);
    inputFile.click();
  }

  processLoadImage(load) {
    if (load) {
      this.subElements.uploadImage.classList.add('is-loading');
      this.subElements.uploadImage.disabled = true;
    } else {
      this.subElements.uploadImage.classList.remove('is-loading');
      this.subElements.uploadImage.disabled = false;
    }
  }

  constructor(productId) {
    this.productId = productId;
    this.urlCategory = new URL('/api/rest/categories', BACKEND_URL);
    this.urlProduct = new URL('/api/rest/products', BACKEND_URL);
  }

  async save() {
    const result = await fetchJson(`${BACKEND_URL}/api/rest/products`, {
      method: this.productId ? 'PATCH' : 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.formData)
    });
    const event = this.productId ?
      new CustomEvent('product-updated', {
        detail: result.id
      }) :
      new CustomEvent('product-saved', {
        detail: result.id
      });

    this.element.dispatchEvent(event);
  }

  async render() {
    const [category, productData] =
    await Promise.all([
      this.fetchCategory(),
      this.productId ? this.fetchData(this.productId) : this.defaultData
    ]);
    this.category = category;
    this.data = productData;

    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);

    if (this.subElements.imageListContainer) {
      this.sortableListElement = new SortableList({
        items: this.images
      });
      this.subElements.imageListContainer.append(this.sortableListElement.element);
    }

    this.initEventListeners();

    return this.element;
  }

  formatCategory(categories) {
    const currentCategory = this.data.subcategory;

    return categories.reduce((prev, {
      title,
      subcategories
    }) => {
      if (subcategories) {
        for (const sub of subcategories) {
          prev.push(new Option(`${title} > ${sub.title}`, sub.id, sub.id === currentCategory));
        }
      }
      return prev;
    }, []);
  }

  get categoryHtml() {
    const _categoryHtml = createElementFromString(
      `<select id="subcategory" data-element="subcategory" class="form-control" name="subcategory"></select>`
    );
    if (this.category && this.category.length) {
      for (const _category of this.formatCategory(this.category)) {
        _categoryHtml.append(_category);
      }
    }
    return _categoryHtml.outerHTML;
  }


  async fetchData(productId) {
    this.urlProduct.searchParams.set('id', productId);
    const [data] = await fetchJson(this.urlProduct);
    return data;
  }

  async fetchCategory() {
    this.urlCategory.searchParams.set('_sort', 'weight');
    this.urlCategory.searchParams.set('_refs', 'subcategory');
    return await fetchJson(this.urlCategory);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll("[data-element]");

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  get images() {
    if (this.data && this.data.images) {
      return this.data.images.map(image => createElementFromString(this.renderImageLi(image)));
    }
  }

  get formData() {
    const {
      title,
      description,
      subcategory,
      price,
      discount,
      quantity,
      status
    } = this.subElements.productForm;

    const data = {
      id: this.productId,
      title: title.value,
      description: description.value,
      subcategory: subcategory.value,
      price: parseFloat(price.value),
      discount: parseInt(discount.value),
      quantity: parseInt(quantity.value),
      status: parseInt(status.value),
      images: []
    };

    const imagesHtml = this.subElements.imageListContainer.querySelectorAll('.sortable-table__cell-img');
    for (const image of imagesHtml) {
      data.images.push({
        url: image.src,
        source: image.alt
      });
    }
    return data;
  }

  renderImageLi(image) {
    const url = escapeHtml(image.url);
    const source = escapeHtml(image.source);
    return `
    <li class="products-edit__imagelist-item sortable-list__item">
        <input type="hidden" name="url" value="${url}">
        <input type="hidden" name="source" value="${source}">
        <span>
          <img src="icon-grab.svg" data-grab-handle="" alt="grab">
          <img class="sortable-table__cell-img" alt="${source}" src="${url}">
          <span>${source}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle="" alt="delete">
        </button>
      </li>
    `;
  }

  get template() {
    return `
    <div class="product-form">
    <form data-element="productForm" class="form-grid">
      <div class="form-group form-group__half_left">
        <fieldset>
          <label class="form-label">Название товара</label>
          <input
            id="title"
            required
            type="text"
            name="title"
            class="form-control"
            placeholder="Название товара"
            value='${this.data.title}'
          >
        </fieldset>
      </div>
      <div class="form-group form-group__wide">
        <label class="form-label">Описание</label>
        <textarea
          id="description"
          required=""
          class="form-control"
          name="description"
          data-element="productDescription"
          placeholder="Описание товара"
          >${this.data.description}</textarea>
      </div>
      <div class="form-group form-group__wide" data-element="sortable-list-container">
        <label class="form-label">Фото</label>
        <div data-element="imageListContainer">

        </div>
        <button data-element="uploadImage" type="button" name="uploadImage" class="button-primary-outline">
          <span>Загрузить</span>
        </button>
      </div>
      <div class="form-group form-group__half_left">
        <label class="form-label">Категория<ulabel>
        ${this.categoryHtml}
      </div>
      <div class="form-group form-group__half_left form-group__two-col">
        <fieldset>
          <label class="form-label">Цена ($)</label>
          <input id="price" value="${this.data.price}" required="" type="number" name="price" class="form-control" placeholder="100">
        </fieldset>
        <fieldset>
          <label class="form-label">Скидка ($)</label>
          <input id="discount" value="${this.data.discount}" required="" type="number" name="discount" class="form-control" placeholder="0">
        </fieldset>
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Количество</label>
        <input id="quantity" value="${this.data.quantity}" required="" type="number" class="form-control" name="quantity" placeholder="1">
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Статус</label>
        <select id="status" class="form-control" name="status">
          <option ${this.data.status === 1 ? 'selected' : ''} value="1">Активен</option>
          <option ${this.data.status === 0 ? 'selected' : ''} value="0">Неактивен</option>
        </select>
      </div>
      <div class="form-buttons">
        <button type="submit" name="save" class="button-primary-outline">
          Сохранить товар
        </button>
      </div>
    </form>
  </div>
    `;
  }

  destroy() {
    this.sortableListElement.destroy();
    this.remove();
    this.element = null;
    this.subElements = {};
    this.removeEventListener();
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  initEventListeners() {
    if (this.subElements.uploadImage) {
      this.subElements.uploadImage.addEventListener('click', this.onUploadImage);
    }
    if (this.subElements.productForm) {
      this.subElements.productForm.addEventListener('submit', this.onSubmit);
    }
  }

  removeEventListener() {
    if (this.subElements.uploadImage) {
      this.subElements.uploadImage.removeEventListener('click', this.onUploadImage);
    }
    if (this.subElements.productForm) {
      this.subElements.productForm.removeEventListener('submit', this.onSubmit);
    }
  }
}
