import type React from 'react'
import { createContext } from 'react'
import type * as monacoEditor from 'monaco-editor'


interface MonacoScopeContextValue {
  monaco: typeof monacoEditor | null
  editorInstance: monacoEditor.editor.IStandaloneCodeEditor | null

  store: {
    code: [string, React.Dispatch<React.SetStateAction<string>>]
    theme: [string, React.Dispatch<React.SetStateAction<string>>]
  }
}

export const MonacoScopeContext = createContext<MonacoScopeContextValue | null>(null)
