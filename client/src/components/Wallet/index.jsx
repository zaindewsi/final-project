import NewWallet from "./NewWallet";
import RestoreWallet from "./RestoreWallet";
import Send from "./Send";
import Balance from "./Balance";
import Receive from "./Receive";
import SlpWallet from "minimal-slp-wallet";
import { useEffect, useState } from "react";
import "./Wallet.scss";
import CoinGecko from "coingecko-api";

const Wallet = () => {
  const [wallet, setWallet] = useState(localStorage.getItem("Wallet"));
  const [balance, setBalance] = useState(0);
  const [cadBalance, setCadBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [listOfTokens, setListOfTokens] = useState({});

  const CoinGeckoClient = new CoinGecko();

  const handleChange = (checked) => {
    toggle ? setToggle(false) : setToggle(true);
  };

  useEffect(() => {
    if (wallet) {
      localStorage.setItem("Wallet", wallet);

      retrieveBalance();
      const interval = setInterval(() => {
        retrieveBalance();
      }, 60000);
      return () => clearInterval(interval);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const parsedWallet = JSON.parse(wallet);

  const sendCoin = async (address, amount) => {
    const seed = parsedWallet.mnemonic;
    const slpWallet = await restoreExistingWallet(seed);
    // console.log(slpWallet);
    // You can distribute funds to N users by simply extending the receiver array.
    const receivers = [
      {
        address,
        // amount in satoshis, 1 satoshi = 0.00000001 Bitcoin
        amountSat: amount,
      },
    ];
    const txid = await slpWallet.send(receivers);
    console.log(`https://explorer.bitcoin.com/bch/tx/${txid}`);
    retrieveBalance();
  };

  const sendSlp = async (address, tokenId, tokenAmt) => {
    const seed = parsedWallet.mnemonic;

    const slpWallet = await restoreExistingWallet(seed);

    const receiver = {
      address,
      tokenId,
      qty: tokenAmt,
    };
    const txid = await slpWallet.sendTokens(receiver);
    console.log(`https://explorer.bitcoin.com/bch/tx/${txid}`);
    retrieveBalance();
  };

  const retrieveBalance = async () => {
    setLoading(true);

    const seed = parsedWallet.mnemonic;

    const slpWallet = await restoreExistingWallet(seed);

    const satoshis = await slpWallet.getBalance(slpWallet.walletInfo.address);
    const bchBalance = satoshis / 100000000;
    setBalance(bchBalance);

    let data = await CoinGeckoClient.simple.price({
      ids: ["bitcoin-cash"],
      vs_currencies: ["cad"],
    });

    const bchPrice = data.data["bitcoin-cash"]["cad"];
    setCadBalance(bchPrice * bchBalance);

    const tokens = await slpWallet.listTokens();
    setTotalTokens(tokens.length);

    const tokenList = {};
    tokens.forEach((token) => {
      tokenList[token.tokenId] = {
        id: token.tokenId,
        name: token.name,
        value: token.qty,
      };
    });
    setListOfTokens(tokenList);

    setLoading(false);
  };

  const createNewWallet = async () => {
    const slpWallet = new SlpWallet();
    await slpWallet.walletInfoPromise;
    setWallet(JSON.stringify(slpWallet.walletInfo));
  };

  const restoreExistingWallet = async (seed) => {
    const options = {
      apiToken: process.env.REACT_APP_BCHJSTOKEN,
      fee: Number(process.env.REACT_APP_FEE),
    };
    const slpWallet = new SlpWallet(seed, options);
    console.log(slpWallet);
    await slpWallet.walletInfoPromise;
    setWallet(JSON.stringify(slpWallet.walletInfo));
    return slpWallet;
  };

  const clearStorage = () => {
    localStorage.removeItem("Wallet");
    setWallet(false);
  };

  return (
    <div className="wallet">
      {wallet ? (
        <>
          <Balance
            bal={balance}
            cadBalance={cadBalance}
            token={totalTokens}
            loading={loading}
            refresh={retrieveBalance}
            tokens={listOfTokens}
            toggle={toggle}
            handleChange={handleChange}
          />
          <div className="transfer">
            <Receive
              cashAddress={parsedWallet.cashAddress}
              slpAddress={parsedWallet.slpAddress}
              toggle={toggle}
            />
            <Send
              onBchSubmit={(recAddr, amount) => sendCoin(recAddr, amount)}
              onSlpSubmit={(address, tokenId, tokenAmt) =>
                sendSlp(address, tokenId, tokenAmt)
              }
              toggle={toggle}
              tokens={listOfTokens}
            />
          </div>
          <button onClick={clearStorage}>Clear </button>
        </>
      ) : (
        <>
          <NewWallet onClick={createNewWallet} />
          <RestoreWallet onSubmit={(seed) => restoreExistingWallet(seed)} />
        </>
      )}
    </div>
  );
};

export default Wallet;
