import { Address, BlockstreamAPITransactionResponse } from "src/types";
import { serializeTxs } from ".";
import {
    getTransactionsFromAddress,
    getUtxosFromAddress as getUtxosUsingBlockstream
} from "./blockstream-api";
import {
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
                        // const inputSum = tranx.vin.reduce((sum, input) => sum + input.value, 0);
                        // const outputSum = tranx.vout.reduce((sum, output) => sum + output.value, 0);
                        const fee = 0;
                        return {
                            ...tranx,
                            vin: tranx.vin.map((vin) => ({
                                ...vin,
                                prevout: {
                                    scriptpubkey: '',
                                    scriptpubkey_asm: '',
                                    scriptpubkey_type: '',
                                    scriptpubkey_address: '',
                                    value: 0,
                                },
                                scriptsig: vin.scriptSig.hex,
                                scriptsig_asm: vin.scriptSig.asm,
                                witness: vin.txinwitness,
                                is_coinbase: false,
                            })),
                            vout: tranx.vout.map((vout) => ({
                                scriptpubkey: vout.scriptPubKey.hex,
                                scriptpubkey_asm: vout.scriptPubKey.asm,
                                scriptpubkey_type: vout.scriptPubKey.type,
                                scriptpubkey_address: vout.scriptPubKey.addresses.join(','),
                                value: vout.value,
                            })),
                            fee,
                            status: {
                                confirmed: tranx.confirmations > 0,
                                block_height: 0,
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
            value: Math.trunc(utxo.amount * 1000000),
        }));
    }
    return [];
}
