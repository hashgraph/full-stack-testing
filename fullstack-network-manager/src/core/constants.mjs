import { dirname, normalize } from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

// directory of this fle
const CUR_FILE_DIR = dirname(fileURLToPath(import.meta.url))
const USER = `${process.env.USER}`
const FST_HOME_DIR = `${process.env.HOME}/.fsnetman`
const HGCAPP_DIR = '/opt/hgcapp'
const CHART_REPO_FST = 'https://hashgraph.github.io/full-stack-testing/charts'
const CHART_REPO_JSON_RPC_RELAY = 'https://hashgraph.github.io/hedera-json-rpc-relay/charts'
const CHART_MIRROR_NODE = 'https://hashgraph.github.io/hedera-mirror-node/charts'

export const constants = {
  USER: `${USER}`,
  CLUSTER_NAME: 'fst',
  RELEASE_NAME: 'fst',
  NAMESPACE_NAME: `fst-${USER}`,
  HELM: 'helm',
  KIND: 'kind',
  KUBECTL: 'kubectl',
  CWD: process.cwd(),
  FST_HOME_DIR,
  FST_LOGS_DIR: `${FST_HOME_DIR}/logs`,
  FST_CACHE_DIR: `${FST_HOME_DIR}/cache`,
  FST_CONFIG_FILE: `${FST_HOME_DIR}/fsnetman.config`,
  RESOURCES_DIR: normalize(CUR_FILE_DIR + '/../../resources'),
  HGCAPP_DIR,
  HGCAPP_SERVICES_HEDERA_PATH: `${HGCAPP_DIR}/services-hedera`,
  HAPI_PATH: `${HGCAPP_DIR}/services-hedera/HapiApp2.0`,
  ROOT_CONTAINER: 'root-container',
  DATA_APPS_DIR: 'data/apps',
  DATA_LIB_DIR: 'data/lib',
  HEDERA_USER_HOME_DIR: '/home/hedera',
  HEDERA_APP_JAR: 'HederaNode.jar',
  HEDERA_NODE_DEFAULT_STAKE_AMOUNT: 1,
  HEDERA_BUILDS_URL: 'https://builds.hedera.com',
  LOG_STATUS_PROGRESS: chalk.cyan('>>'),
  LOG_STATUS_DONE: chalk.green('OK'),
  LOG_GROUP_DIVIDER: chalk.yellow('----------------------------------------------------------------------------'),
  FST_CHART_SETUP_NAME: 'fullstack-cluster-setup',
  FST_CHART_DEPLOYMENT_NAME: 'fullstack-deployment',
  DEFAULT_CHART_REPO: new Map()
    .set('full-stack-testing', CHART_REPO_FST)
    .set('hedera-json-rpc-relay', CHART_REPO_JSON_RPC_RELAY)
    .set('hedera-mirror-node', CHART_MIRROR_NODE)
}
