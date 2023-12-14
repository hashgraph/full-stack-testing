import {describe, expect, it, jest} from "@jest/globals";
import fs from "fs";
import forge from "node-forge";
import os from "os";
import path from "path";
import {constants, logging, Templates} from "../../../src/core/index.mjs";
import {KeyManager} from "../../../src/core/key_manager.mjs";


function verifyPfxKeyFile(pfxKey, friendlyName) {
  // verify private key pfx
  const privateKeyDer = fs.readFileSync(pfxKey.privateKeyPfx, {encoding: 'binary'})
  const privateKeyAsn1 = forge.asn1.fromDer(privateKeyDer);
  const privateKeyPkcs12 = forge.pkcs12.pkcs12FromAsn1(privateKeyAsn1, false, constants.PFX_DUMMY_PASSWORD);
  expect(privateKeyPkcs12).not.toBeNull()
  expect(privateKeyPkcs12.safeContents.length).toBe(2)
  let bags = privateKeyPkcs12.getBags({friendlyName: friendlyName, bagType: forge.pki.oids.pkcs8ShroudedKeyBag});
  expect(bags.friendlyName.length).toBe(1)

  // verify public key pfx
  const publicKeyDer = fs.readFileSync(pfxKey.publicKeyPfx, {encoding: 'binary'})
  const publicKeyAsn1 = forge.asn1.fromDer(publicKeyDer);
  const publicKeyPkcs12 = forge.pkcs12.pkcs12FromAsn1(publicKeyAsn1, false, constants.PFX_DUMMY_PASSWORD);
  expect(publicKeyPkcs12).not.toBeNull()
  expect(publicKeyPkcs12.safeContents.length).toBe(1)
  bags = publicKeyPkcs12.getBags({friendlyName: friendlyName, bagType: forge.pki.oids.cert});
  expect(bags.friendlyName.length).toBe(1)
}

describe('KeyManager', () => {
  const logger = logging.NewLogger('debug')
  const keyManager = new KeyManager(logger)
  const testTempDir = 'test/data/tmp'

  it('should generate SHA384withRSA keypair', async () => {
    const keypair = keyManager.keyPair()
    expect(keypair).not.toBeNull()
    expect(keypair.privateKey).not.toBeNull()
    expect(keypair.publicKey).not.toBeNull()
  })

  it('should generate Certificate', () => {
    const nodeId = 'node0'
    const friendlyName = Templates.renderNodeFriendlyName(nodeId)
    const keypair = keyManager.keyPair()
    const cert = keyManager.certificate(nodeId, keypair.publicKey, keypair.privateKey, friendlyName)
    expect(cert).not.toBeNull()
  })

  it('should generate signing key', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'))
    const nodeId = 'node0'
    const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_SIGNING_KEY_PREFIX, nodeId)
    const signingKeyPfx = keyManager.signingKeyPfx(nodeId, tmpDir)
    verifyPfxKeyFile(signingKeyPfx, friendlyName)
    fs.rmSync(tmpDir, {recursive: true})
  })

  it('should generate agreement key', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'))
    const nodeId = 'node0'
    const signingKey = keyManager.loadSigningKey(nodeId, 'test/data')
    const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_AGREEMENT_KEY_PREFIX, nodeId)
    const agreementKeyPfx = keyManager.agreementKeyPfx(nodeId, tmpDir, signingKey)
    verifyPfxKeyFile(agreementKeyPfx, friendlyName)
    fs.rmSync(tmpDir, {recursive: true})
  })

  it('should generate encryption key', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'))
    const nodeId = 'node0'
    const signingKey = keyManager.loadSigningKey(nodeId, 'test/data')
    const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_ENCRYPTION_KEY_PREFIX, nodeId)
    const encryptionKeyPfx = keyManager.encryptionKeyPfx(nodeId, tmpDir, signingKey)
    verifyPfxKeyFile(encryptionKeyPfx, friendlyName)
    fs.rmSync(tmpDir, {recursive: true})
  })
})
