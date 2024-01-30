import { describe, expect, it } from '@jest/globals'
import { ConfigManager, logging } from '../../../src/core/index.mjs'
import * as flags from '../../../src/commands/flags.mjs'
import { v4 as uuid4 } from 'uuid'
import fs from 'fs'

describe('ConfigManager', () => {
  describe('empty config file', () => {
    const testLogger = logging.NewLogger('debug')
    const cm = new ConfigManager(testLogger)
    it('should be able to load cached config file with null argv', () => {
      cm.load(null)
      expect(cm.config).not.toBeNull()
      expect(cm.config.version).not.toBeNull()
      expect(cm.config.flags).not.toBeNull()
      expect(cm.config.updatedAt).not.toBeNull()
    })

    it('should be able to refresh config from argv', () => {
      cm.load()
      expect(cm.config).not.toBeNull()
      expect(cm.config.version).not.toBeNull()
      expect(cm.config.flags).not.toBeNull()
      expect(cm.config.updatedAt).not.toBeNull()

      const previousNamespace = cm.getFlag(flags.namespace)
      const previousUpdatedAt = cm.config.updatedAt

      const argv = {}
      argv[flags.namespace.name] = uuid4()
      cm.load(argv)
      expect(cm.getFlag(flags.namespace)).not.toBe(previousNamespace)
      expect(cm.getFlag(flags.namespace)).toBe(argv[flags.namespace.name])
      expect(cm.config.updatedAt).not.toBe(previousUpdatedAt)
    })
  })
  describe('ConfigManager with loaded configs', () => {
    const testLogger = logging.NewLogger('debug')
    const configFilePath = process.cwd() + '/test/data/solo-test-1.config'
    const cm = new ConfigManager(testLogger, configFilePath, false)

    it('should be able to load a config file override in the constructor',
      () => {
        cm.load()
        expect(cm.config).not.toBeNull()
      })
    it('config file match, dev=false', () => {
      expect(cm.config.flags[flags.devMode.name]).toBeFalsy()
    })
    it('config file match, namespace=fst-user', () => {
      expect(cm.config.flags[flags.namespace.name]).toBe('fst-user')
    })
    it('config file match, chartDirectory is empty', () => {
      expect(cm.config.flags[flags.chartDirectory.name]).toBe('')
    })
    it('config file match, clusterName=kind-kind', () => {
      expect(cm.config.flags[flags.clusterName.name]).toBe('kind-kind')
    })
    it('config file match, deployPrometheusStack=false', () => {
      expect(cm.config.flags[flags.deployPrometheusStack.name]).toBeFalsy()
    })
    it('config file match, deployMinio=false', () => {
      expect(cm.config.flags[flags.deployMinio.name]).toBeFalsy()
    })
    it('config file match, deployCertManager=false', () => {
      expect(cm.config.flags[flags.deployCertManager.name]).toBeFalsy()
    })
    it('config file match, deployCertManagerCrds=false', () => {
      expect(cm.config.flags[flags.deployCertManagerCrds.name]).toBeFalsy()
    })
    it('not set, it should be undefined', () => {
      expect(cm.config.flags[flags.enablePrometheusSvcMonitor.name]).toBeUndefined()
    })
    it('not set, it should be undefined', () => {
      expect(cm.config.flags[flags.enableHederaExplorerTls.name]).toBeUndefined()
    })
    it('not set, it should be undefined', () => {
      expect(cm.config.flags[flags.hederaExplorerTlsHostName.name]).toBeUndefined()
    })
    it('not set, it should be undefined', () => {
      expect(cm.config.flags[flags.deletePvcs.name]).toBeUndefined()
    })
  })
  describe('ConfigManager with loaded configs and argv overrides', () => {
    const testLogger = logging.NewLogger('debug')
    const configFilePath = process.cwd() + '/test/data/solo-test-2.config'
    const cm = new ConfigManager(testLogger, configFilePath)
    const clusterName = ''
    const namespace = ''
    const argv = {}
    argv[flags.clusterName.name] = clusterName
    argv[flags.namespace.name] = namespace
    cm.load(argv)
    const configJSON = fs.readFileSync(process.cwd() + '/test/data/solo-test-2.config')
    const newConfig = JSON.parse(configJSON.toString())

    it('config file takes precedence over empty namespace', () => {
      expect(newConfig.flags[flags.namespace.name]).toBe('fst-user')
    })
    it('config file takes precedence over empty cluster name', () => {
      expect(newConfig.flags[flags.clusterName.name]).toBe('kind-kind')
    })
  })
})
