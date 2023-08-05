import semver from 'semver'

export async function getTypescriptVersionMeta() {
  const typescriptPackages = await fetch('https://registry.npmjs.org/typescript').then<{
    'dist-tags': Record<string, string>
    versions: Record<string, unknown>
  }>(res => res.json())

  const distTags = typescriptPackages['dist-tags']

  const allVersions = Object.keys(typescriptPackages.versions)
  const versionMap = allVersions
    .filter(version => semver.satisfies(version, '>=3.3.0'))
    // only ^x.y
    .sort((v1, v2) => semver.compare(v2, v1))
    .reduce((acc, version) => {
      const major = semver.major(version)
      const minor = semver.minor(version)
      const patch = semver.patch(version)
      const key = `${major}.${minor}`
      const value = `${major}.${minor}.${patch}`
      if (acc[key] === undefined) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)
  const suggestedVersions = Object.values(versionMap)
  const versions = suggestedVersions.concat(Object.values(distTags))

  const distTagEnum = Object.fromEntries(
    Object.entries(distTags).flatMap(([key, value]) => [[key, value], [value, key]])
  )
  const distCategory = Object.keys(distTags)

  return JSON.stringify({
    distCategory,
    distTagEnum,
    versions,
    suggestedVersions,
  })
}
