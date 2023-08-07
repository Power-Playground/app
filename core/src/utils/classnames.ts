export function classnames(...args: (string | undefined | false | null | Record<string, boolean>)[]) {
  return args
    .filter((arg): arg is (
      | string
      | Record<string, boolean>
    ) => arg !== undefined && arg !== false && arg !== null)
    .map(arg => {
      if (typeof arg === 'string') {
        return arg
      } else {
        return Object.entries(arg).filter(([, value]) => value).map(([key]) => key).join(' ')
      }
    })
    .join(' ')
}
