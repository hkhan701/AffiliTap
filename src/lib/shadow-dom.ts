import "@webcomponents/webcomponentsjs"

export type DefineShadowElementSetupOptions = {
  onBefore?: (element: HTMLElement) => void

  onReady?: (element: HTMLElement, shadowElement: HTMLElement) => void
}

function defineShadowElement(tag: string, id: string) {
  // Check if the custom element is already defined
  if (!customElements.get(tag)) {
    class CustomContainer extends HTMLElement {
      constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });

        const container = document.createElement("div");
        container.id = id;
        container.style.setProperty("font-size", "16px");

        shadow.appendChild(container);
      }
    }

    customElements.define(tag, CustomContainer);
  }

  return {
    setup(options?: DefineShadowElementSetupOptions) {
      const container = document.createElement(tag);

      options?.onBefore?.(container);

      document.documentElement.appendChild(container);

      options?.onReady?.(
        container,
        container.shadowRoot.querySelector(`#${id}`) as HTMLElement
      );
    },
  };
}

export { defineShadowElement }
