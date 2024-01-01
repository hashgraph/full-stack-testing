import * as x509 from '@peculiar/x509'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { FullstackTestingError, MissingArgumentError } from './errors.mjs'
import { constants } from './index.mjs'
import { Logger } from './logging.mjs'
import { Templates } from './templates.mjs'

x509.cryptoProvider.set(crypto)

export class KeyManager {
  static CertificateExpiryYears = 10

  static SigningKeyAlgo = {
    name: 'RSASSA-PKCS1-v1_5',
    hash: 'SHA-384',
    publicExponent: new Uint8Array([1, 0, 1]),
    modulusLength: 3072
  }

  static SigningKeyUsage = ['sign', 'verify']

  static ECKeyAlgo = {
    name: 'ECDSA',
    namedCurve: 'P-384',
    hash: 'SHA-384'
  }

  constructor (logger) {
    if (!logger || !(logger instanceof Logger)) throw new MissingArgumentError('An instance of core/Logger is required')
    this.logger = logger
  }

  /**
   * Convert CryptoKey into PEM string
   * @param privateKey
   * @returns {Promise<string>}
   */
  async convertPrivateKeyToPem (privateKey) {
    const ab = await crypto.subtle.exportKey('pkcs8', privateKey)
    return x509.PemConverter.encode(ab, 'PRIVATE KEY')
  }

  /**
   * Convert PEM private key into CryptoKey
   * @param pemStr PEM string
   * @param algo key algorithm
   * @param keyUsages key usages
   * @returns {Promise<CryptoKey>}
   */
  async convertPemToPrivateKey (pemStr, algo = KeyManager.SigningKeyAlgo, keyUsages = ['sign']) {
    const items = x509.PemConverter.decode(pemStr)
    const lastItem = items[items.length - 1] // if there were a chain of items (similar to cert chains), we take the last.
    return await crypto.subtle.importKey('pkcs8', lastItem, algo, false, keyUsages)
  }

  /**
   * Return file names for node key
   * @param nodeId node ID
   * @param keyPrefix key prefix such as constants.PFX_AGREEMENT_KEY_PREFIX
   * @param keyDir directory where keys and certs are stored
   * @returns {{privateKeyFile: string, certificateFile: string}}
   */
  prepareNodeKeyFilePaths (nodeId, keyDir, keyPrefix = constants.PFX_SIGNING_KEY_PREFIX) {
    if (!nodeId) throw new MissingArgumentError('nodeId is required')
    if (!keyDir) throw new MissingArgumentError('keyDir is required')
    if (!keyPrefix) throw new MissingArgumentError('keyPrefix is required')

    const keyFile = path.join(keyDir, Templates.renderKeyFileName(keyPrefix, nodeId))
    const certFile = path.join(keyDir, Templates.renderCertFileName(keyPrefix, nodeId))

    return {
      privateKeyFile: keyFile,
      certificateFile: certFile
    }
  }

