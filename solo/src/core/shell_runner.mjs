import { spawn } from 'child_process'
import chalk from 'chalk'

export class ShellRunner {
  constructor (logger) {
    if (!logger) throw new Error('An instance of core/Logger is required')
    this.logger = logger
  }

  /**
   * Returns a promise that invokes the shell command
   * @param cmd shell command string
   * @returns {Promise<Array>} console output as an array of strings
   */
  async run (cmd, verbose = false) {
    const self = this
    const callStack = new Error().stack // capture the callstack to be included in error
    self.logger.debug(`Executing command: '${cmd}'`)

    return new Promise((resolve, reject) => {
      const child = spawn(cmd, {
        shell: true
      })

      const output = []
      child.stdout.on('data', d => {
        const items = d.toString().split(/\r?\n/)
        items.forEach(item => {
          if (item) {
            output.push(item)
          }
        })
      })

      const errOutput = []
      child.stderr.on('data', d => {
        const items = d.toString().split(/\r?\n/)
        items.forEach(item => {
          if (item) {
            errOutput.push(item.trim())
          }
        })
      })

      child.on('exit', (code, signal) => {
        if (code) {
          const err = new Error(`Command exit with error code ${code}: ${cmd}`)

          // include the callStack to the parent run() instead of from inside this handler.
          // this is needed to ensure we capture the proper callstack for easier debugging.
          err.stack = callStack

          if (verbose) {
            errOutput.forEach(m => self.logger.showUser(chalk.red(m)))
          }

          self.logger.error(`Error executing: '${cmd}'`, {
            commandExitCode: code,
            commandExitSignal: signal,
            commandOutput: output,
            errOutput,
            error: { message: err.message, stack: err.stack }
          })

          reject(err)
        }

        self.logger.debug(`Finished executing: '${cmd}'`, {
          commandExitCode: code,
          commandExitSignal: signal,
          commandOutput: output,
          errOutput
        })
        resolve(output)
      })
    })
  }
}