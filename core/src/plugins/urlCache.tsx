import { useEffect, useState } from 'react'
import { copyToClipboard, definePlugin } from '@power-playground/core'

import { setCodeHistory } from '../components/bottom-status/historyStore'

export default definePlugin({
  editor: {
    uses: [
      () => {
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
      }
    ],
    load(editor, monaco) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const code = editor.getValue()
        history.pushState(null, '', '#' + btoa(encodeURIComponent(code)))
        copyToClipboard(location.href)
        editor.focus()
        setCodeHistory(old => old.concat({ code, time: Date.now() }))
      })
    }
  }
})
