import {describe, expect, it, jest} from "@jest/globals";
import fs from "fs";
import forge from "node-forge";
import {constants, logging, Templates} from "../../../src/core/index.mjs";
import {KeyManager} from "../../../src/core/key_manager.mjs";

function loadPkcs12(pkcs12Der, password, caStore) {
  var pkcs12Asn1 = forge.asn1.fromDer(pkcs12Der);
  var pkcs12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, false, password);

  // load keypair and cert chain from safe content(s) and map to key ID
  var map = {};
  for(var sci = 0; sci < pkcs12.safeContents.length; ++sci) {
    var safeContents = pkcs12.safeContents[sci];
    console.log('safeContents ' + (sci + 1));

    for(var sbi = 0; sbi < safeContents.safeBags.length; ++sbi) {
      var safeBag = safeContents.safeBags[sbi];
      console.log('safeBag.type: ' + safeBag.type);

      var localKeyId = null;
      if(safeBag.attributes.localKeyId) {
        localKeyId = forge.util.bytesToHex(
          safeBag.attributes.localKeyId[0]);
        console.log('localKeyId: ' + localKeyId);
        if(!(localKeyId in map)) {
          map[localKeyId] = {
            privateKey: null,
            certChain: []
          };
        }
      } else {
        // no local key ID, skip bag
        continue;
      }

      // this bag has a private key
      if(safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
        console.log('found private key');
        map[localKeyId].privateKey = safeBag.key;
      } else if(safeBag.type === forge.pki.oids.certBag) {
        // this bag has a certificate
        console.log('found certificate');
        map[localKeyId].certChain.push(safeBag.cert);
      }
    }
  }

  console.log('\nPKCS#12 Info:');

  for(var localKeyId in map) {
    var entry = map[localKeyId];
    console.log('\nLocal Key ID: ' + localKeyId);
    if(entry.privateKey) {
      var privateKeyP12Pem = forge.pki.privateKeyToPem(entry.privateKey);
      var encryptedPrivateKeyP12Pem = forge.pki.encryptRsaPrivateKey(
        entry.privateKey, password);

      console.log('\nPrivate Key:');
      console.log(privateKeyP12Pem);
      console.log('Encrypted Private Key (password: "' + password + '"):');
      console.log(encryptedPrivateKeyP12Pem);
    } else {
      console.log('');
    }
    if(entry.certChain.length > 0) {
      console.log('Certificate chain:');
      var certChain = entry.certChain;
      for(var i = 0; i < certChain.length; ++i) {
        var certP12Pem = forge.pki.certificateToPem(certChain[i]);
        console.log(certP12Pem);
      }

      var chainVerified = false;
      try {
        chainVerified = forge.pki.verifyCertificateChain(caStore, certChain);
      } catch(ex) {
        chainVerified = ex;
      }
      console.log('Certificate chain verified: ', chainVerified);
    }
  }
}
describe('KeyManager', () => {
  const logger = logging.NewLogger('debug')
  const keyManager = new KeyManager(logger)

  it('should generate SHA384withRSA keypair', async () => {
    const keypair = keyManager.KeyPair()
    expect(keypair).not.toBeNull()
    expect(keypair.privateKey).not.toBeNull()
    expect(keypair.publicKey).not.toBeNull()
  })

  it('should generate Certificate', () => {
    const nodeId = 'node0'
    const friendlyName = Templates.renderSigningKeyFriendlyName(nodeId)
    const keypair = keyManager.KeyPair()
    const cert = keyManager.Certificate(nodeId, keypair, friendlyName)
    expect(cert).not.toBeNull()
  })

  it('should generate signing key', async () => {
    // const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'downloader-'))

    const signingKey = keyManager.SigningKey('node0', 'test/data/tmp' )

    // verify private key pfx
    const privateKeyDer= fs.readFileSync(signingKey.privateKeyPfx, {encoding: 'binary'})
    const privateKeyAsn1 = forge.asn1.fromDer(privateKeyDer);
    const privateKeyPkcs12 = forge.pkcs12.pkcs12FromAsn1(privateKeyAsn1, false, constants.PFX_DUMMY_PASSWORD);
    expect(privateKeyPkcs12).not.toBeNull()
    expect(privateKeyPkcs12.safeContents.length).toBe(2)

    // verify public key pfx
    const publicKeyDer= fs.readFileSync(signingKey.publicKeyPfx, {encoding: 'binary'})
    const publicKeyAsn1= forge.asn1.fromDer(publicKeyDer);
    const publicKeyPkcs12= forge.pkcs12.pkcs12FromAsn1(publicKeyAsn1, false, constants.PFX_DUMMY_PASSWORD);
    expect(publicKeyPkcs12).not.toBeNull()
    expect(publicKeyPkcs12.safeContents.length).toBe(1)

    // fs.rmSync(tmpDir, { recursive: true })
  })
})
