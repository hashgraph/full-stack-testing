import { Init } from './init.mjs'
export const InitCmd= {
    command: "init",
    desc: "Initialize local environment",
    builder: {},
    handler: function (argv) {
        Init.init(argv)
    },
}
