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

  _createPfx(p12Asn1, filePath) {
    try {
      const p12DerBytes = forge.asn1.toDer(p12Asn1).getBytes();
      fs.writeFileSync(filePath, p12DerBytes, {encoding: 'binary'})
      return filePath
    } catch (e) {
      throw new FullstackTestingError(`failed to create pfx file '${filePath}': ${e.message}`, e)
    }
  }

  _createPrivateKeyPfx(nodeId, pkcsAsn1, pfxDir) {
    try {
      const privateKeyFileName = Templates.renderPfxFileName(constants.PFX_SIGNING_KEY_PREFIX, constants.PFX_TYPE_PRIVATE, nodeId)
      const privateKeyPfx = path.join(pfxDir, privateKeyFileName)
      return this._createPfx(pkcsAsn1, privateKeyPfx)
    } catch (e) {
      throw new FullstackTestingError(`failed to create private key pfx file: ${e.message}`, e)
    }
  }

  _createPublicKeyPfx(nodeId, pkcs12Asn1, pfxDir) {
    try {
      const publicKeyFileName = Templates.renderPfxFileName(constants.PFX_SIGNING_KEY_PREFIX, constants.PFX_TYPE_PUBLIC, nodeId)
      const publicKeyPfx = path.join(pfxDir, publicKeyFileName)
      return this._createPfx(pkcs12Asn1, publicKeyPfx)
    } catch (e) {
      throw new FullstackTestingError(`failed to create public key pfx file: ${e.message}`, e)
    }
  }

  /**
   * Generates an RSA public-private key pair in a single call.
   *
   * It defaults to 3072 bits keys
   *
   * @returns an object with privateKey and publicKey properties
   */
  KeyPair() {
    const keypair = forge.pki.rsa.generateKeyPair(constants.PFX_KEY_BITS)

    // construct our own object before returning
    return {
      privateKey: keypair.privateKey,
      publicKey: keypair.publicKey,
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
  Certificate(nodeId, publicKey, signingKey, friendlyName) {
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

  /**
   * Generate node signing key
   *
   * It uses the following parameters:
   *  - Keypair: RSA, 3072 bits
   *  - pkcs12 Key encryption algo: aes256 // similar to keytool
   *  - pkcs12 MAC iteration: 10000 // similar to keytool
   *  - pkcs12 MAC salt length: 20 // similar to keytool
   *  - pkcs12 MAC algo: SHA1 // default, we cannot change it yet since the node-forge library hardcoded it
   *
   * @param nodeId node id
   * @param pfxDir a directory where the pfx files need to be saved
   * @return an object with privateKeyFile and publicKeyFile denoting path to the generated pfx files
   */
  SigningKey(nodeId, pfxDir) {
    if (!nodeId) throw new MissingArgumentError('nodeID is required')
    if (!pfxDir) throw new MissingArgumentError('pfxDir is required')
    if (!fs.statSync(pfxDir).isDirectory()) throw new IllegalArgumentError(`${pfxDir} is not a valid path`)

    try {
      const friendlyName = Templates.renderNodeFriendlyName(constants.PFX_SIGNING_KEY_PREFIX, nodeId)
      const keypair = this.KeyPair()
      const cert = this.Certificate(nodeId, keypair.publicKey, keypair.privateKey, friendlyName)

      // FIXME, forge uses SHA1 for MAC instead of SHA256 as in openssl or keytool
      const privateKeyPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(keypair.privateKey, cert, constants.PFX_DUMMY_PASSWORD, {
        count: constants.PFX_MAC_ITERATION_COUNT,
        saltSize: constants.PFX_MAC_SALT_SIZE,
        algorithm: constants.PFX_ENCRYPTION_ALGO, // encryption algorithm, not macAlgorithm
        friendlyName: friendlyName,
      })

      const certPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(null, cert, constants.PFX_DUMMY_PASSWORD, {
        count: constants.PFX_MAC_ITERATION_COUNT,
        saltSize: constants.PFX_MAC_SALT_SIZE,
        algorithm: constants.PFX_ENCRYPTION_ALGO, // encryption algorithm, not macAlgorithm
        friendlyName: friendlyName,
        // generateLocalKeyId: false,
      })

      const privateKeyPfx = this._createPrivateKeyPfx(nodeId, privateKeyPkcs12Asn1, pfxDir)
      const publicKeyPfx = this._createPublicKeyPfx(nodeId, certPkcs12Asn1, pfxDir)

      return {
        privateKeyPfx,
        publicKeyPfx,
      }
    } catch (e) {
      throw new FullstackTestingError(`failed to generate signing key for node '${nodeId}': ${e.message}`, e)
    }
  }
}