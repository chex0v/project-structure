const header = [
  {
    id: 'images',
    title: 'Фото',
    sortable: false,
    template: data => {
      return `
            <div class="sortable-table__cell">
              ${data[0] ? `<img class="sortable-table-image" alt="Image" src="${data[0].url}">` : ''}
            </div>
          `;
    }
  },
  {
    id: 'title',
    title: 'Название',
    sortable: true,
    sortType: 'string'
  },
  {
    id: 'subcategory',
    title: 'Категория',
    sortable: false,
    template: data => {
      return `
          <div class="sortable-table__cell">
            ${data.category.title}
          </div>
        `;
    }
  },
  {
    id: 'quantity',
    title: 'Количество',
    sortable: true,
    sortType: 'number'
  },
  {
    id: 'price',
    title: 'Цена',
    sortable: true,
    sortType: 'number'
  },
  {
    id: 'status',
    title: 'Статус',
    sortable: true,
    sortType: 'number',
    template: data => {
      return `<div class="sortable-table__cell">
            ${data > 0 ? 'Active' : 'Inactive'}
          </div>`;
    }
  }
];

export default header;
