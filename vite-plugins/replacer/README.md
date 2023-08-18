| en-US
| [zh-Hans](./README.zh-Hans.md)
# Vite Plugin Replacer

Define Replace Rules for Vite.

## Why

Vite's support for `define` configuration is very complicated, you need to meet certain conditions before allowing you to modify it,
there is no way to use your imagination to do `Code Generate`,
you must use `import.meta.env` , and the variable will be substituted with the context.

If you want to use the `define` configuration of `esbuild`, it has a certain performance optimization for non-`primitive` variables,
it will directly process your code as a constant instead of replacing it at runtime, and you cannot Use it in a production environment.

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
   * define replace rule map
   */
  define?: Record<string, string>
  /**
   * @default [/node_modules/, /\.(png|jpe?g|gif|svg|ico)$/i]
   */
  exclude?: (string | RegExp)[]
  /**
   * @default []
   */
  include?: (string | RegExp)[]
  /**
   * require declaration in the first line of code, like:
   * \```ts
   * // @replacer.use.define.__XXX__
   * \```
   * @default true
   */
  requireDeclaration?: boolean
}
```
