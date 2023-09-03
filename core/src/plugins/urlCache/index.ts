import { useEffect, useState } from 'react'
import { asyncDebounce, copyToClipboard, definePlugin, messenger } from '@power-playground/core'
import { getDefaultStore } from 'jotai'

import { dispatchEditState } from '../history-for-local/store'

import { Save } from './topbar/Save'
import { saveStatusAtom } from './atoms'

const store = getDefaultStore()

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
      const uri = editor.getModel()?.uri.toString()
      if (uri) {
        store.set(saveStatusAtom, { ...store.get(saveStatusAtom), [uri]: true })
      }
      editor.addAction({
        id: 'ppd.save',
        label: 'Save code to url',
        run(editor) {
          const uri = editor.getModel()?.uri.toString()
          if (!uri) {
            messenger.then(m => m.display('error', ''))
            return
          }

          const code = editor.getValue()
          history.pushState(null, '', '#' + btoa(encodeURIComponent(code)))
          copyToClipboard(location.href)
          dispatchEditState('add', {
            code,
            cursor: editor.getPosition() ?? undefined
          })
          messenger.then(m => m.display(
            'success', 'Saved to clipboard, you can share it to your friends!'
          ))
          editor.focus()
          store.set(saveStatusAtom, { ...store.get(saveStatusAtom), [uri]: true })
        }
      })
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        editor.trigger('whatever', 'ppd.save', {})
      })
      const contentDebounce = asyncDebounce()
      editor.onDidChangeModelContent(async () => {
        await contentDebounce(100)
        const model = editor.getModel()
        if (!model) return

        const uri = model.uri.toString()
        store.set(saveStatusAtom, { ...store.get(saveStatusAtom), [uri]: false })
      })
    },
    topbar: [Save]
  }
})
