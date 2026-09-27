export class TimeoutError extends Error {
  constructor(label, detail = "") {
    super(`Timeout en ${label}${detail ? " — " + detail : ""}`);
    this.label = label;
  }
}

export function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function withTimeoutSync(fn, ms, label = "op") {
  const start = now();
  const result = fn();
  const elapsed = now() - start;
  if (elapsed > ms) throw new TimeoutError(label, `${elapsed.toFixed(1)}ms > ${ms}ms`);
  return result;
}

export function withTimeout(promise, ms, label = "op") {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(label)), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

export function withRetry(fn, { retries = 3, baseDelay = 0, label = "op", onError } = {}) {
  let last;
  for (let i = 0; i <= retries; i++) {
    try {
      return fn();
    } catch (e) {
      last = e;
      if (onError) onError(e, i);
      if (i < retries && baseDelay > 0) {
        const end = now() + baseDelay * 2 ** i;
        while (now() < end) { /* espera activa breve */ }
      }
    }
  }
  throw last;
}

export class CircuitBreaker {
  constructor({ threshold = 3, cooldownMs = 5000, label = "" } = {}) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
    this.label = label;
    this.failures = 0;
    this.state = "closed";
    this.openedAt = 0;
    this.tripped = false;
  }

  call(fn) {
    if (this.state === "open") {
      if (now() - this.openedAt > this.cooldownMs) {
        this.state = "half-open";
      } else {
        return false;
      }
    }
    try {
      fn();
      if (this.state === "half-open") {
        this.state = "closed";
        this.failures = 0;
      }
      return true;
    } catch (e) {
      this.failures++;
      if (this.state === "half-open" || this.failures >= this.threshold) {
        this.state = "open";
        this.openedAt = now();
        this.tripped = true;
      }
      return false;
    }
  }

  reset() {
    this.failures = 0;
    this.state = "closed";
    this.openedAt = 0;
    this.tripped = false;
  }
}

export class IdempotencyGuard {
  constructor() {
    this.done = new Set();
  }

  run(key, fn) {
    if (this.done.has(key)) return false;
    this.done.add(key);
    fn();
    return true;
  }

  reset() {
    this.done.clear();
  }
}
