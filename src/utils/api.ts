import { Address, BlockstreamAPITransactionResponse } from "src/types";
import { serializeTxs } from ".";
import {
    broadcastTx as blockstreamBroadcast,
    getTransactionsFromAddress,
    getUtxosFromAddress as getUtxosUsingBlockstream
} from "./blockstream-api";
import {
    broadcastTx as localbitapiBroadcast,
    getTransactionsFromAddress as getLocalTranxFromAddress,
    getUtxosFromAddress as getUtxosUsingLocalBitapi
} from "./local-bitapi";
import { Network, networks } from "bitcoinjs-lib";

export async function fetchTransactions(
    addresses: Address[],
    changeAddresses: Address[],
    network: Network
) {
    try {
        const currentTransactionBatch: BlockstreamAPITransactionResponse[] = [];
        for (let i = 0; i < 10; i++) {
            const currentAddress = addresses[i];

            if (network === networks.bitcoin) {
                const addressTransactions = await getTransactionsFromAddress(
                    currentAddress
                );
                currentTransactionBatch.push(...addressTransactions);
            }
            if (network === networks.regtest) {
                const transactions = await getLocalTranxFromAddress(
                    currentAddress
                );
                currentTransactionBatch.push(
                    ...transactions.map((tranx) => {
                        return {
                            txid: tranx.txid,
                            version: tranx.version,
                            locktime: tranx.locktime,
                            size: tranx.size,
                            weight: tranx.weight,
                            vin: tranx.vin.map((vin) => ({
                                txid: vin.txid,
                                vout: vin.vout,
                                prevout: {
                                    scriptpubkey: "",
                                    scriptpubkey_asm: "",
                                    scriptpubkey_type: "",
                                    scriptpubkey_address: "",
                                    value: 0
                                },
                                scriptsig: vin.scriptSig?.hex ?? "",
                                scriptsig_asm: vin.scriptSig?.asm ?? "",
                                witness: vin.txinwitness,
                                is_coinbase: Boolean(vin.coinbase),
                                sequence: vin.sequence
                            })),
                            vout: tranx.vout.map((vout) => ({
                                scriptpubkey: vout.scriptPubKey.hex,
                                scriptpubkey_asm: vout.scriptPubKey.asm,
                                scriptpubkey_type: vout.scriptPubKey.type,
                                scriptpubkey_address: vout.scriptPubKey.address,
                                value: vout.value * 100000000
                            })),
                            fee: 0,
                            status: {
                                confirmed: tranx.confirmations > 0,
                                block_height: tranx.blockheight,
                                block_hash: tranx.blockhash,
                                block_time: tranx.blocktime,
                            }
                        }
                    })
                );
            }
        }

        return serializeTxs(
            currentTransactionBatch,
            addresses,
            changeAddresses
        );

    } catch (e) {
        console.log(e);
    }
}

export async function getUtxosFromAddress(
    address: Address,
    network: Network
) {
    if (network === networks.bitcoin) {
        return getUtxosUsingBlockstream(address);
    }
    if (network === networks.regtest) {
        const utxos = await getUtxosUsingLocalBitapi(address);
        return utxos.map((utxo) => ({
            ...utxo,
            status: {
                confirmed: utxo.confirmations > 0,
                block_height: 0,
                block_hash: '',
                block_time: 0,
            },
            value: utxo.amount * 100000000,
        }));
    }
    return [];
}

export async function broadcastTx(network: Network, txHex: string) {
    if (network === networks.bitcoin) {
        return blockstreamBroadcast(txHex);
    }
    if (network === networks.regtest) {
        const { txid } = await localbitapiBroadcast({ rawTransaction: txHex });
        return txid;
    }

    throw new Error(`Network not supported: Cannot broadcast to network`)
}
