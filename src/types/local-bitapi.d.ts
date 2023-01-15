interface IVin {
    txid: string;
    vout: number;
    scriptSig: {
      asm: string;
      hex: string;
    },
    sequence: number;
    txinwitness: string[];
}
interface IVout {
    value: number;
    n: number;
    scriptPubKey: {
      asm: string;
      hex: string;
      reqSigs: number;
      type: string;
      addresses: string[];
    }
}

export interface LocalBitApiTransaction {
    txid: string;
    hash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    vin: IVin[];
    vout: IVout[];
    hex: string;
    blockhash: string;
    confirmations: number;
    time: number;
    blocktime: number;
}

export interface LocalBitApiTransactionResponse {
    transactions: LocalBitApiTransaction[];
}

export interface LocalBitApiUTXO {
    txid: string;
    vout: number;
    address: string;
    scriptPubKey: string;
    amount: number;
    satoshis: number;
    confirmations: number;
}

export interface LocalBitApiUTXO {
    txid: string;
    vout: number;
    address: string;
    scriptPubKey: string;
    amount: number;
    satoshis: number;
    confirmations: number;
}

export interface LocalBitApiUTXOResponse {
    utxos: LocalBitApiUTXO[];
}

export interface LocalBitApiTransactionBroadcastBody {
    rawTransaction: string;
}

export interface LocalBitApiTransactionBroadcastResponse {
    txid: string;
}

