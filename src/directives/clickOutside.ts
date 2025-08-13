import type { Directive } from 'vue'

interface ClickOutsideElement extends HTMLElement {
  clickOutsideEvent?: (event: Event) => void
}

export const vClickOutside: Directive = {
  beforeMount(el: ClickOutsideElement, binding) {
    el.clickOutsideEvent = (event: Event) => {
      // Check if the clicked element is the element itself or its children
      if (!(el === event.target || el.contains(event.target as Node))) {
        // Call the provided method
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: ClickOutsideElement) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  },
}
