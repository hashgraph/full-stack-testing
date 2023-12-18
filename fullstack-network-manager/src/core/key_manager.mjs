import {ExtendedKeyUsage} from "@peculiar/x509";
import fs from 'fs'
import forge from 'node-forge'
import path from 'path'
import {FullstackTestingError, IllegalArgumentError, MissingArgumentError} from './errors.mjs'
import {constants} from './index.mjs'
import {Logger} from './logging.mjs'
import {Templates} from './templates.mjs'

import * as x509 from "@peculiar/x509";

x509.cryptoProvider.set(crypto);

export class KeyManager {
  constructor(logger) {
    if (!logger || !(logger instanceof Logger)) throw new MissingArgumentError('An instance of core/Logger is required')
    this.logger = logger
  }

  _pfxOptions(friendlyName) {
    return {
      count: constants.PFX_MAC_ITERATION_COUNT,
      saltSize: constants.PFX_MAC_SALT_SIZE,
      algorithm: constants.PFX_ENCRYPTION_ALGO, // encryption algorithm, not macAlgorithm
      friendlyName
    }
  }

  _createPfx(p12Asn1, filePath) {
    try {
      const p12DerBytes = forge.asn1.toDer(p12Asn1).getBytes()
      fs.writeFileSync(filePath, p12DerBytes, {encoding: 'binary'})
      return filePath
    } catch (e) {
      throw new FullstackTestingError(`failed to create pfx file '${filePath}': ${e.message}`, e)
    }
  }

  /**
   * Read and parse PFX file into key and cert
   * @param friendlyName friendlyName for the entry
   * @param pfxFile full path to the pfx file
   * @returns CryptoKeyPair
   */
  readKeyAndCertFromPfx(friendlyName, pfxFile) {
    if (!fs.statSync(pfxFile).isFile()) {
      throw new FullstackTestingError(`pfx file not found at '${pfxFile}'`)
    }

    // parse pfx into pkcs12
    const pfxDer = fs.readFileSync(pfxFile, {encoding: 'binary'})
    const pfxAsn1 = forge.asn1.fromDer(pfxDer)
    const pkcs12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, true, constants.PFX_DUMMY_PASSWORD)

    // extract key
    let bags = pkcs12.getBags({friendlyName, bagType: forge.pki.oids.pkcs8ShroudedKeyBag})
    let bag = bags.friendlyName[0]
    if (!bag || !bag.key) {
      throw new FullstackTestingError(`no key found for friendlyName '${friendlyName}' in pfx file ${pfxFile}`)
    }
    const keyAsn1 = forge.asn1.privateKeyToAsn1(bag.key)
    const keyDer = forge.as1.toDer(keyAsn1)


    // extract cert
    bags = pkcs12.getBags({friendlyName, bagType: forge.pki.oids.cert})
    bag = bags.friendlyName[0]
    if (!bag || !bag.cert) {
      throw new FullstackTestingError(`no cert found in pfx file ${pfxFile}`)
    }
    const certAsn1 = forge.asn1.certificateToAsn1(bag.cert)
    const certDer = forge.asn1.toDer(certAsn1)

