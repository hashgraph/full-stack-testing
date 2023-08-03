#!/usr/bin/env bash

########################################################################################################################
# Copyright 2016-2022 Hedera Hashgraph, LLC                                                                            #
#                                                                                                                      #
# Licensed under the Apache License, Version 2.0 (the "License");                                                      #
# you may not use this file except in compliance with the License.                                                     #
# You may obtain a copy of the License at                                                                              #
#                                                                                                                      #
#     http://www.apache.org/licenses/LICENSE-2.0                                                                       #
#                                                                                                                      #
# Unless required by applicable law or agreed to in writing, software                                                  #
# distributed under the License is distributed on an "AS IS" BASIS,                                                    #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.                                             #
# See the License for the specific language governing permissions and                                                  #
# limitations under the License.                                                                                       #
########################################################################################################################

set -eo pipefail

if [[ -z "${APP_HOME}" ]]; then
  echo "ERROR: APP_HOME is not defined, but is required!"
  exit 63
fi

cd "${APP_HOME}" || exit 64

if [[ -z "${JAVA_OPTS}" ]]; then
  JAVA_OPTS=""
fi

JAVA_HEAP_OPTS=""

if [[ -n "${JAVA_HEAP_MIN}" ]]; then
  JAVA_HEAP_OPTS="${JAVA_HEAP_OPTS} -Xms${JAVA_HEAP_MIN}"
fi

if [[ -n "${JAVA_HEAP_MAX}" ]]; then
  JAVA_HEAP_OPTS="${JAVA_HEAP_OPTS} -Xmx${JAVA_HEAP_MAX}"
fi

if [[ ! -d "${APP_HOME}/logs" ]]; then
 mkdir -p "${APP_HOME}/logs"
fi

echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> BEGIN USER IDENT >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
id
echo "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< END USER IDENT   <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
echo
set -x
/usr/bin/env java ${JAVA_HEAP_OPTS} ${JAVA_OPTS} -cp "data/lib/*"  com.swirlds.platform.Browser
printf "java exit code %s" "${?}\n"
