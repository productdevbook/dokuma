let counter = 0

export function createId(prefix = "dokuma"): string {
  counter += 1
  return `${prefix}-${counter.toString(36)}`
}

export function resetIdCounter(): void {
  counter = 0
}
