import {dirname, normalize} from "path"
import {fileURLToPath} from "url"

// directory of this fle
const CUR_FILE_DIR = dirname(fileURLToPath(import.meta.url))
const USER = `${process.env.USER}`
export const constants = {
    USER: `${USER}`,
    CLUSTER_NAME: `fst-${USER}`,
    HELM: 'helm',
    KIND: 'kind',
    KUBECTL: 'kubectl',
    CWD: process.cwd(),
    FST_HOME_DIR: process.env.HOME + "/.fsnetman",
    RESOURCES_DIR: normalize(CUR_FILE_DIR + "/../../resources")
}
