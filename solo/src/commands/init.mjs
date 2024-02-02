import { Listr } from 'listr2'
import { BaseCommand } from './base.mjs'
import * as core from '../core/index.mjs'
import { constants } from '../core/index.mjs'
import * as fs from 'fs'
import { FullstackTestingError } from '../core/errors.mjs'
import * as flags from './flags.mjs'

/**
 * Defines the core functionalities of 'init' command
 */
export class InitCommand extends BaseCommand {
  /**
   * Setup home directories
   * @param dirs a list of directories that need to be created in sequence
   */
  setupHomeDirectory (dirs = [
    constants.SOLO_HOME_DIR,
    constants.SOLO_LOGS_DIR,
    constants.SOLO_CACHE_DIR
  ]) {
    const self = this

    try {
      dirs.forEach(dirPath => {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath)
        }
        self.logger.debug(`OK: setup directory: ${dirPath}`)
      })
    } catch (e) {
      this.logger.error(e)
      throw new FullstackTestingError(e.message, e)
    }

    return dirs
  }

  /**
   * Executes the init CLI command
   * @returns {Promise<boolean>}
   */
  async init (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Setup home directory and cache',
        task: async (ctx, _) => {
          ctx.dirs = this.setupHomeDirectory()
        }
      },
      {
        title: 'Setup config manager',
        task: async (ctx, _) => {
          ctx.config = this.configManager.load(argv, true)
        }
      },
      {
        title: 'Check dependencies',
        task: async (_, task) => {
          const deps = [
            core.constants.HELM
          ]

          const subTasks = self.depManager.taskCheckDependencies(deps)

          // set up the sub-tasks
          return task.newListr(subTasks, {
            concurrent: true,
            rendererOptions: {
              collapseSubtasks: false
            }
          })
        }
      },
      {
        title: 'Setup chart manager',
        task: async (ctx, _) => {
          ctx.repoURLs = await this.chartManager.setup()
          if (argv.dev) {
            self.logger.showList('Home Directories', ctx.dirs)
            self.logger.showList('Chart Repository', ctx.repoURLs)
            self.logger.showJSON('Cached Config', ctx.config)
          }
        }
      }
    ], {
      concurrent: false,
      rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
    })

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error running init', e)
    }

    return true
  }

  /**
   * Return Yargs command definition for 'init' command
   * @param initCmd an instance of InitCommand
   */
  static getCommandDefinition (initCmd) {
    return {
      command: 'init',
      desc: 'Initialize local environment and default flags',
      builder: y => {
        const requiredFlags = [flags.namespace.name, flags.releaseTag.name, flags.nodeIDs.name]
        for (const flag of flags.allFlags) {
          if (requiredFlags.includes(flag.name)) {
            flags.setCommandFlag(y, flag, true)
          } else {
            flags.setCommandFlag(y, flag, false)
          }
        }
      },
      handler: (argv) => {
        initCmd.init(argv).then(r => {
          if (!r) process.exit(1)
        }).catch(err => {
          initCmd.logger.showUserError(err)
          process.exit(1)
        })
      }
    }
  }
}
