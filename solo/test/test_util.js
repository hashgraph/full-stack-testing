import fs from 'fs'
import os from 'os'
import path from 'path'
import { logging } from '../src/core/index.mjs'

export const testLogger = logging.NewLogger('debug')

export function getTestCacheDir () {
  const cacheDir= 'test/data/tmp'
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir)
  }
  return cacheDir
}

export function getTmpDir () {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'solo-'))
}
