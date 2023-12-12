
# generate pkcs12 file using keytool
keytool -genkeypair -alias "s-node0" -keystore "private-node0.pfx" -storetype "pkcs12" -storepass "password" -dname "cn=s-node0" -keyalg "rsa" -sigalg "SHA384withRSA" -keysize "3072" -validity "36524"

# inspect pkcs12 file using openssl
openssl pkcs12 -info -in private-node0.pfx

# generate pkcs12 file using openssl
 openssl req -x509 -newkey rsa:3072 -keyout myKey.pem -out cert.pem -days 365 -nodes
 openssl pkcs12 -export -out private-node0-openssl.p12 -inkey myKey.pem -in cert.pem -iter 10000 -name s-node0 -macsaltlen 20
 