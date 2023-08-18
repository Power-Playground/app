export interface PluginConfigures extends Record<string, unknown> {
}

export type PluginConfigureIds = keyof PluginConfigures

const pluginConfigures = new Map<string, unknown>()

export function getPluginConfigure<T extends PluginConfigureIds & string>(id: T) {
  return pluginConfigures.get(id) as PluginConfigures[T] | undefined
}

const pluginConfigureUpdateListeners = new Map<string, Set<(value: PluginConfigures[string]) => void>>()

export function setPluginConfigure<T extends PluginConfigureIds & string>(id: T, value: PluginConfigures[T]) {
  pluginConfigures.set(id, value)
  pluginConfigureUpdateListeners.get(id)?.forEach(listener => listener(value))
}

export function onPluginConfigureUpdate<T extends PluginConfigureIds & string>(id: T, listener: (value: PluginConfigures[T]) => void) {
  const listeners = pluginConfigureUpdateListeners.get(id)
  if (!listeners) {
    pluginConfigureUpdateListeners.set(id, new Set([listener]))
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
    setPluginConfigure(id, configures[id])
  }
}
