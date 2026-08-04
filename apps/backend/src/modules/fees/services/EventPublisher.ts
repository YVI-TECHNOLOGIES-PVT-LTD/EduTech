export class EventPublisher {
    /**
     * Publishes domain events to the integration event log/bus.
     */
    public static async publish(eventName: string, payload: any): Promise<void> {
        console.log(`[Event Bus] Published Event: ${eventName}`, JSON.stringify(payload, null, 2));
    }
}
