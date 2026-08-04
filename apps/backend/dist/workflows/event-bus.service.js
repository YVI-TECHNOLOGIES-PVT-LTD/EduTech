"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
class EventBus {
    static subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        console.log(`[EventBus] Subscribed handler to event: "${event}"`);
    }
    static async publish(event, payload) {
        console.log(`[EventBus] Publishing event "${event}" with payload:`, JSON.stringify(payload).substring(0, 150));
        const handlers = this.listeners[event] || [];
        // Execute all handlers concurrently without blocking publisher
        for (const handler of handlers) {
            handler(payload).catch(err => {
                console.error(`[EventBus] Handler failure for event "${event}":`, err);
            });
        }
    }
}
exports.EventBus = EventBus;
EventBus.listeners = {};
