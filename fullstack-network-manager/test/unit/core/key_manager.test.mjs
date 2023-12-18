import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import forge from 'node-forge'
import os from 'os'
import path from 'path'
import { constants, logging, Templates } from '../../../src/core/index.mjs'
import { KeyManager } from '../../../src/core/key_manager.mjs'
import crypto from 'crypto'

function getPrivateKeyBag (pfxKey, friendlyName) {
  const privateKeyDer = fs.readFileSync(pfxKey.privateKeyPfx, { encoding: 'binary' })
  const privateKeyAsn1 = forge.asn1.fromDer(privateKeyDer)
  const privateKeyPkcs12 = forge.pkcs12.pkcs12FromAsn1(privateKeyAsn1, false, constants.PFX_DUMMY_PASSWORD)
  expect(privateKeyPkcs12).not.toBeNull()
  expect(privateKeyPkcs12.safeContents.length).toBe(2)

  const bags = privateKeyPkcs12.getBags({ friendlyName, bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  expect(bags.friendlyName.length).toBe(1)
  if (bags.friendlyName[0].key === null) {
    expect(bags.friendlyName[0].asn1).not.toBeNull()
  }

  return bags.friendlyName[0]
}

function getPublicKeyBag (pfxKey) {
  const publicKeyDer = fs.readFileSync(pfxKey.publicKeyPfx, { encoding: 'binary' })
  const publicKeyAsn1 = forge.asn1.fromDer(publicKeyDer)
  const publicKeyPkcs12 = forge.pkcs12.pkcs12FromAsn1(publicKeyAsn1, false, constants.PFX_DUMMY_PASSWORD)
  expect(publicKeyPkcs12).not.toBeNull()
  expect(publicKeyPkcs12.safeContents.length).toBe(1)

  const bags = publicKeyPkcs12.getBags({ bagType: forge.pki.oids.cert })
  expect(bags.undefined.length).toBeGreaterThanOrEqual(1) // there should be more than 1 certs

  return bags.undefined[0]
}
function verifySigningPfxKeyFile (pfxKey, friendlyName) {
  // verify private key pfx
  const keyBag = getPrivateKeyBag(pfxKey, friendlyName)
  expect(keyBag).not.toBeNull()

  // TODO check private key format and attributes

  // verify public key pfx
  const certBag = getPublicKeyBag(pfxKey)
  expect(certBag).not.toBeNull()

  // TODO check cert format and attributes
}

function verifyPfxKeyFile (pfxKey, friendlyName) {
  // verify private key pfx
  const keyBag = getPrivateKeyBag(pfxKey, friendlyName)
  expect(keyBag).not.toBeNull()

  // TODO check private key format and attributes

  // verify public key pfx
  const certBag = getPublicKeyBag(pfxKey)
  expect(certBag).not.toBeNull()

  // TODO check cert format and attributes
}

/**
 * Convert an ArrayBuffer into a string
 * from https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string/
 */
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
describe('KeyManager', () => {
  const logger = logging.NewLogger('debug')
  const keyManager = new KeyManager(logger)
  it('precheck: verify pre-generated signing-key pfx file', async () => {
    const nodeId = 'node0'
    const pfxKey = {
      privateKeyPfx: path.join('test/data', Templates.renderPfxFileName(constants.PFX_SIGNING_KEY_PREFIX, constants.PFX_TYPE_PRIVATE, nodeId)),
      publicKeyPfx: path.join('test/data', Templates.renderPfxFileName(constants.PFX_SIGNING_KEY_PREFIX, constants.PFX_TYPE_PUBLIC, nodeId))
    }
    const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_SIGNING_KEY_PREFIX, nodeId)
    verifySigningPfxKeyFile(pfxKey, friendlyName)
  })

  it('precheck: verify pre-generated agreement-key pfx file', async () => {
    const nodeId = 'node0'
    const pfxKey = {
      privateKeyPfx: path.join('test/data', Templates.renderPfxFileName(constants.PFX_AGREEMENT_KEY_PREFIX, constants.PFX_TYPE_PRIVATE, nodeId)),
      publicKeyPfx: path.join('test/data', Templates.renderPfxFileName(constants.PFX_AGREEMENT_KEY_PREFIX, constants.PFX_TYPE_PUBLIC, nodeId))
    }
    const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_AGREEMENT_KEY_PREFIX, nodeId)
    verifyPfxKeyFile(pfxKey, friendlyName)
  })

  it('should generate signing key', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'))
    const nodeId = 'node0'
    const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_SIGNING_KEY_PREFIX, nodeId)
    const signingKeyPfx = await keyManager.signingKeyPfx(nodeId, tmpDir)
    verifySigningPfxKeyFile(signingKeyPfx, friendlyName)
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('should generate agreement key', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'))
    const nodeId = 'node0'
    const signingKey = keyManager.loadSigningKeyPair(nodeId, 'test/data')
    const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_AGREEMENT_KEY_PREFIX, nodeId)
    const agreementKeyPfx = await keyManager.agreementKeyPfx(nodeId, tmpDir, signingKey)
    verifyPfxKeyFile(agreementKeyPfx, friendlyName)
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('should generate encryption key', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'))
    const nodeId = 'node0'
    const signingKey = keyManager.loadSigningKeyPair(nodeId, 'test/data')
    const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_ENCRYPTION_KEY_PREFIX, nodeId)
    const encryptionKeyPfx = keyManager.encryptionKeyPfx(nodeId, tmpDir, signingKey)
    verifyPfxKeyFile(encryptionKeyPfx, friendlyName)
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('should generate pfx file', async() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-'))
    const nodeId = 'node0'
    const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_ENCRYPTION_KEY_PREFIX, nodeId)
    const alg = {
      name: "ECDSA",
      namedCurve: "P-384",
      hash: "SHA-384",
    }

    const rsaAlg = {
      name: "RSA-PSS",
        // Consider using a 4096-bit key for systems that require long-term security
        modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    }

    let privateKey = null
    // var keys = forge.pki.rsa.generateKeyPair(3072);
    // var pem = forge.pki.privateKeyToPem(keys.privateKey);
    // privateKey = forge.pki.privateKeyFromPem(pem)

    const rsaKeypair = await crypto.generateKeyPairSync('rsa', {
      modulusLength: 3072,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    let rsaPrivateKey = forge.pki.privateKeyFromPem(rsaKeypair.privateKey);
    let rsaPubicKey = forge.pki.certificateFromPem(rsaKeypair.publicKey);

    const ecKeypair = await crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp384r1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    let ecPrivateKey = forge.pki.privateKeyFromPem(ecKeypair.privateKey);

    // const pkcs8Key= await crypto.subtle.exportKey('pkcs8', keypair.privateKey)
    // const pkcs8KeyStr= ab2str(pkcs8Key);
    // const pkcs8KeyBase64= new Buffer(pkcs8KeyStr).toString('base64');
    // const pemKey= `-----BEGIN PRIVATE KEY-----\n${pkcs8KeyBase64}\n-----END PRIVATE KEY-----`;
    const encryptionKeyPfx = keyManager.generatePfxFiles(nodeId, tmpDir, signingKey)
    verifyPfxKeyFile(encryptionKeyPfx, friendlyName)
    fs.rmSync(tmpDir, { recursive: true })
  })
})
