export interface Pipply {
  <A0, T0, B0, T1>(fn: (a0: A0) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, b0: B0) => T1
  <A0, A1, T0, B0, T1>(fn: (a0: A0, a1: A1) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, b0: B0) => T1
  <A0, A1, A2, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, b0: B0) => T1
  <A0, A1, A2, A3, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, b0: B0) => T1
  <A0, A1, A2, A3, A4, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, A8, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9, a10: A10) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9, a10: A10, b0: B0) => T1

  <A0, T0>(fn: (a0: A0) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, b0: B0) => T1
  <A0, A1, T0>(fn: (a0: A0, a1: A1) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, b0: B0) => T1
  <A0, A1, A2, T0>(fn: (a0: A0, a1: A1, a2: A2) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, a2: A2, b0: B0) => T1
  <A0, A1, A2, A3, T0>(fn: (a0: A0, a1: A1, a2: A2, a3: A3) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, a2: A2, a3: A3, b0: B0) => T1
  <A0, A1, A2, A3, A4, T0>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, T0>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, T0>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, T0>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, A8, T0>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, T0>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, T0>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9, a10: A10) => T0): <B0, T1>(fn2: (rt: T0, b0: B0) => T1) => (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9, a10: A10, b0: B0) => T1
}
export const pipply: Pipply = (fn: Function, fn2?: Function) => {
  const common = (fn2: Function) => (...args: unknown[]) => fn2(
    fn(...args.slice(0, args.length - 1)),
    args[args.length - 1]
  )
  if (fn2) {
    return common(fn2)
  } else {
    return common
  }
}
