import { Network } from "bitcoinjs-lib";
import { useState } from "react";
import { Address, DecoratedUtxo } from "src/types";
import { broadcastTx } from "src/utils/api";
import { createRedeemTransaction, decodePsbtHex, decodeScript, getPrivateKeyForDerivationPath, isRedeemAddress, signTransaction } from "src/utils/bitcoinjs-lib";
import { getTransactionByTxId } from "src/utils/local-bitapi";

interface Props {
    addresses: Address[]
    getBip32Derivation: (address: Address) => any;
    network: Network;
    mnemonic: string
}

const Redeem = ({ addresses, getBip32Derivation, network, mnemonic }: Props) => {
    const [txHex, setTxHex] = useState("");
    const [secret, setSecret] = useState("");
    const [error, setError] = useState("");

    const redeem = async () => {
        try {
            const tranx = decodePsbtHex(txHex);
            const address = addresses.find(
                (value) => isRedeemAddress(
                    decodeScript(tranx.data.inputs[0].witnessScript!),
                    value
                )
            );

            if (!address)
                throw new Error("No address matched the redeem address");
            const { path: derivationPath } = getBip32Derivation(address);
            const privateKey = await getPrivateKeyForDerivationPath(
                derivationPath, mnemonic, network);
            const psbt = await createRedeemTransaction(
                tranx, address, secret, privateKey, network
            );
            broadcastTx(network, psbt.extractTransaction().toHex());
        } catch (error: any) {
            console.log(error);
            setError(error.message);
        }
    };

    return (
        <div className="py-4 flex align-center justify-center">
            <div className="w-full" style={{ maxWidth: 800 }}>
                <div className="mt-5 md:mt-0 md:col-span-2 w-full">
                    <div className="shadow sm:rounded-md sm:overflow-hidden">
                        <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-3 sm:col-span-2">
                                    <label
                                        htmlFor="company-website"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Enter Spending transaction hex...
                                    </label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            name="company-website"
                                            id="company-website"
                                            className="focus:ring-tabconf-blue-500 focus:border-tabconf-blue-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                                            placeholder=""
                                            value={txHex}
                                            onChange={(e) => setTxHex(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>


                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-3 sm:col-span-2">
                                    <label
                                        htmlFor="company-website"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Enter redemption secret...
                                    </label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            name="company-website"
                                            id="company-website"
                                            className="focus:ring-tabconf-blue-500 focus:border-tabconf-blue-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                                            placeholder="secret"
                                            value={secret}
                                            onChange={(e) => setSecret(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                        {error && (
                            <div className="px-4 py-5 bg-white space-y-6 sm:px-6 sm:pb-2 sm:pt-0 text-red-500 text-xs">
                                Error: {error}
                            </div>
                        )}
                        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                            <button
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-tabconf-blue-600 hover:bg-tabconf-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tabconf-blue-500"
                                onClick={() => redeem()}
                            >
                                Redeem
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Redeem;
