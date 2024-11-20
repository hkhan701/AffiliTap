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

        if (!this.shadowRoot) {
          const shadow = this.attachShadow({ mode: "open" });

          const container = document.createElement("div");
          container.id = id;
          container.style.setProperty("font-size", "16px");

          shadow.appendChild(container);
        }
      }
    }

    customElements.define(tag, CustomContainer);
  }

  return {
    setup(options?: DefineShadowElementSetupOptions) {
      let container = document.querySelector(tag) as HTMLElement;

      if (!container) {
        container = document.createElement(tag);
        options?.onBefore?.(container);
        document.documentElement.appendChild(container);
      }

      const shadowElement = container.shadowRoot?.querySelector(`#${id}`) as HTMLElement;

      options?.onReady?.(container, shadowElement);
    },
  };
}

export { defineShadowElement };
