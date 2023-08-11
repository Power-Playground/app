import { definePlugin } from '../index.tsx'

export default definePlugin({
  editor: {
    preload(monaco) {
      const disposables = [
        monaco.languages.registerInlineCompletionsProvider('typescript', {
          provideInlineCompletions(model, position) {
            const line = model.getLineContent(position.lineNumber)
            if (line.trimStart().startsWith('await ')) {
              return {
                items: [
                  { insertText: '100..ms' }
                ]
              }
            }
            return { items: [] }
          },
          freeInlineCompletions(completions) {}
        })
      ]
      return () => disposables.forEach(d => d.dispose())
    }
  }
})
