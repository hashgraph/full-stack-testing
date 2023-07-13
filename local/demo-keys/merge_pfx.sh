#!/usr/bin/env bash
#
# Copyright 2016-2023 Hedera Hashgraph, LLC
#
# This software is the confidential and proprietary information of
# Hedera Hashgraph, LLC. ("Confidential Information"). You shall not
# disclose such Confidential Information and shall use it only in
# accordance with the terms of the license agreement you entered into
# with Hedera Hashgraph.
#
# HEDERA HASHGRAPH MAKES NO REPRESENTATIONS OR WARRANTIES ABOUT THE SUITABILITY OF
# THE SOFTWARE, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
# TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE, OR NON-INFRINGEMENT. HEDERA HASHGRAPH SHALL NOT BE LIABLE FOR
# ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING OR
# DISTRIBUTING THIS SOFTWARE OR ITS DERIVATIVES.
#

n=${1}
# signing cert of $n
keytool -exportcert -alias "s-${n}" -keystore "./${n}/public-${n}.pfx" -storetype "pkcs12" -storepass "password" |
  keytool -importcert -alias "s-${n}" -keystore "public.pfx" -storetype "pkcs12" -storepass "password" -noprompt || exit 1

# agreement cert of $n
keytool -exportcert -alias "a-${n}" -keystore "./${n}/public-${n}.pfx" -storetype "pkcs12" -storepass "password" |
  keytool -importcert -alias "a-${n}" -keystore "public.pfx" -storetype "pkcs12" -storepass "password" -noprompt || exit 1

# encryption cert of ${n}
keytool -exportcert -alias "e-${n}" -keystore "./${n}/public-${n}.pfx" -storetype "pkcs12" -storepass "password" |
  keytool -importcert -alias "e-${n}" -keystore "public.pfx" -storetype "pkcs12" -storepass "password" -noprompt || exit 1


echo "-----------------------------"
echo "public.pfx"
echo "-----------------------------"
keytool -list -keystore "public.pfx" -storetype "pkcs12" -storepass "password"