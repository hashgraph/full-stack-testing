import { ClusterCommand } from './cluster.mjs'
import { InitCommand } from './init.mjs'
import { ChartCommand } from './chart.mjs'
import { NodeCommand } from './node.mjs'

/*
 * Return a list of Yargs command builder to be exposed through CLI
 * @param opts it is an Options object containing logger
 */
function Initialize (opts) {
  const initCmd = new InitCommand(opts)
  const clusterCmd = new ClusterCommand(opts)
  const chartCmd = new ChartCommand(opts)
  const nodeCmd = new NodeCommand(opts)

  return [
    InitCommand.getCommandDefinition(initCmd),
    ClusterCommand.getCommandDefinition(clusterCmd),
    ChartCommand.getCommandDefinition(chartCmd),
    NodeCommand.getCommandDefinition(nodeCmd)
  ]
}

// Expose components from the command module
export { Initialize }
