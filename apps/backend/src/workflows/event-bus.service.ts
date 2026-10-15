type EventCallback = (payload: any) => Promise<void>;

export class EventBus {
    private static listeners: Record<string, EventCallback[]> = {};

    static subscribe(event: string, callback: EventCallback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        if (!this.listeners[event].includes(callback)) {
            this.listeners[event].push(callback);
            console.log(`[EventBus] Subscribed handler to event: "${event}"`);
        }
    }

    static unsubscribe(event: string, callback: EventCallback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    static clearListeners(event?: string) {
        if (event) {
            delete this.listeners[event];
        } else {
            this.listeners = {};
        }
    }

    static async publish(event: string, payload: any) {
        console.log(`[EventBus] Publishing event "${event}" with payload:`, JSON.stringify(payload).substring(0, 150));
        const handlers = this.listeners[event] || [];
        
        // Execute all handlers concurrently without blocking publisher
        for (const handler of handlers) {
            Promise.resolve().then(() => handler(payload)).catch(err => {
                console.error(`[EventBus] Handler failure for event "${event}":`, err);
            });
        }
    }
}
