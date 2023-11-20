import {
    Wallet,
    LocalProvider,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    Client,
    TransferTransaction,
    HbarUnit,
    AccountId,
    AccountBalanceQuery,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

async function main() {


    let OPERATOR_ID = "0.0.2"
    let OPERATOR_KEY = "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137"

    // Creating a client for a custom network with known ip and ports (i.e this is not MAINNET, TESTNET, PREVIEWNET)
    // We can specify service name and port when we run on the same k9s cluster
    var client = Client.forNetwork({ "127.0.0.1:50211": "0.0.3" })

    const wallet = new Wallet(
        OPERATOR_ID,
        OPERATOR_KEY,
        new LocalProvider({ client: client })
    );


    const newKey = PrivateKey.generate();

    console.log(`private key = ${newKey.toString()}`);
    console.log(`public key = ${newKey.publicKey.toString()}`);
    let newlyCreatedAcc;//: AccountId;

    // Create a new account with 0 balance
    try {
        let transaction = await new AccountCreateTransaction()
            .setInitialBalance(new Hbar(0))
            .setKey(newKey.publicKey)
            .freezeWithSigner(wallet);


        transaction = await transaction.signWithSigner(wallet);
        const response = await transaction.executeWithSigner(wallet);
        const receipt = await response.getReceiptWithSigner(wallet);

        console.log(`account id = ${receipt.accountId.toString()}`);
        newlyCreatedAcc = receipt.accountId
    } catch (error) {
        console.error(error);
    }


    try {

        // Transfer 100 Hbar one by one
        // One transactions is also enough for testing

        for (let i = 0; i <= 100; i++) {
            let transaction = await new TransferTransaction()
                .addHbarTransfer(AccountId.fromString(OPERATOR_ID), new Hbar(-1, HbarUnit.Tinybar))
                .addHbarTransfer(newlyCreatedAcc, new Hbar(+1, HbarUnit.Tinybar))
                .setTransactionMemo("fstnetman test: send hbar test")
                .freezeWithSigner(wallet);
            transaction = await transaction.signWithSigner(wallet);
            const response = await transaction.executeWithSigner(wallet);
            const receipt = await response.getReceiptWithSigner(wallet);

            console.log("transaction receipt = " + receipt)


            let transaction2 = await new AccountBalanceQuery()
                .setAccountId(newlyCreatedAcc);
            const receipt2 = await transaction2.executeWithSigner(wallet)
            console.log("account balance = " + receipt2)

        }
    } catch (error) {
        console.error(error);
    }
}

void main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));