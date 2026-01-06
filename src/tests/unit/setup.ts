import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock window and document globals for tests that need them
Object.defineProperty(global, "window", {
  value: {
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
});

// Mock MessageChannel for IPC tests
class MockMessagePort {
  onmessage = null;
  start = vi.fn();
  close = vi.fn();
  postMessage = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

class MockMessageChannel {
  port1 = new MockMessagePort();
  port2 = new MockMessagePort();
}

global.MessageChannel = MockMessageChannel as any;
