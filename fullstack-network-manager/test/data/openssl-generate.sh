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


backupDir="backup/$(date +"%Y-%m-%d-%s")"
function backup() {
    local pattern="${1}"
    mkdir -p "${backupDir}"
    mv $pattern $backupDir
}

# make a backup of old *.pem files
backup "*.pem"

# Generate RSA:3072 key to for signing
function generate_signing_key() {
    local n="${1}"
    local key_file="${2}"
    local csr_file="${3}"
    local cert_file="${4}"
    local subj="${5}"

    # Generate: s_key, s_csr
    openssl req -new -newkey rsa:3072 -out "${csr_file}" -keyout "${key_file}" -sha384 -nodes -subj "${subj}" || return 1

    # Generate: self-signed s_cert
    openssl x509 -req -in "${csr_file}" -out "${cert_file}" -signkey "${key_file}" -days 36524 -sha384 || return 1

    # output s_cert
    echo "------------------------------------------------------------------------------------"
    echo "${s_cert}"
    echo "------------------------------------------------------------------------------------"
    openssl x509 -in "${s_cert}" -text -noout

    # remove csr
    rm "${csr_file}"

    return 0
}

# Generate ECDSA key signed by the s-key
function generate_signed_ecdsa_key() {
    local n="${1}"
    local key_file="${2}"
    local csr_file="${3}"
    local cert_file="${4}"
    local ca_cert_file="${5}"
    local ca_key_file="${6}"
    local subj="${7}"

    # generate key
    openssl ecparam -genkey -name secp384r1 -noout -out "${key_file}" || return 1

    # generate csr
    openssl req -new -out "${csr_file}" -key "${key_file}" -subj "${subj}" || return 1

    # generate cert
    openssl x509 -req -in "${csr_file}" -out  "${cert_file}" -CA "${ca_cert_file}" -CAkey "${ca_key_file}" -days 36524 -sha384 || return 1

    echo "------------------------------------------------------------------------------------"
    echo "${cert_file}"
    echo "------------------------------------------------------------------------------------"
    openssl x509 -in "${cert_file}" -text -noout

    # remove csr
    rm "${csr_file}"

    return 0
}


for nm in "${names[@]}"; do
    n="$(echo $nm | tr '[A-Z]' '[a-z]')"

    s_key="s-${n}-key.pem"
    s_csr="s-${n}-csr.pem"
    s_cert="s-${n}-cert.pem"

    a_key="a-${n}-key.pem"
    a_csr="a-${n}-csr.pem"
    a_cert="a-${n}-cert.pem"

    e_key="e-${n}-key.pem"
    e_csr="e-${n}-csr.pem"
    e_cert="e-${n}-cert.pem"

    generate_signing_key "${n}" "${s_key}" "${s_csr}" "${s_cert}" "/CN=s-${n}" || exit 1
    generate_signed_ecdsa_key "${n}" "${a_key}" "${a_csr}" "${a_cert}" "${s_cert}" "${s_key}" "/CN=a-${n}" || exit 1
    generate_signed_ecdsa_key "${n}" "${e_key}" "${e_csr}" "${e_cert}" "${s_cert}" "${s_key}" "/CN=e-${n}" || exit 1
done

# display backup dir
echo "Backup dir: ${backupDir}"
