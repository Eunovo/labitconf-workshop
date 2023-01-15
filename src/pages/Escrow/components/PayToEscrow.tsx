import { Network, Psbt } from "bitcoinjs-lib";
import { useState } from "react";
import CreateTxForm from "./CreateTxForm";
import TransactionSummary from "./TransactionSummary";
import { broadcastTx } from "src/utils/blockstream-api";
import { Address, DecoratedUtxo } from "src/types";
import { createLockTransaction, signTransaction } from "src/utils/bitcoinjs-lib";

interface Props {
  utxos: DecoratedUtxo[];
  revocationAddress: Address,
  changeAddress: Address,
  mnemonic: string,
  network: Network
}

export default function PayToEscrow({ utxos, mnemonic, revocationAddress, changeAddress, network }: Props) {
    const [step, setStep] = useState(0); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [transaction, setTransaction] = useState<Psbt | undefined>(undefined); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [error, setError] = useState("");

    const createTransactionWithFormValues = async (
        recipientAddress: string,
        secret: string,
        amountToSend: number
    ) => {
        try {
            const tranx = await createLockTransaction(
              utxos,
              secret,
              recipientAddress,
              revocationAddress,
              amountToSend,
              changeAddress,
              network
            );
            setTransaction(
              await signTransaction(tranx, mnemonic, network)  
            );
            setStep(1);
        } catch (e) {
            setError((e as Error).message);
        }
    };

    return (
        <div>
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {step === 0 && (
                  <CreateTxForm
                    error={error}
                    createTransaction={createTransactionWithFormValues}
                  />
                )}
                {step === 1 && (
                  <TransactionSummary
                    transaction={transaction!}
                    utxos={utxos}
                    broadcastTx={broadcastTx}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      );
}
