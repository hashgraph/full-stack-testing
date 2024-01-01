#!/bin/bash

cd "$(dirname "$0")"

# check if the names were supplied as arguments
if [[ -z "$*" ]]; then
    # if not, use a default set of names
    names=("alice" "bob" "carol" "dave")
else
    names=("$@")
fi

# Replace ("alice" "bob" ...) with the list of member names, separated by spaces.
# Or, replace the list with (`cat names.txt`) and then put all the names into names.txt.
# The names should all have their uppercase letters changed to lowercase.
# All spaces and punctuation should be deleted. All accents should be removed.
# So if the config.txt has the names "Alice", "Bob", and "Carol", the list here would
# need to be ("alice" "bob" "carol").
# A name like "5- John O'Donald, Sr." in the config.txt would need to be listed
# as "5johnodonaldsr" here. And if the "o" had an umlaut above it or a grave accent
# above it in the config.txt, then it would need to be entered as a plain "o" here.
# It is important that every name in the config.txt be different, even after making
# these changes. So the config.txt can't have two members with the name "Alice", nor can
# it have one member named "Alice" and another named "--alice--".


backup_dir="backup/$(date +"%Y-%m-%dT%H_%M_%S")"
dummy_password="password"
s_key_prefix="s" # signing key
a_key_prefix="a" # agreement key
e_key_prefix="e" # encryption key


function backup() {
    local pattern="${1}"
    mkdir -p "${backup_dir}"
    mv $pattern $backup_dir
}

# make a backup of old *.pem files
backup "*.pem"
backup "*.pfx"

# Generate RSA:3072 key to for signing
function generate_signing_key() {
    local n="${1}"
    local prefix="${2}"

    local s_key="${prefix}-${n}-key.pem"
    local s_csr="${prefix}-${n}-csr.pem"
    local s_cert="${prefix}-${n}-cert.pem"
    local s_key_pfx="${prefix}-private-${n}.pfx"
    local s_cert_pfx="${prefix}-public-${n}.pfx"
    local s_friendly_name="${prefix}-${n}"

    echo "------------------------------------------------------------------------------------"
    echo "Generating RSA key and cert for node: ${n}" [ "${prefix}"-key ]
    echo "friendly_name: ${s_friendly_name}"
    echo "key_file: ${s_key}"
    echo "csr_file: ${s_csr}"
    echo "cert_file: ${s_cert}"
    echo "key_pfx: ${s_key_pfx}"
    echo "cert_pfx: ${s_cert_pfx}"
    echo "------------------------------------------------------------------------------------"

    # Generate: s_key, s_csr
    openssl req -new -newkey rsa:3072 -out "${s_csr}" -keyout "${s_key}" -sha384 -nodes -subj "/CN=${s_friendly_name}" || return 1

    # Generate: self-signed s_cert
    openssl x509 -req -in "${s_csr}" -out "${s_cert}" -signkey "${s_key}" -days 36524 -sha384 || return 1

    # output s_cert
    echo "------------------------------------------------------------------------------------"
    echo "Generated: ${s_cert}"
    echo "------------------------------------------------------------------------------------"
    openssl x509 -in "${s_cert}" -text -noout

    # genereate s-private.pfx
    openssl pkcs12 -export -out "${s_key_pfx}" -inkey "${s_key}" -in "${s_cert}" -iter 10000 \
        -name "${s_friendly_name}" -macsaltlen 20 -password pass:"${dummy_password}" || return 1
    echo "------------------------------------------------------------------------------------"
    echo "Generated: ${s_key_pfx}"
    echo "------------------------------------------------------------------------------------"
    openssl pkcs12 -info -nokeys -in ${s_key_pfx} -passin pass:"${dummy_password}"

    # genereate s-public.pfx
    openssl pkcs12 -export -nokeys -out "${s_cert_pfx}" -in "${s_cert}" -iter 10000 \
        -name "${s_friendly_name}" -macsaltlen 20 -password pass:"${dummy_password}" || return 1
    echo "------------------------------------------------------------------------------------"
    echo "Generated: ${s_cert_pfx}"
    echo "------------------------------------------------------------------------------------"
    openssl pkcs12 -info -nokeys -in ${s_cert_pfx} -passin pass:"${dummy_password}"

    # remove csr
    rm "${s_csr}"

    return 0
}

