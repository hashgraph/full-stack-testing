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
  async convertPemToPrivateKey (pemStr, algo, keyUsages = ['sign']) {
    if (!algo) throw new MissingArgumentError('algo is required')

    const items = x509.PemConverter.decode(pemStr)

    // Since pem file may include multiple PEM data, the decoder returns an array
    // However for private key there should be a single item.
    // So, we just being careful here to pick the last item (similar to how last PEM data represents the actual cert in
    // a certificate bundle)
    const lastItem = items[items.length - 1]

    return await crypto.subtle.importKey('pkcs8', lastItem, algo, false, keyUsages)
  }

  /**
   * Return file names for node key
   * @param nodeId node ID
   * @param keyPrefix key prefix such as constants.PFX_AGREEMENT_KEY_PREFIX
   * @param keyDir directory where keys and certs are stored
   * @returns {{privateKeyFile: string, certificateFile: string}}
   */
  prepareNodeKeyFilePaths (nodeId, keyDir, keyPrefix = constants.SIGNING_KEY_PREFIX) {
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
   * @return {privateKeyFile: string, certificateFile: string}
   */
  async storeNodeKey (nodeId, nodeKey, keyDir, keyPrefix = constants.SIGNING_KEY_PREFIX) {
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

    const self = this
    return new Promise((resolve, reject) => {
      try {
        this.logger.debug(`Storing ${keyPrefix}-keys for node: ${nodeId}`, { nodeKeyFiles })

        fs.writeFileSync(nodeKeyFiles.privateKeyFile, keyPem)

        // we need to write the PEM in reverse order
        // this is because certChain contains the certs in reverse order (issuer certificate comes last)
        certPems.reverse().forEach(certPem => {
          fs.writeFileSync(nodeKeyFiles.certificateFile, certPem + '\n', { flag: 'a' })
        })

        self.logger.debug(`Stored ${keyPrefix}-key for node: ${nodeId}`, { nodeKeyFiles, cert: certPems[0] })
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
   * @return {privateKey: CryptoKey, certificate: x509.X509Certificate, certificateChain: x509.X509Certificates}
   */
  async loadNodeKey (nodeId, keyDir, algo, keyPrefix = constants.SIGNING_KEY_PREFIX) {
    if (!algo) throw new MissingArgumentError('algo is required')

    const nodeKeyFiles = this.prepareNodeKeyFilePaths(nodeId, keyDir, keyPrefix)

    this.logger.debug(`Loading ${keyPrefix}-keys for node: ${nodeId}`, { nodeKeyFiles })

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

    this.logger.debug(`Loaded ${keyPrefix}-key for node: ${nodeId}`, { nodeKeyFiles, cert: certs[0].toString('pem') })
    return {
      privateKey: key,
      certificate: certs[0],
      certificateChain: certChain
    }
  }

  /**
   * Generate signing key and certificate
   * @param nodeId node ID
   * @return {privateKey: CryptoKey, certificate: x509.X509Certificate, certificateChain: x509.X509Certificates}
   */
  async generateNodeSigningKey (nodeId) {
    try {
      const keyPrefix = constants.SIGNING_KEY_PREFIX
      const curDate = new Date()
      const friendlyName = Templates.renderNodeFriendlyName(keyPrefix, nodeId)

      this.logger.debug(`generating ${keyPrefix}-key for node: ${nodeId}`, { friendlyName })

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

      this.logger.debug(`generated ${keyPrefix}-key for node: ${nodeId}`, { cert: cert.toString('pem') })

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
   * @return {privateKey: CryptoKey, certificate: x509.X509Certificate, certificateChain: x509.X509Certificates}
   */
  async loadSigningKey (nodeId, keyDir) {
    return this.loadNodeKey(nodeId, keyDir, KeyManager.SigningKeyAlgo, constants.SIGNING_KEY_PREFIX)
  }

  /**
   * Generate EC key and cert
   *
   * @param nodeId node ID
   * @param keyDir the directory where pem files should be stored
   * @param keyPrefix key prefix such as constants.PFX_AGREEMENT_KEY_PREFIX
   * @param signingKey signing key
   * @return {privateKey: CryptoKey, certificate: x509.X509Certificate, certificateChain: x509.X509Certificates}
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

      this.logger.debug(`generating ${keyPrefix}-key for node: ${nodeId}`, { friendlyName })

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

      this.logger.debug(`generated ${keyPrefix}-key for node: ${nodeId}`, { cert: cert.toString('pem') })
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
   * @param keyDir the directory where pem files should be stored
   * @param signingKey signing key
   * @return {privateKey: CryptoKey, certificate: x509.X509Certificate, certificateChain: x509.X509Certificates}
   */
  async agreementKey (nodeId, keyDir, signingKey) {
    return this.ecKey(nodeId, keyDir, constants.AGREEMENT_KEY_PREFIX, signingKey)
  }
}
