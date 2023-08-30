import './Setting.scss'

import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react'
import { Editor, useMonaco } from '@monaco-editor/react'
import type { BarItemProps } from '@power-playground/core'
import { useRetimer } from 'foxact/use-retimer'
import { useAtom } from 'jotai'
import type * as monacoEditor from 'monaco-editor'

import { Dialog, type DialogRef } from '../../../components/base/Dialog'
import { Popover } from '../../../components/base/Popover'
import { compilerOptionsAtom } from '../atoms'
import { type TypeScriptPluginX } from '..'

const getEnumKeyMap = (monaco: typeof monacoEditor) => ({
  target: monaco.languages.typescript.ScriptTarget,
  module: monaco.languages.typescript.ModuleKind,
  jsx: monaco.languages.typescript.JsxEmit,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind,
  newLine: monaco.languages.typescript.NewLineKind
})

function resolveCompilerOptions(
  monaco: typeof monacoEditor,
  compilerOptions: monacoEditor.languages.typescript.CompilerOptions
) {
  const tsconfigCompilerOptionsJSON: Record<string, unknown> = { ...compilerOptions }
  const enumKeyMap = getEnumKeyMap(monaco)
  for (const [key, value] of Object.entries(compilerOptions)) {
    if (key in enumKeyMap) {
      tsconfigCompilerOptionsJSON[key] = enumKeyMap
        ?.[key as keyof typeof enumKeyMap]
        // @ts-ignore
        ?.[value]
    }
  }
  return tsconfigCompilerOptionsJSON
}

function unresolveCompilerOptions(
  monaco: typeof monacoEditor,
  tsconfigCompilerOptionsJSON: Record<string, unknown>
) {
  const compilerOptions = { ...tsconfigCompilerOptionsJSON } as monacoEditor.languages.typescript.CompilerOptions
  const enumKeyMap = getEnumKeyMap(monaco)
  for (const [key, value] of Object.entries(tsconfigCompilerOptionsJSON)) {
    if (key in enumKeyMap) {
      const filedValue = Object.entries(enumKeyMap[key as keyof typeof enumKeyMap]).find(([, v]) => v === value)?.[0]
      if (filedValue) {
        compilerOptions[key] = Number(filedValue)
      } else {
        throw new Error(`Enum key "${key}" unable to resolve value "${value}"`)
      }
    }
  }
  return compilerOptions
}

const TypeScriptCompilerOptionsConfigurator = forwardRef<DialogRef, {}>(function Anonymous(props, ref) {
  const monaco = useMonaco()

  const [compilerOptions, setCompilerOptions] = useAtom(compilerOptionsAtom)
  const compilerOptionsJSON = useMemo(() => {
    if (!monaco) return '{}'

    return JSON.stringify(resolveCompilerOptions(monaco, compilerOptions), null, 2)
  }, [monaco, compilerOptions])
  const changeCompilerOptionsRetimer = useRetimer()
  const changeCompilerOptions = useCallback(async (compilerOptionsString?: string) => {
    if (!monaco) return

    changeCompilerOptionsRetimer(setTimeout(() => {
      if (!compilerOptionsString) return

      try {
        const compilerOptions = JSON.parse(compilerOptionsString)
        setCompilerOptions(unresolveCompilerOptions(monaco, compilerOptions))
      } catch (error) {
        console.error(error)
      }
    }, 500) as unknown as number)
  }, [changeCompilerOptionsRetimer, monaco, setCompilerOptions])
  useEffect(() => {
    if (!monaco) return

    !async function loadSchema() {
      const schema = await fetch('https://json.schemastore.org/tsconfig').then<{
        $schema: string
        definitions: {
          compilerOptionsDefinition: {
            properties: {
              compilerOptions: {
                properties: Record<string, any>
              }
            }
          }
        }
      }>(res => res.json())
      const compilerOptionsSchema = schema.definitions.compilerOptionsDefinition.properties.compilerOptions
      compilerOptionsSchema.properties.moduleResolution = {
        description: 'Specify how TypeScript looks up a file from a given module specifier.',
        type: 'string',
        anyOf: [
          {
            enum: [
              'Classic',
              'NodeJs',
              'Bundler'
            ]
          },
          {
            pattern: '^(([Nn]ode)|([Nn]ode16)|([Nn]ode\\.?[Jj]s)|([Nn]ode[Nn]ext)|([Cc]lassic)|([Bb]undler))$'
          }
        ],
        default: 'NodeJs',
        markdownDescription:
          '(The Configure is overridden by Power Playground)\n\n' +
          'Specify how TypeScript looks up a file from a given module specifier.\n\n' +
          'See more: https://www.typescriptlang.org/tsconfig#moduleResolution'
      }
      compilerOptionsSchema.properties.lib.items.anyOf.push({
        // esnext.disposable
        pattern: `^[Ee][Ss][Nn][Ee][Xx][Tt](\\.([Dd][Ii][Ss][Pp][Oo][Ss][Aa][Bb][Ll][Ee]))?$`
      })
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            uri: 'https://json.schemastore.org/tsconfig',
            fileMatch: ['tsconfig.json'],
            schema: compilerOptionsSchema
          }
        ]
      })
    }()
  }, [monaco])
  return <Dialog
    ref={ref}
    title='TypeScript CompilerOptions'
    className='ts-compiler-options-configurator'
    >
    <Editor
      language='json'
      options={{
        minimap: { enabled: false }
      }}
      height='500px'
      path='tsconfig.json'
      value={compilerOptionsJSON}
      onChange={changeCompilerOptions}
    />
  </Dialog>
})

export const Setting: React.ComponentType<BarItemProps<TypeScriptPluginX['ExtShareState']>> = () => {
  const dialogRef = useRef<DialogRef>(null)
  return <>
    <TypeScriptCompilerOptionsConfigurator ref={dialogRef} />
    <Popover
      style={{ cursor: 'pointer' }}
      offset={[0, 3]}
      content={<>
        Configure TypeScript CompilerOptions
      </>}
      onClick={() => dialogRef.current?.open()}
      >
      <div className='cldr codicon codicon-settings' />
    </Popover>
  </>
}
