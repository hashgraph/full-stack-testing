import {Init} from './init.mjs'

const InitCmd = {
    command: "init",
    desc: "Initialize local environment",
    builder: {},
    handler: function (argv) {
        Init.init(argv)
    },
}

export {InitCmd}
