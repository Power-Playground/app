export interface PluginConfigures {
  [id: string]: unknown
}

export type PluginConfigureIds = keyof PluginConfigures | (string & {})

const configures = new Map<string, unknown>()

export function getConfigure<T extends PluginConfigureIds & string>(id: T) {
  return configures.get(id) as PluginConfigures[T] | undefined
}

export function setConfigure<T extends PluginConfigureIds>(id: T, value: PluginConfigures[T]) {
  // @ts-ignore
  configures.set(id, value)
}

export function definePluginConfigures(configures: Partial<PluginConfigures>) {
  return configures
}

export function registerPluginConfigures(configures: Partial<PluginConfigures>) {
  for (const id in configures) {
    setConfigure(id, configures[id])
  }
}
