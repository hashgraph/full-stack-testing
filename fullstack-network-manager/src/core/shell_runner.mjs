import {spawn} from "child_process";

export const ShellRunner = class ShellRunner {
    /**
     * Returns a promise that invokes the shell command
     * @param cmd shell command string
     * @returns {Promise<Array>} console output as an array of strings
     */
    async run(cmd) {
        const self = this
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


            child.on('error', err => {
                reject(err)
            })

            child.on('close', (code, signal) => {
                if (code) {
                    reject(new Error(`Command exit with error code: ${code}`))
                }

                resolve(output)
            })
        })
    }
}