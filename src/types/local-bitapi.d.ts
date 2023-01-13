export interface LocalBitApiTransaction {
    txid: string;
    vout: number;
    scriptPubKey: string;
    amount: number;
    satoshis: number;
    height: number;
    confirmations: number;
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
    utxos: IUTXO[];
}

export interface LocalBitApiTransactionBroadcastBody {
    rawTransaction: string;
}

export interface LocalBitApiBroadcastedTransaction {
    txid: string;
}

export interface LocalBitApiTransactionBroadcastResponse {
    broadcast: boolean;
    transaction: LoclBitApiBroadcastedTransaction;
    errors?: string[];
}

