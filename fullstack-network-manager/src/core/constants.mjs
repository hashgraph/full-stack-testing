import { dirname, normalize } from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

// -------------------- fsnetman related constants ---------------------------------------------------------------------
export const CUR_FILE_DIR = dirname(fileURLToPath(import.meta.url))
export const USER = `${process.env.USER}`
export const FST_HOME_DIR = `${process.env.HOME}/.fsnetman`
export const FST_LOGS_DIR = `${FST_HOME_DIR}/logs`
export const FST_CACHE_DIR = `${FST_HOME_DIR}/cache`
export const CLUSTER_NAME = 'fst'
export const RELEASE_NAME = 'fst'
export const NAMESPACE_NAME = `fst-${USER}`
export const HELM = 'helm'
export const KIND = 'kind'
export const KUBECTL = 'kubectl'
export const CWD = process.cwd()
export const FST_CONFIG_FILE = `${FST_HOME_DIR}/fsnetman.config`
export const RESOURCES_DIR = normalize(CUR_FILE_DIR + '/../../resources')

export const ROOT_CONTAINER = 'root-container'

// --------------- Hedera related constants --------------------------------------------------------------------
export const HEDERA_HGCAPP_DIR = '/opt/hgcapp'
export const HEDERA_SERVICES_PATH = `${HEDERA_HGCAPP_DIR}/services-hedera`
export const HEDERA_HAPI_PATH = `${HEDERA_SERVICES_PATH}/HapiApp2.0`
export const HEDERA_DATA_APPS_DIR = 'data/apps'
export const HEDERA_DATA_LIB_DIR = 'data/lib'
export const HEDERA_USER_HOME_DIR = '/home/hedera'
export const HEDERA_APP_JAR = 'HederaNode.jar'
export const HEDERA_NODE_DEFAULT_STAKE_AMOUNT = 1
export const HEDERA_BUILDS_URL = 'https://builds.hedera.com'

// --------------- Logging related constants ---------------------------------------------------------------------------
export const LOG_STATUS_PROGRESS = chalk.cyan('>>')
export const LOG_STATUS_DONE = chalk.green('OK')
export const LOG_GROUP_DIVIDER = chalk.yellow('----------------------------------------------------------------------------')

// --------------- Charts related constants ----------------------------------------------------------------------------
export const CHART_REPO_FST_URL = 'https://hashgraph.github.io/full-stack-testing/charts'
export const CHART_FST_REPO_NAME = 'full-stack-testing'
export const CHART_FST_SETUP_NAME = 'fullstack-cluster-setup'
export const CHART_FST_DEPLOYMENT_NAME = 'fullstack-deployment'
export const CHART_REPO_JSON_RPC_RELAY_URL = 'https://hashgraph.github.io/hedera-json-rpc-relay/charts'
export const CHART_JSON_RPC_RELAY_REPO_NAME = 'hedera-json-rpc-relay'
export const CHART_JSON_RPC_RELAY_NAME = 'hedera-json-rpc-relay'
export const CHART_MIRROR_NODE_URL = 'https://hashgraph.github.io/hedera-mirror-node/charts'
export const CHART_MIRROR_NODE_REPO_NAME = 'hedera-mirror'
export const CHART_MIRROR_NODE_NAME = 'hedera-mirror'
export const DEFAULT_CHART_REPO = new Map()
  .set(CHART_FST_REPO_NAME, CHART_REPO_FST_URL)
  .set(CHART_JSON_RPC_RELAY_REPO_NAME, CHART_REPO_JSON_RPC_RELAY_URL)
  .set(CHART_MIRROR_NODE_REPO_NAME, CHART_MIRROR_NODE_URL)
