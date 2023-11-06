import {dirname, normalize} from "path"
import {fileURLToPath} from "url"

// directory of this fle
const CUR_FILE_DIR = dirname(fileURLToPath(import.meta.url))
const USER = `${process.env.USER}`
const FST_HOME_DIR = `${process.env.HOME}/.fsnetman`

export const constants = {
    USER: `${USER}`,
    CLUSTER_NAME: `fst`,
    RELEASE_NAME: `fst`,
    NAMESPACE_NAME: `fst-${USER}`,
    HELM: 'helm',
    KIND: 'kind',
    KUBECTL: 'kubectl',
    CWD: process.cwd(),
    FST_HOME_DIR: FST_HOME_DIR,
    FST_LOGS_DIR: `${FST_HOME_DIR}/logs`,
    FST_HEDERA_RELEASES_DIR: `${FST_HOME_DIR}/hedera-releases`,
    RESOURCES_DIR: normalize(CUR_FILE_DIR + "/../../resources")
}
