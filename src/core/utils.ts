/**
 * Generates a unique ID string.
 * @returns A unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Debounces the provided function, ensuring it is only called after the specified delay has passed since the last invocation.
 * @param fn The function to debounce
 * @param ms The debounce delay in milliseconds (default: 350)
 * @returns A debounced version of the provided function
 */
export function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number = 350): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Turns a regular Event into a CustomEvent with the specified detail, preserving the original event's properties.
 * @param event The original event to base the CustomEvent on
 * @param detail The detail data to include in the CustomEvent
 * @returns A new CustomEvent with the specified detail and properties copied from the original event
 */
export function toCustomEvent<T>(event: Event, detail: T): CustomEvent<T> {
  return Reflect.construct(CustomEvent, [event.type, { ...event, detail }]) as CustomEvent<T>;
}


export async function sha256Hash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
