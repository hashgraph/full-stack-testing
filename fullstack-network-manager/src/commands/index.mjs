import { ClusterCommand } from './cluster.mjs'
import { InitCommand } from './init.mjs'
import { ChartCommand } from './chart.mjs'
import { NodeCommand } from './node.mjs'
import {RelayCommand} from "./relay.mjs";

/*
 * Return a list of Yargs command builder to be exposed through CLI
 * @param opts it is an Options object containing logger
 */
function Initialize (opts) {
  const initCmd = new InitCommand(opts)
  const clusterCmd = new ClusterCommand(opts)
  const chartCmd = new ChartCommand(opts)
  const nodeCmd = new NodeCommand(opts)
  const relayCmd = new RelayCommand(opts)

  return [
    InitCommand.getCommandDefinition(initCmd),
    ClusterCommand.getCommandDefinition(clusterCmd),
    ChartCommand.getCommandDefinition(chartCmd),
    NodeCommand.getCommandDefinition(nodeCmd),
    RelayCommand.getCommandDefinition(relayCmd)
  ]
}

// Expose components from the command module
export { Initialize }
