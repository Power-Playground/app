import { defineConfigure } from '@power-playground/core'

import { HeaderTitle } from './src/components/HeaderTitle'
import coverLight from './resources/PP_cover_light.svg'
import coverDark from './resources/PP_cover_dark.svg'

// TODO make picture select by web app inner theme variable
const aboutMDContent = `
<picture>
  <source media='(prefers-color-scheme: dark)' srcset='${coverDark}'>
  <img alt='Preview Power Playground cover' src='${coverLight}' style='margin: -4px'>
</picture>

## 这是什么？

基于
[<img src='https://microsoft.github.io/monaco-editor/9a60a3b3c5fcf6a9d2de2c28e5eaa986.svg' width='16px' height='16px'> Monaco Editor](https://microsoft.github.io/monaco-editor/) 和
[Chii](https://github.com/liriliri/chii)
构建的代码演练场，在这里你可以编写代码并实时查看运行结果。

通过分享的 URL 的方式将你的代码分享给他人查看，通过这种方式你可以让别人更好的理解你的问题，或者你可以将你的代码分享到社交网络上，让更多的人看到你的作品。

## 想要了解更多？

该 Playground 的源码托管在 [GitHub](https://github.com/power-playground/app) 上，你可以在这里查看源码并提出你的[建议](https://github.com/power-playground/app/issues)。

通过项目中的文档很快的部署好你自己的 Playground ，并且通过自定义插件的方式来扩展与配置你的 Playground 。
`.trim()

export default defineConfigure({
  HeaderTitle: HeaderTitle,
  plugins: {
    about: {
      mdContent: aboutMDContent
    }
  }
})
