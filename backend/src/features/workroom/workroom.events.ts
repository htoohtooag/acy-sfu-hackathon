import type {
  DeliverableSubmittedEvent,
  DeliverableUnlockedEvent,
  WorkroomMessage,
} from 'shared/schemas';

export type WorkroomPublishedEvent =
  | { type: 'message'; order_id: string; message: WorkroomMessage }
  | { type: 'deliverable_submitted'; order_id: string; data: DeliverableSubmittedEvent }
  | { type: 'deliverable_unlocked'; order_id: string; data: DeliverableUnlockedEvent };

type WorkroomEventListener = (event: WorkroomPublishedEvent) => void;

const listeners = new Set<WorkroomEventListener>();

export function subscribeWorkroomEvents(listener: WorkroomEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishWorkroomEvent(event: WorkroomPublishedEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error: unknown) {
      console.error('Workroom event listener failed.', error);
    }
  }
}
