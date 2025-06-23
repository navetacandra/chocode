export class EventEmitter<T extends string> {
  private events: Partial<Record<T, ((data?: any) => void)[]>> = {};

  emit(event: T, data?: any) {
    this.events[event]?.forEach((listener) => listener(data));
  }

  on(event: T, listener: (data?: any) => void) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }
}
