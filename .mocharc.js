const path = require("node:path")

process.env.TS_NODE_PROJECT = path.resolve(__dirname, 'tsconfig.test.json')

window = {}

module.exports = {
  extension: [ 'ts', 'tsx' ],
  require: [
    // 'tsconfig-paths/register',
    'esbuild-register'
    // 'jsdom-global/register'
  ]
}
