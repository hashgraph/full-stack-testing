/**
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the ""License"");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an ""AS IS"" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { FullstackTestingError } from './errors.mjs'
import * as core from './index.mjs'
import { ShellRunner } from './shell_runner.mjs'

export class DependencyManager extends ShellRunner {
  constructor (logger) {
    super(logger)

    // map of dependency checks
    this.checks = new Map()
      .set(core.constants.HELM, () => this.checkHelm())
  }

  async runCheck (cmdString) {
    try {
      await this.run(cmdString)
    } catch (e) {
      this.logger.error(e)
      return false
    }

    return true
  }

  /**
   * Check if 'helm' CLI program is installed or not
   * @returns {Promise<boolean>}
   */
  async checkHelm () {
    return this.runCheck(`${core.constants.HELM} version`)
  }

  /**
   * Check if the required dependency is installed or not
   * @param dep is the name of the program
   * @returns {Promise<boolean>}
   */
  async checkDependency (dep) {
    this.logger.debug(`Checking for dependency: ${dep}`)

    let status = false
    const check = this.checks.get(dep)
    if (check) {
      status = await check()
    }

    if (!status) {
      this.logger.warn(`Dependency ${dep} is not found`)
      throw new FullstackTestingError(`${dep} is not found`)
    }

    this.logger.debug(`Dependency ${dep} is found`)
    return true
  }

  taskCheckDependencies (deps = []) {
    const subTasks = []
    deps.forEach(dep => {
      subTasks.push({
        title: `Check dependency: ${dep}`,
        task: () => this.checkDependency(dep)
      })
    })

    return subTasks
  }
}
