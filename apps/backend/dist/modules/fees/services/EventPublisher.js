"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPublisher = void 0;
class EventPublisher {
    /**
     * Publishes domain events to the integration event log/bus.
     */
    static async publish(eventName, payload) {
        console.log(`[Event Bus] Published Event: ${eventName}`, JSON.stringify(payload, null, 2));
    }
}
exports.EventPublisher = EventPublisher;