# Generate keys signed by the s-key
function generate_key() {
    local n="${1}"
    local prefix="${2}"
    local s_key="${3}"
    local s_cert="${4}"


    local key_file="${prefix}-${n}-key.pem"
    local csr_file="${prefix}-${n}-csr.pem"
    local cert_file="${prefix}-${n}-cert.pem"
    local key_pfx="${prefix}-private-${n}.pfx"
    local cert_pfx="${prefix}-public-${n}.pfx"
    local friendly_name="${prefix}-${n}"

    echo "------------------------------------------------------------------------------------"
    echo "Generating key and cert for node: ${n}" [ "${prefix}"-key ]
    echo "friendly_name: ${friendly_name}"
    echo "key_file: ${key_file}"
    echo "csr_file: ${csr_file}"
    echo "cert_file: ${cert_file}"
    echo "key_pfx: ${key_pfx}"
    echo "cert_pfx: ${cert_pfx}"
    echo "s_key: ${s_key}"
    echo "s_cert: ${s_cert}"
    echo "------------------------------------------------------------------------------------"

    # generate key
    #openssl ecparam -genkey -name secp384r1 -noout -out "${key_file}" || return 1
    # Use ED25519 key instead of EC key: https://blog.pinterjann.is/ed25519-certificates.html
    openssl genpkey -algorithm ED25519 -out "${key_file}" || return 1

    # generate csr
    openssl req -new -out "${csr_file}" -key "${key_file}" -subj "/CN=${friendly_name}" || return 1
    echo "------------------------------------------------------------------------------------"
    echo "Generated: ${csr_file}"
    echo "------------------------------------------------------------------------------------"
    openssl req -text -in "${csr_file}"

    # generate cert and verify
    openssl x509 -req -in "${csr_file}" -out  "${cert_file}.tmp" -CA "${s_cert}" -CAkey "${s_key}" -days 36524 -sha384 || return 1
    cat "${s_cert}" "${cert_file}.tmp" > "${cert_file}" # combine cert chain
    openssl verify -verbose -purpose sslserver -CAfile "${s_cert}" "${cert_file}"
    rm "${cert_file}.tmp" # remove tmp file

    echo "------------------------------------------------------------------------------------"
    echo "Generated: ${cert_file}" [ including certificate chain ]
    echo "------------------------------------------------------------------------------------"
    openssl storeutl -noout -text -certs a-node0-cert.pem

    # generate private.pfx
    openssl pkcs12 -export -out "${key_pfx}" -inkey "${key_file}" -in "${cert_file}" -iter 10000 \
        -name "${friendly_name}" -macsaltlen 20 -password pass:"${dummy_password}" || return 1
    echo "------------------------------------------------------------------------------------"
    echo "Generated: ${key_pfx}"
    echo "------------------------------------------------------------------------------------"
    openssl pkcs12 -info -in ${key_pfx} -passin pass:"${dummy_password}" -passout pass:"${dummy_password}" -nokeys # do not output private key

    # generate public.pfx
    openssl pkcs12 -export -nokeys -out "${cert_pfx}" -in "${cert_file}" -iter 10000 \
        -name "${friendly_name}" -macsaltlen 20 -password pass:"${dummy_password}" -CAfile "${s_cert}" -chain || return 1
    echo "------------------------------------------------------------------------------------"
    echo "Generated: ${cert_pfx}"
    echo "------------------------------------------------------------------------------------"
    #openssl pkcs12 -info -in a-public-node0.pfx -passin pass:password -passout pass:password -nokeys
    openssl pkcs12 -info -in ${cert_pfx} -passin pass:"${dummy_password}" -passout pass:"${dummy_password}" -nokeys

    # remove csr
    rm "${csr_file}"

    return 0
}

for nm in "${names[@]}"; do
    n="$(echo $nm | tr '[A-Z]' '[a-z]')"
    s_key="${s_key_prefix}-${n}-key.pem"
    s_cert="${s_key_prefix}-${n}-cert.pem"

    generate_signing_key "${n}" "${s_key_prefix}" || exit 1
    generate_key "${n}" "${a_key_prefix}" "${s_key}" "${s_cert}" || exit 1
    generate_key "${n}" "${e_key_prefix}" "${s_key}" "${s_cert}" || exit 1
done

# display backup dir
echo "Backup dir: ${backup_dir}"
