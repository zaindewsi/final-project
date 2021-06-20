const BCHJS = require("@psf/bch-js");

// Set NETWORK to either testnet or mainnet
const NETWORK = "mainnet";

// REST API servers.
const BCHN_MAINNET = "https://bchn.fullstack.cash/v4/";
const TESTNET3 = "https://testnet3.fullstack.cash/v4/";

// Instantiate bch-js based on the network.
let bchjs;
if (NETWORK === "mainnet") bchjs = new BCHJS({ restURL: BCHN_MAINNET });
else bchjs = new BCHJS({ restURL: TESTNET3 });

// Open the wallet generated with create-wallet.
let walletInfo;
try {
  walletInfo = require("./wallet.json");
} catch (err) {
  console.log(
    "Could not open wallet.json. Generate a wallet with create-wallet first."
  );
  process.exit(0);
}

const getBalance = async () => {
  try {
    const mnemonic = walletInfo.mnemonic;

    // root seed buffer
    const rootSeed = await bchjs.Mnemonic.toSeed(mnemonic);

    // master HDNode
    let masterHDNode;
    if (NETWORK === "mainnet") masterHDNode = bchjs.HDNode.fromSeed(rootSeed);
    else masterHDNode = bchjs.HDNode.fromSeed(rootSeed, "testnet"); // Testnet

    // HDNode of BIP44 account
    const account = bchjs.HDNode.derivePath(masterHDNode, "m/44'/245'/0'");

    const change = bchjs.HDNode.derivePath(account, "0/0");

    // get the cash address
    const cashAddress = bchjs.HDNode.toCashAddress(change);
    const slpAddress = bchjs.SLP.Address.toSLPAddress(cashAddress);

    // first get BCH balance
    const balance = await bchjs.Electrumx.balance(cashAddress);

    console.log(
      `BCH Balance information for \n${cashAddress}:\n${slpAddress}:`
    );
    console.log(`${JSON.stringify(balance.balance, null, 2)}`);
    console.log("SLP Token information:");

    // get token balances
    try {
      const tokens = await bchjs.SLP.Utils.balancesForAddress(slpAddress);

      console.log(JSON.stringify(tokens, null, 2));
    } catch (error) {
      if (error.message === "Address not found")
        console.log("No tokens found.");
      else console.log("Error: ", error);
    }
  } catch (err) {
    console.error("Error in getBalance: ", err);
    console.log(`Error message: ${err.message}`);
    throw err;
  }
};
getBalance();
