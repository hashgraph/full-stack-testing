import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { constants, logging } from '../../../src/core/index.mjs'
import { KeyManager } from '../../../src/core/key_manager.mjs'

describe('KeyManager', () => {
  const logger = logging.NewLogger('debug')
  const keyManager = new KeyManager(logger)

  it('should generate signing key', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'))
    const nodeId = 'node0'

    const signingKey = await keyManager.generateNodeSigningKey(nodeId)

    const files = await keyManager.storeNodeKey(nodeId, signingKey, tmpDir, constants.PFX_SIGNING_KEY_PREFIX)
    expect(files.privateKeyFile).not.toBeNull()
    expect(files.certificateFile).not.toBeNull()

    const nodeKey = await keyManager.loadSigningKey(nodeId, tmpDir, KeyManager.SigningKeyAlgo)
    expect(nodeKey.certificate).toStrictEqual(signingKey.certificate)
    expect(nodeKey.privateKeyPem).toStrictEqual(signingKey.privateKeyPem)
    expect(nodeKey.certificatePem).toStrictEqual(signingKey.certificatePem)
    expect(nodeKey.privateKey.algorithm).toStrictEqual(signingKey.privateKey.algorithm)
    expect(nodeKey.privateKey.type).toStrictEqual(signingKey.privateKey.type)
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('should generate agreement key', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'))
    const nodeId = 'node0'
    const signignKey = await keyManager.loadNodeKey(nodeId, 'test/data', KeyManager.SigningKeyAlgo, constants.PFX_SIGNING_KEY_PREFIX)

    const agreementKey = await keyManager.agreementKey(nodeId, tmpDir, signignKey)

    const files = await keyManager.storeNodeKey(nodeId, agreementKey, tmpDir, constants.PFX_AGREEMENT_KEY_PREFIX)
    expect(files.privateKeyFile).not.toBeNull()
    expect(files.certificateFile).not.toBeNull()

    const nodeKey = await keyManager.loadNodeKey(nodeId, tmpDir, KeyManager.ECKeyAlgo, constants.PFX_AGREEMENT_KEY_PREFIX)
    expect(nodeKey.certificate).toStrictEqual(agreementKey.certificate)
    expect(nodeKey.privateKeyPem).toStrictEqual(agreementKey.privateKeyPem)
    expect(nodeKey.certificatePem).toStrictEqual(agreementKey.certificatePem)
    expect(nodeKey.privateKey.algorithm).toStrictEqual(agreementKey.privateKey.algorithm)
    expect(nodeKey.privateKey.type).toStrictEqual(agreementKey.privateKey.type)

    fs.rmSync(tmpDir, { recursive: true })
  })
})
