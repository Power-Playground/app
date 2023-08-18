export interface PluginConfigures extends Record<string, unknown> {
}

export type PluginConfigureIds = keyof PluginConfigures

const configures = new Map<string, unknown>()

export function getConfigure<T extends PluginConfigureIds & string>(id: T) {
  return configures.get(id) as PluginConfigures[T] | undefined
}

const configureUpdateListeners = new Map<string, Set<(value: PluginConfigures[string]) => void>>()

export function setConfigure<T extends PluginConfigureIds & string>(id: T, value: PluginConfigures[T]) {
  configures.set(id, value)
  configureUpdateListeners.get(id)?.forEach(listener => listener(value))
}

export function onConfigureUpdate<T extends PluginConfigureIds & string>(id: T, listener: (value: PluginConfigures[T]) => void) {
  const listeners = configureUpdateListeners.get(id)
  if (!listeners) {
    configureUpdateListeners.set(id, new Set([listener]))
  } else {
    listeners.add(listener)
  }
  return () => {
    listeners?.delete(listener)
  }
}

export function definePluginConfigures(configures: Partial<PluginConfigures>) {
  return configures
}

export function registerPluginConfigures(configures: Partial<PluginConfigures>) {
  for (const id in configures) {
    setConfigure(id, configures[id])
  }
}

export interface Configure {
  plugins?: PluginConfigures
}

export function defineConfigure(configure?: Configure) {
  return configure
}
