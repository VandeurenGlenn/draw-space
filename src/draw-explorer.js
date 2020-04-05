import './../node_modules/custom-drawer/custom-drawer.js'

export default customElements.define(class DrawExplorer extends HTMLElement {
  constructor() {
    super();
  }
  get template() {
    return `<style>
      :host {
        display: block;
      }
    </style>`
  }
});