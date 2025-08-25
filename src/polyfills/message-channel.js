// MessageChannel polyfill for Cloudflare Workers
if (typeof globalThis.MessageChannel === "undefined") {
  globalThis.MessageChannel = class MessageChannel {
    constructor() {
      const { port1, port2 } = createMessagePortPair();
      this.port1 = port1;
      this.port2 = port2;
    }

    // Method to check if both ports are available
    isReady() {
      return this.port1 && this.port2;
    }
  };

  function createMessagePortPair() {
    const handlers1 = [];
    const handlers2 = [];

    const port1 = {
      addEventListener(type, handler) {
        if (type === "message") {
          handlers1.push(handler);
        }
      },
      removeEventListener(type, handler) {
        if (type === "message") {
          const index = handlers1.indexOf(handler);
          if (index > -1) {
            handlers1.splice(index, 1);
          }
        }
      },
      postMessage(data) {
        // Simulate async message passing
        globalThis.setTimeout(() => {
          handlers2.forEach((handler) => {
            handler({ data });
          });
        }, 0);
      },
      start() {
        // No-op for compatibility
      },
      close() {
        // No-op for compatibility
      },
    };

    const port2 = {
      addEventListener(type, handler) {
        if (type === "message") {
          handlers2.push(handler);
        }
      },
      removeEventListener(type, handler) {
        if (type === "message") {
          const index = handlers2.indexOf(handler);
          if (index > -1) {
            handlers2.splice(index, 1);
          }
        }
      },
      postMessage(data) {
        // Simulate async message passing
        globalThis.setTimeout(() => {
          handlers1.forEach((handler) => {
            handler({ data });
          });
        }, 0);
      },
      start() {
        // No-op for compatibility
      },
      close() {
        // No-op for compatibility
      },
    };

    return { port1, port2 };
  }
}
