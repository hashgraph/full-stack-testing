import {ClusterCommand} from "./cluster.mjs";
import {InitCommand} from "./init.mjs";

/*
 * Return a list of Yargs command builder to be exposed through CLI
 * @param opts it is an Options object containing logger
 */
function Initialize(opts) {
    const initCmd = new InitCommand(opts)
    const clusterCmd = new ClusterCommand(opts)

    return [
        InitCommand.getCommandDefinition(initCmd),
        ClusterCommand.getCommandDefinition(clusterCmd),
    ]
}

// Expose components from the command module
export { Initialize }
