interface ScriptPubKey {
    asm: string;
    hex: string;
    address: string;
    type: string;
}

interface ScriptSig {
    asm: string;
    hex: string;
}

interface VOut {
    value: number;
    n: number;
    scriptPubKey: ScriptPubKey;
}

interface Vin {
    txid: string;
    vout: number;
    coinbase?: string;
    scriptSig?: ScriptSig;
    txinwitness: string[];
    sequence: number;
}

interface LocalBitApiTransaction {
    txid: string;
    hash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    blockheight: number;
    blocktime: number;
    blockhash: string;
    confirmations: number;
    vin: Vin[];
    vout: VOut[];
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

export interface LocalBitApiImportAddressBody {
    address: string;
    label: string;
}

export interface LocalBitApiImportAddressResponse {
    message: string
}
