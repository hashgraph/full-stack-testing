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
   * @param pemStr PEM data
   * @param algo key algorithm
   * @param keyUsages key usages
   * @returns {Promise<CryptoKey>}
   */
  async convertPemToPrivateKey (pemStr, algo = KeyManager.SigningKeyAlgo, keyUsages = ['sign']) {
    const ab = x509.PemConverter.decode(pemStr)
    return await crypto.subtle.importKey('pkcs8', ab[0], algo, false, keyUsages)
  }

  /**
   * Return file names for node key
   * @param nodeId node ID
   * @param keyPrefix key prefix such as constants.PFX_AGREEMENT_KEY_PREFIX
   * @param keyDir directory where keys and certs are stored
   * @returns {{privateKeyFile: string, certificateFile: string}}
   */
  prepareNodeKeyFiles (nodeId, keyDir, keyPrefix = constants.PFX_SIGNING_KEY_PREFIX) {
    if (!nodeId) throw new MissingArgumentError('nodeId is required')
    if (!keyDir) throw new MissingArgumentError('keyDir is required')
    if (!keyPrefix) throw new MissingArgumentError('keyPrefix is required')

    const keyFile = path.join(keyDir, Templates.renderKeyFileName(constants.PFX_SIGNING_KEY_PREFIX, nodeId))
    const certFile = path.join(keyDir, Templates.renderCertFileName(constants.PFX_SIGNING_KEY_PREFIX, nodeId))

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
    if (!nodeKey || !nodeKey.privateKeyPem) throw new MissingArgumentError('nodeKey.privateKeyPem is required')
    if (!nodeKey || !nodeKey.certificatePem) throw new MissingArgumentError('nodeKey.certificatePem is required')

    const nodeKeyFiles = this.prepareNodeKeyFiles(nodeId, keyDir, constants.PFX_SIGNING_KEY_PREFIX)

    return new Promise((resolve, reject) => {
      try {
        fs.writeFileSync(nodeKeyFiles.privateKeyFile, nodeKey.privateKeyPem)
        fs.writeFileSync(nodeKeyFiles.certificateFile, nodeKey.certificatePem)
        resolve(nodeKeyFiles)
      } catch (e) {
        reject(e)
      }
    })
  }

  async loadNodeKey (nodeId, keyDir, algo, keyPrefix = constants.PFX_SIGNING_KEY_PREFIX) {
    if (!algo) throw new MissingArgumentError('algo is required')

    const nodeKeyFiles = this.prepareNodeKeyFiles(nodeId, keyDir, keyPrefix)

    const keyBytes = await fs.readFileSync(nodeKeyFiles.privateKeyFile)
    const certBytes = await fs.readFileSync(nodeKeyFiles.certificateFile)
    const keyPem = keyBytes.toString()
    const certPem = certBytes.toString()

    const key = await this.convertPemToPrivateKey(keyPem, algo)
    const cert = new x509.X509Certificate(certPem)

    return {
      privateKey: key,
      privateKeyPem: keyPem,
      certificate: cert,
      certificatePem: certPem
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
        name: friendlyName,
        notBefore: curDate,
        notAfter: new Date().setFullYear(curDate.getFullYear() + 10),
        signingAlgorithm: KeyManager.SigningKeyAlgo,
        keys: keypair,
        extensions: [
          new x509.BasicConstraintsExtension(true, 1, true),
          new x509.ExtendedKeyUsageExtension([x509.ExtendedKeyUsage.serverAuth, x509.ExtendedKeyUsage.clientAuth], true),
          new x509.KeyUsagesExtension(x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign, true),
          await x509.SubjectKeyIdentifierExtension.create(keypair.publicKey)
        ]
      })

      const keyPem = await this.convertPrivateKeyToPem(keypair.privateKey)
      const certPem = cert.toString('pem')

      return {
        privateKey: keypair.privateKey,
        privateKeyPem: keyPem,
        certificate: cert,
        certificatePem: certPem
      }
    } catch (e) {
      throw new FullstackTestingError(`failed to generate signing key: ${e.message}`, e)
    }
  }

  /**
   * Load PEM formatted signing key and certificate fom a directory path
   * @param nodeId node ID
   * @param keyDir directory path where pem files are stored
   * @returns CryptoKeyPair
   */
  async loadSigningKey (nodeId, keyDir) {
    return this.loadNodeKey(nodeId, keyDir, KeyManager.SigningKeyAlgo, constants.PFX_SIGNING_KEY_PREFIX)
  }

  /**
   * Generate and store EC key and cert in PEM format
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
      const friendlyName = Templates.renderNodeFriendlyName(keyPrefix, nodeId)
      const keypair = await crypto.subtle.generateKey(KeyManager.ECKeyAlgo, true, ['sign', 'verify'])

      const cert = await x509.X509CertificateGenerator.create({
        publicKey: keypair.publicKey,
        signingKey: signingKey.privateKey,
        subject: `CN=${friendlyName}`,
        issuer: signingKey.certificate.subject,
        serialNumber: '01',
        notBefore: curDate,
        notAfter: new Date().setFullYear(curDate.getFullYear() + 10),
        signingAlgorithm: KeyManager.SigningKeyAlgo,
        extensions: [
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyEncipherment)
        ],
        attributes: [
          new x509.ChallengePasswordAttribute(constants.PFX_DUMMY_PASSWORD)
        ]
      })

      // if (!await cert.verify({signatureOnly: true})) {
      //   throw new FullstackTestingError(`failed to verify certificate for '${friendlyName}'`)
      // }

      // const certChain = [signingKey.certificate, cert]

      const keyPem = await this.convertPrivateKeyToPem(keypair.privateKey)
      const certPem = cert.toString('pem')

      return {
        privateKey: keypair.privateKey,
        privateKeyPem: keyPem,
        certificate: cert,
        certificatePem: certPem
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
