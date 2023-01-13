import axios from "axios";
import {
    Address,
    LocalBitApiTransactionBroadcastBody,
    LocalBitApiTransactionBroadcastResponse,
    LocalBitApiTransactionResponse,
    LocalBitApiUTXOResponse
} from "src/types";

const BASE_URL = "https://blockstream.info/api";

export const getTransactionsFromAddress = async (
  address: Address
): Promise<LocalBitApiTransactionResponse> => {
  const { data } = await axios.get(
    `${BASE_URL}/transactions/${address.address}`
  );
  return data;
};

export const getUtxosFromAddress = async (
  address: Address
): Promise<LocalBitApiUTXOResponse> => {
  const { data } = await axios.get(
    `${BASE_URL}/utxo/${address.address}`
  );

  return data;
};

export const getFeeRates = async () => {
  throw new Error("Function not implemented yet");
};

export const broadcastTx = async (
    body: LocalBitApiTransactionBroadcastBody
): Promise<LocalBitApiTransactionBroadcastResponse> => {
  const { data } = await axios.post(`${BASE_URL}/transaction`, body);

  return data;
};

