import axios from "axios";
import {
    Address,
    LocalBitApiTransactionBroadcastBody,
    LocalBitApiTransaction,
    LocalBitApiUTXO,
    LocalBitApiTransactionBroadcastResponse
} from "src/types";

const BASE_URL = "http://localhost:4000/api";

export const getTransactionsFromAddress = async (
  address: Address
): Promise<LocalBitApiTransaction[]> => {
  const { data } = await axios.get(
    `${BASE_URL}/transactions/${address.address}`
  );
  return data;
};

export const getUtxosFromAddress = async (
  address: Address
): Promise<LocalBitApiUTXO[]> => {
  const { data } = await axios.get(
    `${BASE_URL}/utxos/${address.address}`
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

