import { AccountId } from '@hashgraph/sdk'
import { color, PRESET_TIMER } from 'listr2'
import { dirname, normalize } from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

// -------------------- solo related constants ---------------------------------------------------------------------
export const CUR_FILE_DIR = dirname(fileURLToPath(import.meta.url))
export const USER = `${process.env.USER}`
export const USER_SANITIZED = USER.replace(/[\W_]+/g, '-')
export const SOLO_HOME_DIR = `${process.env.HOME}/.solo`
export const SOLO_LOGS_DIR = `${SOLO_HOME_DIR}/logs`
export const SOLO_CACHE_DIR = `${SOLO_HOME_DIR}/cache`
export const DEFAULT_NAMESPACE = 'default'
export const HELM = 'helm'
export const CWD = process.cwd()
export const SOLO_CONFIG_FILE = `${SOLO_HOME_DIR}/solo.config`
export const RESOURCES_DIR = normalize(CUR_FILE_DIR + '/../../resources')

export const ROOT_CONTAINER = 'root-container'

// --------------- Hedera network and node related constants --------------------------------------------------------------------
export const HEDERA_CHAIN_ID = process.env.SOLO_CHAIN_ID || '298'
export const HEDERA_HGCAPP_DIR = '/opt/hgcapp'
export const HEDERA_SERVICES_PATH = `${HEDERA_HGCAPP_DIR}/services-hedera`
export const HEDERA_HAPI_PATH = `${HEDERA_SERVICES_PATH}/HapiApp2.0`
export const HEDERA_DATA_APPS_DIR = 'data/apps'
export const HEDERA_DATA_LIB_DIR = 'data/lib'
export const HEDERA_USER_HOME_DIR = '/home/hedera'
export const HEDERA_APP_NAME = 'HederaNode.jar'
export const HEDERA_BUILDS_URL = 'https://builds.hedera.com'
export const HEDERA_NODE_ACCOUNT_ID_START = AccountId.fromString(process.env.SOLO_NODE_ACCOUNT_ID_START || '0.0.3')
export const HEDERA_NODE_INTERNAL_GOSSIP_PORT = process.env.SOLO_NODE_INTERNAL_GOSSIP_PORT || '50111'
export const HEDERA_NODE_EXTERNAL_GOSSIP_PORT = process.env.SOLO_NODE_EXTERNAL_GOSSIP_PORT || '50111'

export const HEDERA_NODE_GRPC_PORT = process.env.SOLO_NODE_GRPC_PORT || '50211'
export const HEDERA_NODE_GRPCS_PORT = process.env.SOLO_NODE_GRPC_PORT || '50212'
export const HEDERA_NODE_DEFAULT_STAKE_AMOUNT = process.env.SOLO_NODE_DEFAULT_STAKE_AMOUNT || 1

// --------------- Logging related constants ---------------------------------------------------------------------------
export const LOG_STATUS_PROGRESS = chalk.cyan('>>')
export const LOG_STATUS_DONE = chalk.green('OK')
export const LOG_GROUP_DIVIDER = chalk.yellow('----------------------------------------------------------------------------')

// --------------- Charts related constants ----------------------------------------------------------------------------
export const FULLSTACK_TESTING_CHART_URL = 'https://hashgraph.github.io/full-stack-testing/charts'
export const FULLSTACK_TESTING_CHART = 'full-stack-testing'
export const FULLSTACK_CLUSTER_SETUP_CHART = 'fullstack-cluster-setup'
export const FULLSTACK_DEPLOYMENT_CHART = 'fullstack-deployment'
export const JSON_RPC_RELAY_CHART_URL = 'https://hashgraph.github.io/hedera-json-rpc-relay/charts'
export const JSON_RPC_RELAY_CHART = 'hedera-json-rpc-relay'
export const MIRROR_NODE_CHART_URL = 'https://hashgraph.github.io/hedera-mirror-node/charts'
export const MIRROR_NODE_CHART = 'hedera-mirror'
export const DEFAULT_CHART_REPO = new Map()
  .set(FULLSTACK_TESTING_CHART, FULLSTACK_TESTING_CHART_URL)
  .set(JSON_RPC_RELAY_CHART, JSON_RPC_RELAY_CHART_URL)
  .set(MIRROR_NODE_CHART, MIRROR_NODE_CHART_URL)

// ------------------- Hedera Account related ---------------------------------------------------------------------------------
export const OPERATOR_ID = process.env.SOLO_OPERATOR_ID || '0.0.2'
export const OPERATOR_KEY = process.env.SOLO_OPERATOR_KEY || '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137'

export const POD_STATUS_RUNNING = 'Running'
export const POD_STATUS_READY = 'Ready'

// Listr related
export const LISTR_DEFAULT_RENDERER_TIMER_OPTION = {
  ...PRESET_TIMER,
  condition: (duration) => duration > 100,
  format: (duration) => {
    if (duration > 10000) {
      return color.red
    }

    return color.green
  }
}

export const LISTR_DEFAULT_RENDERER_OPTION = {
  timer: LISTR_DEFAULT_RENDERER_TIMER_OPTION
}
