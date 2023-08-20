import { useEffect, useState } from 'react'
import { copyToClipboard, definePlugin, messenger } from '@power-playground/core'

export default definePlugin({
  editor: {
    use: [() => {
      const hash = location.hash.slice(1)
      const [code, setCode] = useState(hash
        ? decodeURIComponent(atob(hash))
        : 'console.log("Hello world!")')
      useEffect(() => {
        function hashchange() {
          const hash = location.hash.slice(1)
          setCode(hash
            ? decodeURIComponent(atob(hash))
            : '')
        }
        addEventListener('hashchange', hashchange)
        return () => removeEventListener('hashchange', hashchange)
      }, [])
      return {
        code, setCode
      }
    }],
    load(editor, monaco) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const code = editor.getValue()
        history.pushState(null, '', '#' + btoa(encodeURIComponent(code)))
        copyToClipboard(location.href)
        messenger.then(m => m.display(
          'success', 'Saved to clipboard, you can share it to your friends!'
        ))
        editor.focus()
        // TODO refactor as executeCommand
        // setCodeHistory(old => old.concat({ code, time: Date.now() }))
        messenger.then(m => m.display('warning', 'Code history is building, save to history is not available now.'))
      })
    }
  }
})
