export default class BasePage {
  /** @type HTMLElement */
  toggler = null;

  onToogleSidebar = () => {
    document.body.classList.toggle('is-collapsed-sidebar');
  }

  constructor() {
    this.toggler = document.querySelector('.sidebar__toggler')
    if (this.toggler) {
      this.toggler.addEventListener('click', this.onToogleSidebar);
    }
  }

  destroy() {
    if (this.toggler) {
      this.toggler.removeEventListener('click', this.onToogleSidebar);
    }
  }
}
