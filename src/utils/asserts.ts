export function notAssert<T = any>(target: T, value: T, message?: string) {
  if (target === value) throw new Error(message ?? 'the target value is not in expected')
}
