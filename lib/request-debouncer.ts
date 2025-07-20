// Simple request debouncer to prevent duplicate API calls
class RequestDebouncer {
  private pendingRequests = new Map<string, Promise<unknown>>()

  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as T
    }

    // Execute new request
    const promise = requestFn()
      .finally(() => {
        // Clean up after completion
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  clear(key?: string) {
    if (key) {
      this.pendingRequests.delete(key)
    } else {
      this.pendingRequests.clear()
    }
  }
}

export const requestDebouncer = new RequestDebouncer()