    const ret = {
      key: crypto.subtle.importKey('raw', keyDer, {hash: 'SHA-384'})
    }
    return ret
  }

  /**
   * Load signing key fom a directory path
   * @param nodeId node ID
   * @param pfxDir a directory where pfx files are stored
   * @returns CryptoKeyPair
   */
  loadSigningKeyPair(nodeId, pfxDir) {
    const pfxFile = path.join(pfxDir,
      Templates.renderPfxFileName(constants.PFX_SIGNING_KEY_PREFIX, constants.PFX_TYPE_PRIVATE, nodeId))
    const signingKeyFriendlyName = Templates.renderNodeFriendlyName(constants.PFX_SIGNING_KEY_PREFIX, nodeId)
    return this.readKeyAndCertFromPfx(signingKeyFriendlyName, pfxFile)
  }

  /**
   * Generate a certificate
   *
   * @param publicKey RSA publicKey to be used to generate the certificate
   * @param signingKey RSA privateKey to sign the certificate
   * @param friendlyName common name (CN) for the subject name
   * @returns {*}
   * @constructor
   */
  certificate(publicKey, signingKey, friendlyName) {
    if (!publicKey) throw new MissingArgumentError('publicKey is required')
    if (!signingKey) throw new MissingArgumentError('signingKey is required')
    if (!friendlyName) throw new MissingArgumentError('friendlyName is required')

    try {
      const cert = forge.pki.createCertificate()
      cert.publicKey = publicKey
      cert.serialNumber = '01'
      cert.validity.notBefore = new Date()
      cert.validity.notAfter = new Date()
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)
      const attrs = [{
        shortName: 'CN',
        value: friendlyName
      }]
      cert.setSubject(attrs)
      cert.setIssuer(attrs)
      cert.setExtensions([
        {
          name: 'keyUsage',
          keyCertSign: true,
          digitalSignature: true,
          nonRepudiation: true,
          keyEncipherment: true,
          dataEncipherment: true
        },
        {
          name: 'extKeyUsage',
          serverAuth: true,
          clientAuth: true,
          codeSigning: true,
          emailProtection: true,
          timeStamping: true
        }])

      cert.sign(signingKey, forge.md.sha384.create())
      return cert
    } catch (e) {
      throw new FullstackTestingError(`failed to create certificate: ${e.message}`, e)
    }
  }

  /**
   * Generate signing key
   * @param nodeId node ID
   * @param pfxDir the directory where pfx files should be stored
   * @returns {privateKeyPfx:string|publicKeyPfx:string}
   */
  async signingKeyPfx(nodeId, pfxDir) {
    const keyPrefix = constants.PFX_SIGNING_KEY_PREFIX

    try {
      const friendlyName = Templates.renderNodeFriendlyName(keyPrefix, nodeId)
      const curDate = new Date()

      const alg = {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-384",
        publicExponent: new Uint8Array([1, 0, 1]),
        modulusLength: 3072,
      };
      // const alg = {
      //   name: "ECDSA",
      //   namedCurve: "P-384",
      //   hash: "SHA-384",
      // }
      const keypair = await crypto.subtle.generateKey(alg, true, ["sign", "verify"]);
      const cert = await x509.X509CertificateGenerator.createSelfSigned({
        serialNumber: "01",
        subject: friendlyName,
        issuer: friendlyName,
        notBefore: curDate,
        notAfter: new Date().setFullYear(curDate.getFullYear() + 10),
        signingAlgorithm: alg,
        keys: keypair,
        extensions: [
          new x509.BasicConstraintsExtension(true, 1, true),
          new x509.ExtendedKeyUsageExtension([x509.ExtendedKeyUsage.serverAuth, x509.ExtendedKeyUsage.clientAuth], true),
          new x509.KeyUsagesExtension(x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign, true),
          await x509.SubjectKeyIdentifierExtension.create(keypair.publicKey),
        ]
      });

      const certChain = [cert]
      return this.generatePfxFiles(nodeId, keypair.privateKey, certChain, keyPrefix, pfxDir)
    } catch (e) {
      throw new FullstackTestingError(`failed to generate signing key: ${e.message}`, e)
    }
  }

  /**
   * Generate ED25519 key
   *
   * @param nodeId node ID
   * @param pfxDir the directory where pfx files should be stored
   * @param keyPrefix key prefix such as constants.PFX_AGREEMENT_KEY_PREFIX
   * @param signingKeyPair signing key and cert. If not passed, it will load it from pfxDir
   * @returns {privateKeyPfx:string|publicKeyPfx:string}
   */
  async ed25519KeyPfx(nodeId, pfxDir, keyPrefix, signingKeyPair = null) {
    if (!nodeId) throw new MissingArgumentError('nodeId is required')
    if (!pfxDir) throw new MissingArgumentError('pfxDir is required')
    if (!keyPrefix) throw new MissingArgumentError('keyPrefix is required')

    if (!signingKeyPair) {
      signingKeyPair = this.loadSigningKeyPair(nodeId, pfxDir)
    }

    try {
      const curDate = new Date()
      const friendlyName = Templates.renderNodeFriendlyName(keyPrefix, nodeId)
      // const alg = {
      //   name: "EdDSA",
      //   namedCurve: "ed25519",
      //   hash: "SHA-384",
      // }
      const alg = {
        name: "ECDSA",
        namedCurve: "P-384",
        hash: "SHA-384",
      }
      const signingKeyPair = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);
      const keypair = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);

      const cert = await x509.X509CertificateGenerator.create({
        publicKey: keypair.publicKey,
        signingKey: signingKeyPair.privateKey,
        subject: `CN=${friendlyName}`,
        issuer: `CN=${friendlyName}`,
        serialNumber: "01",
        notBefore: curDate,
        notAfter: new Date().setFullYear(curDate.getFullYear() + 10),
        signingAlgorithm: alg,
        extensions: [
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyEncipherment),
        ],
        attributes: [
          new x509.ChallengePasswordAttribute(constants.PFX_DUMMY_PASSWORD),
        ]
      })

      if (!await cert.verify({signatureOnly: true})) {
        throw new FullstackTestingError(`failed to verify certificate for '${friendlyName}'`)
      }

      const certChain = [signingKeyPair.cert, cert]
      return this.generatePfxFiles(nodeId, keypair.privateKey, certChain, keyPrefix, pfxDir)
    } catch (e) {
      throw new FullstackTestingError(`failed to generate ${keyPrefix}-key: ${e.message}`, e)
    }
  }

  /**
   * Generate agreement key
   * @param nodeId node ID
   * @param pfxDir the directory where pfx files should be stored
   * @param signingKey signing key and cert. If not passed, it will load it from pfxDir
   * @returns {privateKeyPfx:string|publicKeyPfx:string}
   */
  async agreementKeyPfx(nodeId, pfxDir, signingKey = null) {
    return this.ed25519KeyPfx(nodeId, pfxDir, constants.PFX_AGREEMENT_KEY_PREFIX, signingKey);
  }

  /**
   * Generate encryption key
   *
   * FIXME: this is not used but kept for backward compatibility. In the future we'll remove this
   *
   * @param nodeId node ID
   * @param pfxDir the directory where pfx files should be stored
   * @param signingKey signing key and cert. If not passed, it will load it from pfxDir
   * @returns {privateKeyPfx:string|publicKeyPfx:string}
   */
  encryptionKeyPfx(nodeId, pfxDir, signingKey = null) {
    return this.ed25519KeyPfx(nodeId, pfxDir, constants.PFX_ENCRYPTION_KEY_PREFIX, signingKey)
  }


  /**
   * Generate PFX files
   *
   * It uses the following parameters:
   *  - Keypair: RSA, 3072 bits
   *  - pkcs12 Key encryption algo: aes256 // similar to keytool
   *  - pkcs12 MAC iteration: 10000 // similar to keytool
   *  - pkcs12 MAC salt length: 20 // similar to keytool
   *  - pkcs12 MAC algo: SHA1 // default, we cannot change it yet since the node-forge library hardcoded it
   *
   * @param nodeId node id
   * @param privateKey privateKey of the node
   * @param certChain certificate chain
   * @param keyPrefix key prefix such as constants.PFX_SIGNING_KEY_PREFIX
   * @param pfxDir a directory where the pfx files need to be saved
   * @return {privateKeyPfx: string, publicKeyPfx: string} object with privateKeyPfx and publicKeyPfx denoting path to the generated pfx files
   */
  generatePfxFiles(nodeId, privateKey, certChain, keyPrefix, pfxDir) {
    if (!nodeId) throw new MissingArgumentError('nodeID is required')
    if (!privateKey) throw new MissingArgumentError('keypair is required')
    if (!pfxDir) throw new MissingArgumentError('pfxDir is required')
    if (!keyPrefix) throw new MissingArgumentError('keyPrefix is required')
    if (!fs.statSync(pfxDir).isDirectory()) throw new IllegalArgumentError(`${pfxDir} is not a valid path`)

    try {
      // generate cert
      const friendlyName = Templates.renderNodeFriendlyName(keyPrefix, nodeId)
      const pfxOptions = this._pfxOptions(friendlyName)

      // convert key into pkcs8 format and then import into node-forge format
      // convert cert into pkcs8 format and then import into node-forge format


      // generate private.pfx
      // FIXME, uses SHA1 for MAC instead of SHA256 as in openssl or keytool
      // A fix is proposed: https://github.com/digitalbazaar/forge/pull/1062
      const privateKeyFileName = Templates.renderPfxFileName(keyPrefix, constants.PFX_TYPE_PRIVATE, nodeId)
      const privateKeyPfx = path.join(pfxDir, privateKeyFileName)
      const privateKeyPkcs12Asn1 = pkcs12.toPkcs12Asn1(privateKey, certChain, constants.PFX_DUMMY_PASSWORD, pfxOptions)
      this._createPfx(privateKeyPkcs12Asn1, privateKeyPfx)

      // generate public.pfx
      const publicKeyFileName = Templates.renderPfxFileName(keyPrefix, constants.PFX_TYPE_PUBLIC, nodeId)
      const publicKeyPfx = path.join(pfxDir, publicKeyFileName)
      const publicKeyPkcs12Asn1 = pkcs12.toPkcs12Asn1(null, certChain, constants.PFX_DUMMY_PASSWORD, pfxOptions)
      this._createPfx(publicKeyPkcs12Asn1, publicKeyPfx)

      return {
        privateKeyPfx,
        publicKeyPfx
      }
    } catch (e) {
      throw new FullstackTestingError(`failed to generate signing key for node '${nodeId}': ${e.message}`, e)
    }
  }
}
