import fs from "fs";
import forge from "node-forge"
import path from "path";
import {FullstackTestingError, IllegalArgumentError, MissingArgumentError} from "./errors.mjs";
import {constants} from "./index.mjs";
import {Logger} from "./logging.mjs";
import {Templates} from "./templates.mjs";

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
      friendlyName: friendlyName,
    }
  }

  _createPfx(p12Asn1, filePath) {
    try {
      const p12DerBytes = forge.asn1.toDer(p12Asn1).getBytes();
      fs.writeFileSync(filePath, p12DerBytes, {encoding: 'binary'})
      return filePath
    } catch (e) {
      throw new FullstackTestingError(`failed to create pfx file '${filePath}': ${e.message}`, e)
    }
  }

  _createPrivateKeyPfx(nodeId, keyPrefix, pkcsAsn1, pfxDir) {
    try {
      const privateKeyFileName = Templates.renderPfxFileName(keyPrefix, constants.PFX_TYPE_PRIVATE, nodeId)
      const privateKeyPfx = path.join(pfxDir, privateKeyFileName)
      return this._createPfx(pkcsAsn1, privateKeyPfx)
    } catch (e) {
      throw new FullstackTestingError(`failed to create private key pfx file: ${e.message}`, e)
    }
  }

  _createPublicKeyPfx(nodeId, keyPrefix, pkcs12Asn1, pfxDir) {
    try {
      const publicKeyFileName = Templates.renderPfxFileName(keyPrefix, constants.PFX_TYPE_PUBLIC, nodeId)
      const publicKeyPfx = path.join(pfxDir, publicKeyFileName)
      return this._createPfx(pkcs12Asn1, publicKeyPfx)
    } catch (e) {
      throw new FullstackTestingError(`failed to create public key pfx file: ${e.message}`, e)
    }
  }

  /**
   * Read and parse PFX file into key and cert
   * @param friendlyName friendlyName for the entry
   * @param pfxFile full path to the pfx file
   * @returns {{cert: *, key}}
   */
  readKeyAndCertFromPfx(friendlyName, pfxFile) {
    if (!fs.statSync(pfxFile).isFile()) {
      throw new FullstackTestingError(`pfx file not found at '${pfxFile}'`)
    }

    // parse pfx into pkcs12
    const pfxDer = fs.readFileSync(pfxFile, {encoding: 'binary'})
    const pfxAsn1 = forge.asn1.fromDer(pfxDer);
    const pkcs12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, true, constants.PFX_DUMMY_PASSWORD);


    // prepare return object
    const ret = {
      key: null,
      cert: null,
    }

    // extract key
    let bags = pkcs12.getBags({friendlyName: friendlyName, bagType: forge.pki.oids.pkcs8ShroudedKeyBag});
    let bag = bags.friendlyName[0]
    if (!bag || !bag.key) {
      throw new FullstackTestingError(`no key found for friendlyName '${friendlyName}' in pfx file ${pfxFile}`)
    }
    ret.key = bag.key

    // extract cert
    bags = pkcs12.getBags({friendlyName: friendlyName, bagType: forge.pki.oids.cert});
    bag = bags.friendlyName[0]
    if (!bag || !bag.cert) {
      throw new FullstackTestingError(`no cert found in pfx file ${pfxFile}`)
    }
    ret.cert = bag.cert

    return ret
  }

  /**
   * Load signing key fom a directory path
   * @param nodeId node ID
   * @param pfxDir a directory where pfx files are stored
   * @returns {{cert: *, key}}
   */
  loadSigningKey(nodeId, pfxDir) {
    const pfxFile = path.join(pfxDir,
      Templates.renderPfxFileName(constants.PFX_SIGNING_KEY_PREFIX, constants.PFX_TYPE_PRIVATE, nodeId))
    const signingKeyFriendlyName = Templates.renderNodeFriendlyName(constants.PFX_SIGNING_KEY_PREFIX, nodeId)
    return this.readKeyAndCertFromPfx(signingKeyFriendlyName, pfxFile)
  }

  /**
   * Generates an RSA public-private key pair in a single call.
   *
   * It defaults to 3072 bits keys
   *
   * @returns an object with privateKey and publicKey properties
   */
  keyPair() {
    const keypair = forge.pki.rsa.generateKeyPair(constants.PFX_KEY_BITS)

    // construct our own object before returning
    return {
      privateKey: keypair.privateKey,
      publicKey: keypair.publicKey,
    }
  }

  /**
   * Generate node key and cert
   * @param keypair
   * @param nodeId node ID
   * @param friendlyName node friendly name
   * @returns {{cert: *, key: *}}
   */
  keyAndCert(keypair, nodeId, friendlyName) {
    const cert = this.certificate(nodeId, keypair.publicKey, keypair.privateKey, friendlyName)
    return {
      key: keypair.privateKey,
      cert: cert,
    }
  }

  /**
   * Generate a certificate
   *
   * @param nodeId node ID
   * @param publicKey RSA publicKey to be used to generate the certificate
   * @param signingKey RSA privateKey to sign the certificate
   * @param friendlyName common name (CN) for the subject name
   * @returns {*}
   * @constructor
   */
  certificate(nodeId, publicKey, signingKey, friendlyName) {
    if (!nodeId) throw new MissingArgumentError('nodeId is required')
    if (!publicKey) throw new MissingArgumentError('publicKey is required')
    if (!signingKey) throw new MissingArgumentError('signingKey is required')
    if (!friendlyName) throw new MissingArgumentError('friendlyName is required')

    try {
      const cert = forge.pki.createCertificate();
      cert.publicKey = publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
      const attrs = [{
        shortName: 'CN',
        value: friendlyName,
      }];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
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
        }]);

      cert.sign(signingKey);
      return cert
    } catch (e) {
      throw new FullstackTestingError(`failed to create certificate: ${e.message}`, e)
    }
  }

  signingKeyPfx(nodeId, pfxDir) {
    const keyPrefix = constants.PFX_SIGNING_KEY_PREFIX

    try {
      const friendlyName = Templates.renderNodeFriendlyName(keyPrefix, nodeId)
      const keypair = this.keyPair()
      const cert = this.certificate(nodeId, keypair.publicKey, keypair.privateKey, friendlyName)
      const signingKey = {
        key: keypair.privateKey,
        cert: cert,
      }
      return this.generatePfxFiles(nodeId, keypair, keyPrefix, signingKey, pfxDir)
    } catch (e) {
      throw new FullstackTestingError(`failed to generate signing key: ${e.message}`, e)
    }
  }

  /**
   * Generate agreement key
   * @param nodeId node ID
   * @param pfxDir the directory where pfx files should be stored
   * @param signingKey signing key and cert. If not passed, it will load it from pfxDir
   * @returns {privateKeyPfx:string|publicKeyPfx:string}
   */
  agreementKeyPfx(nodeId, pfxDir, signingKey = null) {
    const keyPrefix = constants.PFX_AGREEMENT_KEY_PREFIX

    if (!signingKey) {
      signingKey = this.loadSigningKey(nodeId, pfxDir)
    }

    try {
      const keypair = this.keyPair()
      return this.generatePfxFiles(nodeId, keypair, keyPrefix, signingKey, pfxDir)
    } catch (e) {
      throw new FullstackTestingError(`failed to generate agreement key: ${e.message}`, e)
    }
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
    const keyPrefix = constants.PFX_ENCRYPTION_KEY_PREFIX

    if (!signingKey) {
      signingKey = this.loadSigningKey(nodeId, pfxDir)
    }

    try {
      const keypair = this.keyPair()
      return this.generatePfxFiles(nodeId, keypair, keyPrefix, signingKey, pfxDir)
    } catch (e) {
      throw new FullstackTestingError(`failed to generate agreement key: ${e.message}`, e)
    }
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
   * @param keypair object with privateKey and publicKey properties as generated by function KeyPair()
   * @param keyPrefix key prefix such as constants.PFX_SIGNING_KEY_PREFIX
   * @param signingKey signing key and cert
   * @param pfxDir a directory where the pfx files need to be saved
   * @return {privateKeyPfx: string, publicKeyPfx: string} object with privateKeyPfx and publicKeyPfx denoting path to the generated pfx files
   */
  generatePfxFiles(nodeId, keypair, keyPrefix, signingKey, pfxDir) {
    if (!nodeId) throw new MissingArgumentError('nodeID is required')
    if (!keypair) throw new MissingArgumentError('keypair is required')
    if (!signingKey || !signingKey.key) throw new MissingArgumentError('signingKey.key is required')
    if (!signingKey || !signingKey.cert) throw new MissingArgumentError('signingKey.cert is required')
    if (!pfxDir) throw new MissingArgumentError('pfxDir is required')
    if (!keyPrefix) throw new MissingArgumentError('keyPrefix is required')
    if (!fs.statSync(pfxDir).isDirectory()) throw new IllegalArgumentError(`${pfxDir} is not a valid path`)

    try {
      // generate cert
      const friendlyName = Templates.renderNodeFriendlyName(keyPrefix, nodeId)
      const cert = this.certificate(nodeId, keypair.publicKey, signingKey.key, friendlyName)
      const certChain = [signingKey.cert, cert]

      // generate private.pfx
      // FIXME, forge uses SHA1 for MAC instead of SHA256 as in openssl or keytool
      // A fix is proposed: https://github.com/digitalbazaar/forge/pull/1062
      const pfxOptions = this._pfxOptions(friendlyName)
      const privateKeyPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(keypair.privateKey, certChain, constants.PFX_DUMMY_PASSWORD, pfxOptions)
      const privateKeyPfx = this._createPrivateKeyPfx(nodeId, keyPrefix, privateKeyPkcs12Asn1, pfxDir)

      // generate public.pfx
      const certPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(null, certChain, constants.PFX_DUMMY_PASSWORD, pfxOptions)
      const publicKeyPfx = this._createPublicKeyPfx(nodeId, keyPrefix, certPkcs12Asn1, pfxDir)

      return {
        privateKeyPfx,
        publicKeyPfx,
      }
    } catch (e) {
      throw new FullstackTestingError(`failed to generate signing key for node '${nodeId}': ${e.message}`, e)
    }
  }
}
