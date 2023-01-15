import { useEffect, useState } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { MenuIcon } from "@heroicons/react/outline";
import { networks } from "bitcoinjs-lib";

import Sidebar from "src/components/Sidebar";

import Instructions from "src/pages/Instructions";
import Addresses from "src/pages/Addresses";
import Send from "src/pages/Send";
import Receive from "src/pages/Receive";
import Transactions from "src/pages/Transactions";
import Utxos from "src/pages/UTXOs";
import Escrow from "src/pages/Escrow";
import Settings from "src/pages/Settings";

import {
  getNewMnemonic,
  getMasterPrivateKey,
  getXpubFromPrivateKey,
  deriveChildPublicKey,
  getAddressFromChildPubkey,
} from "./utils/bitcoinjs-lib";

import {
  Address,
  DecoratedTx,
  DecoratedUtxo,
} from "src/types";

import {
  fetchTransactions,
  getUtxosFromAddress
} from "./utils/api"

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mnemonic, setMnemonic] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [xpub, setXpub] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [masterFingerprint, setMasterFingerprint] = useState(new Buffer("")); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [addresses, setAddresses] = useState<Address[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [changeAddresses, setChangeAddresses] = useState<Address[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [transactions, setTransactions] = useState<DecoratedTx[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [utxos, setUtxos] = useState<DecoratedUtxo[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [network, _setNetwork] = useState(networks.regtest);

  // Mnemonic / Private Key / XPub
  useEffect(() => {
    if (mnemonic) return;
    let newMnemonic = "";
    if (process.env.REACT_APP_MNEMONIC) {
      newMnemonic = process.env.REACT_APP_MNEMONIC;
    } else {
      newMnemonic = getNewMnemonic();
    }
    setMnemonic(newMnemonic);
  }, [mnemonic]);

  useEffect(() => {
    if (!mnemonic) return;

    const getSeed = async () => {
      try {
        const newMasterPrivateKey = await getMasterPrivateKey(mnemonic, network);
        setMasterFingerprint(newMasterPrivateKey.fingerprint);
        const derivationPath = "m/84'/0'/0'"; // P2WPKH
        const newXpub = getXpubFromPrivateKey(
          newMasterPrivateKey,
          derivationPath
        );
        setXpub(newXpub);
      } catch (e) {
        console.log(e);
      }
    };
    getSeed();
  }, [mnemonic, network]);

  // Addresses
  useEffect(() => {
    try {
      const currentAddressBatch: Address[] = [];

      for (let i = 0; i < 10; i++) {
        const derivationPath = `0/${i}`;
        const currentChildPubkey = deriveChildPublicKey(xpub, derivationPath, network);
        const currentAddress = getAddressFromChildPubkey(currentChildPubkey, network);
        currentAddressBatch.push({
          ...currentAddress,
          derivationPath,
          masterFingerprint,
        });
      }

      setAddresses(currentAddressBatch);

      const currentChangeAddressBatch: Address[] = [];
      for (let i = 0; i < 10; i++) {
        const derivationPath = `1/${i}`;
        const currentChildPubkey = deriveChildPublicKey(xpub, derivationPath, network);
        const currentAddress = getAddressFromChildPubkey(currentChildPubkey, network);
        currentChangeAddressBatch.push({
          ...currentAddress,
          derivationPath,
          masterFingerprint,
        });
      }

      setChangeAddresses(currentChangeAddressBatch);
    } catch (e) {
      console.log(e);
    }
  }, [masterFingerprint, xpub, network]);

  // Transactions
  useEffect(() => {
    const fetchAndSetTranx = async () => {
      const tranxs = await fetchTransactions(
        addresses,
        changeAddresses,
        network
      );
      
      if (!tranxs) return;
      setTransactions(tranxs);
    };

    fetchAndSetTranx();
  }, [addresses, changeAddresses, network]);

  // UTXOs
  useEffect(() => {
    const fetchUtxos = async () => {
      try {
        const allAddresses: Address[] = [...addresses, ...changeAddresses];
        const deocratedUtxos: DecoratedUtxo[] = [];

        for (let i = 0; i < allAddresses.length; i++) {
          const currentAddress: Address = allAddresses[i];
          const utxos = await getUtxosFromAddress(currentAddress, network);

          if (!utxos) return;

          for (let j = 0; j < utxos.length; j++) {
            deocratedUtxos.push({
              ...utxos[j],
              address: currentAddress,
              bip32Derivation: [
                {
                  pubkey: currentAddress.pubkey!,
                  path: `m/84'/0'/0'/${currentAddress.derivationPath}`,
                  masterFingerprint: masterFingerprint,
                },
              ],
            });
          }
        }

        setUtxos(deocratedUtxos);
      } catch (e) {
        console.log(e);
      }
    };

    fetchUtxos();
  }, [addresses, changeAddresses, masterFingerprint]);

  return (
    <Router>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <Switch>
          <Route exact path="/">
            <Instructions />
          </Route>
          <Route exact path="/addresses">
            <Addresses
              addresses={addresses}
              changeAddresses={changeAddresses}
            />
          </Route>
          <Route exact path="/send">
            <Send
              utxos={utxos}
              changeAddresses={changeAddresses}
              mnemonic={mnemonic}
              network={network}
            />
          </Route>
          <Route exact path="/receive">
            <Receive addresses={addresses} />
          </Route>
          <Route exact path="/transactions">
            <Transactions transactions={transactions} />
          </Route>
          <Route exact path="/utxos">
            <Utxos utxos={utxos} />
          </Route>
          <Route exact path="/escrow">
            <Escrow
              utxos={utxos}
              mnemonic={mnemonic}
              changeAddresses={changeAddresses}
              network={network}
            />
          </Route>
          <Route exact path="/settings">
            <Settings mnemonic={mnemonic} xpub={xpub} />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
