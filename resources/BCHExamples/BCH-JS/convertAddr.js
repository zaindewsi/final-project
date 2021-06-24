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

const conversion = async () => {
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
    const legacyAddress = bchjs.SLP.Address.toLegacyAddress(cashAddress);

    console.log(`SLP Address: ${slpAddress}:`);
    console.log(`Cash Address: ${cashAddress}:`);
    console.log(`Legacy Address: ${legacyAddress}:`);
  } catch (err) {
    console.error("Error in conversion: ", err);
    console.log(`Error message: ${err.message}`);
    throw err;
  }
};
conversion();
