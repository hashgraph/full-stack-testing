import fs from 'fs'
import { FullstackTestingError } from './errors.mjs'
import * as paths from 'path'
import { fileURLToPath } from 'url'

// cache current directory
const CUR_FILE_DIR = paths.dirname(fileURLToPath(import.meta.url))

export function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function parseNodeIDs (input) {
  if (typeof input === 'string') {
    const nodeIds = []
    input.split(',').forEach(item => {
      const nodeId = item.trim()
      if (nodeId) {
        nodeIds.push(nodeId)
      }
    })

    return nodeIds
  }

  throw new FullstackTestingError('node IDs is not a comma separated string')
}

export function cloneArray (arr) {
  return JSON.parse(JSON.stringify(arr))
}

/**
 * load package.json
 * @returns {any}
 */
export function loadPackageJSON () {
  try {
    const raw = fs.readFileSync(`${CUR_FILE_DIR}/../../package.json`)
    return JSON.parse(raw.toString())
  } catch (e) {
    throw new FullstackTestingError('failed to load package.json', e)
  }
}

export function packageVersion () {
  const packageJson = loadPackageJSON()
  return packageJson.version
}

/**
 * Split the release version into its major, minor and patch number
 * @param releaseTag platform release version
 * @return {{patch: number, major: number, minor: number}}
 */
export function parseReleaseTag (releaseTag) {
  if (!releaseTag || releaseTag[0] !== 'v') {
    throw new FullstackTestingError(`invalid release tag. Expected 'v<MAJOR>.<MINOR>.<PATCH>', found '${releaseTag}'`)
  }

  releaseTag = releaseTag.replace('v', '') // remove first 'v'
  const parts = releaseTag.split('-')[0].split('.') // just take the major.minor.patch part of the version
  if (parts.length < 3) {
    throw new FullstackTestingError('releaseTag must have the format MAJOR.MINOR.PATCH')
  }

  return {
    major: Number.parseInt(parts[0]),
    minor: Number.parseInt(parts[1]),
    patch: Number.parseInt(parts[2])
  }
}

/**
 * Return the required root image for a platform version
 * @param releaseTag platform version
 * @return {string}
 */
export function getRootImageRepository (releaseTag) {
  const releaseVersion = parseReleaseTag(releaseTag)
  if (releaseVersion.minor < 46) {
    return 'hashgraph/full-stack-testing/ubi8-init-java17'
  }

  return 'hashgraph/full-stack-testing/ubi8-init-java21'
}
