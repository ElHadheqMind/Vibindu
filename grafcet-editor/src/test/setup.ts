import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock browser APIs that are not available in jsdom

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
(window as any).ResizeObserver = vi.fn().mockImplementation(() => ({

  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
});

// Mock Konva Stage methods
vi.mock('konva', () => ({
  Stage: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    draw: vi.fn(),
    getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
    container: vi.fn(),
    width: vi.fn(),
    height: vi.fn(),
    scale: vi.fn(),
    scaleX: vi.fn(),
    scaleY: vi.fn(),
    x: vi.fn(),
    y: vi.fn(),
  })),
  Layer: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    draw: vi.fn(),
    destroy: vi.fn(),
  })),
  Group: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    x: vi.fn(),
    y: vi.fn(),
    destroy: vi.fn(),
  })),
  Rect: vi.fn().mockImplementation(() => ({
    x: vi.fn(),
    y: vi.fn(),
    width: vi.fn(),
    height: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    destroy: vi.fn(),
  })),
  Circle: vi.fn().mockImplementation(() => ({
    x: vi.fn(),
    y: vi.fn(),
    radius: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    destroy: vi.fn(),
  })),
  Line: vi.fn().mockImplementation(() => ({
    points: vi.fn(),
    stroke: vi.fn(),
    strokeWidth: vi.fn(),
    destroy: vi.fn(),
  })),
  Text: vi.fn().mockImplementation(() => ({
    x: vi.fn(),
    y: vi.fn(),
    text: vi.fn(),
    fontSize: vi.fn(),
    fill: vi.fn(),
    destroy: vi.fn(),
  })),
}));
