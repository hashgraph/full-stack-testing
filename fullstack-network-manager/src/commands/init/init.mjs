import {logger} from "../../core/logger.mjs"

export const Init = class {
    static init() {
        console.log('initializing....')
        try {
            this.installKind()
            this.installHelm()
            this.installKubectl()
        } catch (e) {
            logger.error(e)
        }
    }

    static installKind() {
        throw new Error("Not implemented")
    }

    static installHelm() {
        throw new Error("Not implemented")
    }

    static installKubectl() {
        throw new Error("Not implemented")
    }
}