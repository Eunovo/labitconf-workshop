import { CheckCircleIcon } from "@heroicons/react/solid";
import { copyToClipboard } from "src/utils/copy-to-clipboard";

interface Props {
  txid: string;
  spendingTxHex: string;
}

const TransactionSuccessAlert = ({ txid, spendingTxHex }: Props) => {
  return (
    <div className="rounded-md bg-green-50 p-4 mt-4 border border-gray-200 shadow">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon
            className="h-5 w-5 text-green-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            Your transaction has been broadcasted!
          </h3>
          <div className="mt-2 text-sm text-green-700">
            <p>
              Congratulations! You have broadcast your transaction to the
              bitcoin network.
            </p>
            <p>Transaction ID: {txid}</p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <a
                href={`https://blockstream.info/tx/${txid}`}
                rel="noreferrer"
                target="_blank"
                className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
              >
                View status
              </a>
            </div>
          </div>
          <div className="mt-2 text-sm text-green-700">
            <p>
              Copy this transaction hex. You will be required to provide this to spend spend these coins.
            </p>
            <p className="truncate w-72">Spending Transaction: {spendingTxHex}</p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <button
                className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                onClick={() => {
                  copyToClipboard(spendingTxHex);
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSuccessAlert;
