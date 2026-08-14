import '@testing-library/jest-dom/vitest'

/**
 * jsdom n'implémente pas `ResizeObserver`, dont la portée se sert pour suivre
 * la largeur disponible. Un doublet inerte suffit : les tests vérifient la
 * structure produite, jamais la réaction à un redimensionnement — celui-ci
 * ne se produit pas dans un DOM sans mise en page.
 */
class ResizeObserverInerte implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverInerte

/**
 * VexFlow mesure la largeur de ses glyphes via un canvas. jsdom n'en fournit
 * pas et déverse un avertissement par appel, ce qui noie la sortie des tests.
 * Le doublet rend des mesures plausibles : le rendu SVG reste cohérent, seules
 * les largeurs exactes diffèrent — ce que ces tests ne vérifient pas.
 */
HTMLCanvasElement.prototype.getContext = function stubGetContext() {
  return {
    measureText: (texte: string) => ({ width: texte.length * 8 }),
    font: '',
    fillText: () => {},
    save: () => {},
    restore: () => {},
    scale: () => {},
    translate: () => {},
  }
} as unknown as HTMLCanvasElement['getContext']
