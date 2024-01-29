import fs from 'fs'
import os from 'os'
import path from 'path'
import { logging } from '../src/core/index.mjs'

const TEST_CACHE_DIR = 'test/data/tmp'
export const testLogger = logging.NewLogger('debug')

export function getTestCacheDir () {
  if (!fs.existsSync(TEST_CACHE_DIR)) {
    fs.mkdirSync(TEST_CACHE_DIR)
  }
  return TEST_CACHE_DIR
}

export function getTmpDir () {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fsnetman-'))
}
