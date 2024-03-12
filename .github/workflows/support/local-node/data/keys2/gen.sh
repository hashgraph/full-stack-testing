#!/usr/bin/env bash
KEYS_DIR="$1"
[[ ! "${KEYS_DIR}" ]] && echo "ERROR: KEYS_DIR is required" && exit 1

shift 1
nodes=("$@")
[[ ! "${nodes}" ]] && echo "ERROR: Node list is required" && exit 1


EX_OK=0
EX_ERR=1
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
function clean() {
  echo "Removing old file: ${SCRIPT_DIR}/public.pfx"
  rm -f "${SCRIPT_DIR}/public.pfx"
}

# combines the public key of the node with the existing public.pfx file
# if public.pfx file does not exist, it creates a new one
function combine_node_public_key() {
  node="$1"
  [[ ! "${node}" ]] && echo "ERROR: Node name is missing" && return "$EX_ERR"
  echo "Combining public key for node: ${node}"
  docker run --rm -v "${SCRIPT_DIR}":/keys --workdir /keys eclipse-temurin:17.0.2_8-jre bash ./merge_pfx.sh "${KEYS_DIR}" "${node}" || return "${EX_ERR}"
  return "${EX_OK}"
}

# generates public.pfx files by combing public key of the nodes
function gen_public_pfx() {
  clean

  echo "Running from: ${SCRIPT_DIR}"
  for node in "${nodes[@]}";do
    combine_node_public_key "${node}"
    status="$?"

    if [ "${status}" != "${EX_OK}" ]; then
      echo "ERROR: Error occurred while combining public key for node: ${node}"
      clean
      exit 1
    fi
  done
}

gen_public_pfx
