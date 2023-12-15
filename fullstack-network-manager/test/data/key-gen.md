# generate pkcs12 file using keytool
keytool -genkeypair -alias "s-node0" -keystore "private-node0.pfx" -storetype "pkcs12" -storepass "password" -dname "cn=s-node0" -keyalg "rsa" -sigalg "SHA384withRSA" -keysize "3072" -validity "36524"

# inspect pkcs12 file using openssl
openssl pkcs12 -info -in private-node0.pfx

# extract private key from .pfx
openssl pkcs12 -in a-private-node0.pfx -nocerts -out a-test-key.pem -nodes

# extract only client certificate from .pfx
openssl pkcs12 -in a-private-node0.pfx -clcerts -nokeys -out a-test-cert.pem

# extract certificate chain from .pfx
openssl pkcs12 -in a-private-node0.pfx -nokeys -out a-test-cert.pem
