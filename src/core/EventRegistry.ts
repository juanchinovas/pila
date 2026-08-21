import { EditorEvents } from '..';

// 1. Zero-argument disposables
export type Disposable =
  | (() => void)
  | { unsubscribe(): void }
  | { dispose(): void };

// 2. Target + Event + Listener tuple for manual registration
export type EventListenerTuple = [
  target: { off?(event: string, fn: Function): void; removeEventListener?(type: string, fn: Function): void },
  event: keyof HTMLElementEventMap | keyof EditorEvents | string,
  listener: Function
];

export type Unsubscribable = Disposable | EventListenerTuple;

export class EventRegistry {
  private cleanups = new Set<() => void>();

  public register(disposable: Unsubscribable): () => void {
    let cleanupFn: () => void;

    // Handle Tuple: [target, event, listener]
    if (Array.isArray(disposable)) {
      const [target, event, listener] = disposable;
      cleanupFn = () => {
        if ('removeEventListener' in target && typeof target.removeEventListener === 'function') {
          target.removeEventListener(event, listener);
        } else if ('off' in target && typeof target.off === 'function') {
          target.off(event, listener);
        }
      };
    } 
    // Handle Function: () => void
    else if (typeof disposable === 'function') {
      cleanupFn = disposable;
    } 
    // Handle RxJS: { unsubscribe(): void }
    else if ('unsubscribe' in disposable && typeof disposable.unsubscribe === 'function') {
      cleanupFn = () => disposable.unsubscribe();
    } 
    // Handle VS Code style: { dispose(): void }
    else if ('dispose' in disposable && typeof disposable.dispose === 'function') {
      cleanupFn = () => disposable.dispose();
    } 
    else {
      throw new Error('Invalid disposable passed to register()');
    }

    this.cleanups.add(cleanupFn);

    return () => {
      cleanupFn();
      this.cleanups.delete(cleanupFn);
    };
  }

  // .on() delegates to .register() behind the scenes!
  public on(target: any, type: string, listener: (...args: any[]) => void, options?: any): () => void {
    if ('addEventListener' in target) {
      target.addEventListener(type, listener, options);
      return this.register(() => target.removeEventListener(type, listener, options));
    }

    if ('on' in target && 'off' in target) {
      target.on(type, listener);
      return this.register(() => target.off(type, listener));
    }

    throw new TypeError('Unsupported target type passed to .on()');
  }

  public unsubscribeAll(): void {
    for (const cleanup of this.cleanups) {
      cleanup();
    }
    this.cleanups.clear();
  }
}