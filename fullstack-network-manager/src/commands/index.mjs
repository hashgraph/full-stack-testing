import { ClusterCommand } from './cluster.mjs'
import { InitCommand } from './init.mjs'
import { NetworkCommand } from './network.mjs'
import { NodeCommand } from './node.mjs'
import { RelayCommand } from './relay.mjs'
import * as flags from './flags.mjs'

/*
 * Return a list of Yargs command builder to be exposed through CLI
 * @param opts it is an Options object containing logger
 */
function Initialize (opts) {
  const initCmd = new InitCommand(opts)
  const clusterCmd = new ClusterCommand(opts)
  const networkCommand = new NetworkCommand(opts)
  const nodeCmd = new NodeCommand(opts)
  const relayCmd = new RelayCommand(opts)

  return [
    InitCommand.getCommandDefinition(initCmd),
    ClusterCommand.getCommandDefinition(clusterCmd),
    NetworkCommand.getCommandDefinition(networkCommand),
    NodeCommand.getCommandDefinition(nodeCmd),
    RelayCommand.getCommandDefinition(relayCmd)
  ]
}

// Expose components from the command module
export { Initialize, flags }
