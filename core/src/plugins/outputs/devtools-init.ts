// @ts-ignore
window.require = function (name) {
  // switch (name) {
  // }
  throw new Error(`Cannot find module '${name}'`)
}
