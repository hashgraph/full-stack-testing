#!/usr/bin/env node
import * as fnm from './src/index.mjs'

// Check the value of the DEV_MODE environment variable, ignoring case
const devMode = process.env.DEV_MODE ? process.env.DEV_MODE.toLowerCase() === 'true' : false

// Disable stack traces if DEV_MODE is false
if (!devMode) {
  Error.stackTraceLimit = 0
}

fnm.main(process.argv)
