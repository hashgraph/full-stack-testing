import {spawn} from "child_process";
import chalk from "chalk";

export class ShellRunner {
    constructor(opts) {
        if (!opts || !opts.logger === undefined) throw new Error("An instance of core/Logger is required")
        this.logger = opts.logger
    }

    /**
     * Returns a promise that invokes the shell command
     * @param cmd shell command string
     * @returns {Promise<Array>} console output as an array of strings
     */
    async run(cmd) {
        const self = this
        let callStack= new Error().stack // capture the callstack to be included in error

        return new Promise((resolve, reject) => {
            const child = spawn(cmd, {
                shell: true,
            })

            let output = []
            child.stdout.on('data', d => {
                let items = d.toString().split(/\r?\n/)
                items.forEach(item => {
                    if (item) {
                        output.push(item)
                    }
                })
            })

            let errOutput= []
            child.stderr.on('data', d => {
                let items = d.toString().split(/\r?\n/)
                items.forEach(item => {
                    if (item) {
                        errOutput.push(item)
                    }
                })
            })


            child.on('exit', (code, signal) => {
                if (code) {
                    let err = new Error(`Command exit with error code: ${code}`)

                    // include the callStack to the parent run() instead of from inside this handler.
                    // this is needed to ensure we capture the proper callstack for easier debugging.
                    err.stack = callStack

                    errOutput.forEach(m => self.logger.showUser(chalk.red(m)))
                    reject(err)
                }

                self.logger.debug(cmd, {'commandExitCode': code, 'commandExitSignal': signal, 'commandOutput': output})
                resolve(output)
            })
        })
    }
}