  /**
   * Store node keys and certs as PEM files
   * @param nodeId node ID
   * @param nodeKey an object containing privateKeyPem, certificatePem data
   * @param keyPrefix key prefix such as constants.PFX_AGREEMENT_KEY_PREFIX
   * @param keyDir directory where keys and certs are stored
   */
  async storeNodeKey (nodeId, nodeKey, keyDir, keyPrefix = constants.PFX_SIGNING_KEY_PREFIX) {
    if (!nodeId) throw new MissingArgumentError('nodeId is required')
    if (!keyDir) throw new MissingArgumentError('keyDir is required')
    if (!keyPrefix) throw new MissingArgumentError('keyPrefix is required')
    if (!nodeKey || !nodeKey.privateKey) throw new MissingArgumentError('nodeKey.privateKey is required')
    if (!nodeKey || !nodeKey.certificateChain) throw new MissingArgumentError('nodeKey.certificateChain is required')

    const nodeKeyFiles = this.prepareNodeKeyFilePaths(nodeId, keyDir, keyPrefix)
    const keyPem = await this.convertPrivateKeyToPem(nodeKey.privateKey)
    const certPems = []
    nodeKey.certificateChain.forEach(cert => {
      certPems.push(cert.toString('pem'))
    })

    return new Promise((resolve, reject) => {
      try {
        fs.writeFileSync(nodeKeyFiles.privateKeyFile, keyPem)

        // we need to write the PEM in reverse order
        // this is because certChain contains the certs in reverse order (issuer certificate comes last)
        certPems.reverse().forEach(certPem => {
          fs.writeFileSync(nodeKeyFiles.certificateFile, certPem + '\n', { flag: 'a' })
        })
        resolve(nodeKeyFiles)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Load node keys and certs from PEM files
   * @param nodeId node ID
   * @param keyDir directory where keys and certs are stored
   * @param algo algorithm used for key
   * @param keyPrefix key prefix such as constants.PFX_AGREEMENT_KEY_PREFIX
   */
  async loadNodeKey (nodeId, keyDir, algo, keyPrefix = constants.PFX_SIGNING_KEY_PREFIX) {
    if (!algo) throw new MissingArgumentError('algo is required')

    const nodeKeyFiles = this.prepareNodeKeyFilePaths(nodeId, keyDir, keyPrefix)

    const keyBytes = await fs.readFileSync(nodeKeyFiles.privateKeyFile)
    const keyPem = keyBytes.toString()
    const key = await this.convertPemToPrivateKey(keyPem, algo)

    const certBytes = await fs.readFileSync(nodeKeyFiles.certificateFile)
    const certPems = x509.PemConverter.decode(certBytes.toString()).reverse() // reverse to revert the sequence

    const certs = []
    certPems.forEach(certPem => {
      const cert = new x509.X509Certificate(certPem)
      certs.push(cert)
    })

    const certChain = await new x509.X509ChainBuilder({ certificates: certs.slice(1) }).build(certs[0])

    return {
      privateKey: key,
      certificate: certs[0],
      certificateChain: certChain
    }
  }

  /**
   * Generate signing key and certificate
   * @param nodeId node ID
   */
  async generateNodeSigningKey (nodeId) {
    try {
      const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_SIGNING_KEY_PREFIX, nodeId)
      const curDate = new Date()

      const keypair = await crypto.subtle.generateKey(
        KeyManager.SigningKeyAlgo,
        true,
        KeyManager.SigningKeyUsage)

      const cert = await x509.X509CertificateGenerator.createSelfSigned({
        serialNumber: '01',
        name: `CN=${friendlyName}`,
        notBefore: curDate,
        notAfter: new Date().setFullYear(curDate.getFullYear() + 10),
        keys: keypair,
        extensions: [
          new x509.BasicConstraintsExtension(true, 1, true),
          new x509.ExtendedKeyUsageExtension([x509.ExtendedKeyUsage.serverAuth, x509.ExtendedKeyUsage.clientAuth], true),
          new x509.KeyUsagesExtension(x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign, true),
          await x509.SubjectKeyIdentifierExtension.create(keypair.publicKey)
        ]
      })

      const certChain = await new x509.X509ChainBuilder().build(cert)

      return {
        privateKey: keypair.privateKey,
        certificate: cert,
        certificateChain: certChain
      }
    } catch (e) {
      throw new FullstackTestingError(`failed to generate signing key: ${e.message}`, e)
    }
  }

  /**
   * Load signing key and certificate
   * @param nodeId node ID
   * @param keyDir directory path where pem files are stored
   * @returns CryptoKeyPair
   */
  async loadSigningKey (nodeId, keyDir) {
    return this.loadNodeKey(nodeId, keyDir, KeyManager.SigningKeyAlgo, constants.PFX_SIGNING_KEY_PREFIX)
  }

  /**
   * Generate EC key and cert
   *
   * @param nodeId node ID
   * @param keyDir the directory where pem files should be stored
   * @param keyPrefix key prefix such as constants.PFX_AGREEMENT_KEY_PREFIX
   * @param signingKey signing key
   * @returns {privateKeyPfx:string|publicKeyPfx:string}
   */
  async ecKey (nodeId, keyDir, keyPrefix, signingKey) {
    if (!nodeId) throw new MissingArgumentError('nodeId is required')
    if (!keyDir) throw new MissingArgumentError('keyDir is required')
    if (!keyPrefix) throw new MissingArgumentError('keyPrefix is required')
    if (!signingKey) throw new MissingArgumentError('no signing key found')

    try {
      const curDate = new Date()
      const notAfter = new Date().setFullYear(curDate.getFullYear() + KeyManager.CertificateExpiryYears)
      const friendlyName = Templates.renderNodeFriendlyName(keyPrefix, nodeId)
      const keypair = await crypto.subtle.generateKey(KeyManager.ECKeyAlgo, true, ['sign', 'verify'])

      const cert = await x509.X509CertificateGenerator.create({
        publicKey: keypair.publicKey,
        signingKey: signingKey.privateKey,
        subject: `CN=${friendlyName}`,
        issuer: signingKey.certificate.subject,
        serialNumber: '01',
        notBefore: curDate,
        notAfter,
        extensions: [
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyEncipherment)
        ],
        attributes: [
          new x509.ChallengePasswordAttribute(constants.PFX_DUMMY_PASSWORD)
        ]
      })

      if (!await cert.verify({
        date: new Date(notAfter),
        publicKey: signingKey.certificate.publicKey,
        signatureOnly: true
      })) {
        throw new FullstackTestingError(`failed to verify generated certificate for '${friendlyName}'`)
      }

      const certChain = await new x509.X509ChainBuilder({ certificates: [signingKey.certificate] }).build(cert)

      return {
        privateKey: keypair.privateKey,
        certificate: cert,
        certificateChain: certChain
      }
    } catch (e) {
      throw new FullstackTestingError(`failed to generate ${keyPrefix}-key: ${e.message}`, e)
    }
  }

  /**
   * Generate agreement key
   * @param nodeId node ID
   * @param keyDir the directory where pfx files should be stored
   * @param signingKey signing key
   * @returns {privateKeyPfx:string|publicKeyPfx:string}
   */
  async agreementKey (nodeId, keyDir, signingKey) {
    return this.ecKey(nodeId, keyDir, constants.PFX_AGREEMENT_KEY_PREFIX, signingKey)
  }
}
