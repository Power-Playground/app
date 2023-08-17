| zh-Hans
| [en-US](./README.md)
# Vite Plugin Replacer

在 Vite 下定义你的替换规则。

## Why

Vite 对 `define` 配置的支持十分的复杂，需要满足一定的条件后才能允许你进行修改，
没办法去发挥自己的想象力做 `Code Generate`，在使用的时候必须是 `import.meta.env`，并且会使用上下文对变量进行替换。

如果你想使用 `esbuild` 的 `define` 功能，其对于非 `primitive` 变量来说有一定的性能优化，
会将你的代码直接处理为一个常量，而不是在运行时去替换，并且你无法在生产环境中去使用它。

## Install

```bash
npm i -D vite-plugin-replacer
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import replacer from 'vite-plugin-replacer'

export default defineConfig({
  plugins: [
    replacer({
      exclude: [/.s?css$/],
      define: {
        __VERSION__: '1.0.0',
      }
    })
  ]
})
```

## Options

```ts
export interface ReplacerOptions {
  /**
   * 定义一个 replace 规则的 map
   */
  define?: Record<string, string>
  /**
   * 默认会排除掉 node_modules 和图片
   * @default [/node_modules/, /\.(png|jpe?g|gif|svg|ico)$/i]
   */
  exclude?: (string | RegExp)[]
  /**
   * @default []
   */
  include?: (string | RegExp)[]
  /**
   * 是否需要在代码的最上方进行声明（支持多个连续的单行注释），例如：
   * \```ts
   * // @replacer.use.define.__XXX__
   * \```
   * @default true
   */
  requireDeclaration?: boolean
}
```
