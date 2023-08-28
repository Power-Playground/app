export function asyncDebounce() {
  let timeId: number | undefined = undefined
  let reject: (reason?: any) => void = () => void 0
  return (time: number) => {
    reject()
    timeId && clearTimeout(timeId)
    return new Promise<void>((resolve, _rej) => {
      reject = _rej
      timeId = setTimeout(() => {
        resolve()
      }, time) as unknown as number
    })
  }
}
