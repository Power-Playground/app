import { atom } from 'jotai'
import type * as monacoEditor from 'monaco-editor'

import type { ExtraFile } from './index.ts'

export const compilerOptionsAtom = atom<
  monacoEditor.languages.typescript.CompilerOptions
>({
  target: 4,
  module: 99,
  moduleResolution: 2,
  declaration: true,
  allowSyntheticDefaultImports: true,
  lib: ['esnext', 'dom', 'esnext.disposable']
})

export const extraFilesAtom = atom<ExtraFile[]>([])
export const extraModulesAtom = atom<ExtraFile[]>([])
