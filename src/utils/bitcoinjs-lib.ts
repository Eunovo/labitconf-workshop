import { generateMnemonic, mnemonicToSeed } from "bip39";
import { BIP32Interface, fromSeed } from "bip32";
import {
  payments,
  Psbt,
  bip32,
  opcodes,
  script,
  crypto,
  address,
  Network,
  ECPair,
} from "bitcoinjs-lib";
import coinselect from "coinselect";

import { Address, DecoratedUtxo, VOut } from "src/types";
import { witnessStackToScriptWitness } from "./witness-stack-to-script-witness";

export const getNewMnemonic = (): string => {
  const mnemonic = generateMnemonic(256);
  return mnemonic;
};

export const getMasterPrivateKey = async (
  mnemonic: string,
  network: Network
): Promise<BIP32Interface> => {
  const seed = await mnemonicToSeed(mnemonic);
  const privateKey = fromSeed(seed, network);
  return privateKey;
};

export const getXpubFromPrivateKey = (
  privateKey: BIP32Interface,
  derivationPath: string
): string => {
  const child = privateKey.derivePath(derivationPath).neutered();
  const xpub = child.toBase58();
  return xpub;
};

export const deriveChildPublicKey = (
  xpub: string,
  derivationPath: string,
  network: Network
): BIP32Interface => {
  const node = bip32.fromBase58(xpub, network);
  const child = node.derivePath(derivationPath);
  return child;
};

export const getAddressFromChildPubkey = (
  child: bip32.BIP32Interface,
  network: Network
): payments.Payment => {
  const address = payments.p2wpkh({
    pubkey: child.publicKey,
    network,
  });
  return address;
};

export const createTransasction = async (
  utxos: DecoratedUtxo[],
  recipientAddress: string,
  amountInSatoshis: number,
  changeAddress: Address,
  network: Network
) => {
  // const feeRate = await getFeeRates();

  const { inputs, outputs, fee } = coinselect(
    utxos,
    [
      {
        address: recipientAddress,
        value: amountInSatoshis,
      },
    ],
    1
  );

  if (!inputs || !outputs) throw new Error("Unable to construct transaction");
  if (fee > amountInSatoshis) throw new Error("Fee is too high!");

  const psbt = new Psbt({ network });
  psbt.setVersion(2); // These are defaults. This line is not needed.
  psbt.setLocktime(0); // These are defaults. This line is not needed.

  inputs.forEach((input) => {
    psbt.addInput({
      hash: input.txid,
      index: input.vout,
      sequence: 0xfffffffd, // enables RBF
      witnessUtxo: {
        value: input.value,
        script: input.address.output!,
      },
      bip32Derivation: input.bip32Derivation,
    });
  });

  outputs.forEach((output) => {
    // coinselect doesnt apply address to change output, so add it here
    if (!output.address) {
      output.address = changeAddress.address!;
    }

    psbt.addOutput({
      address: output.address,
      value: output.value,
    });
  });

  return psbt;
};

export const createLockTransaction = async (
  utxos: DecoratedUtxo[],
  secret: string,
  recipientAddress: string,
  revocationAddress: Address,
  amountInSatoshis: number,
  changeAddress: Address,
  mnemonic: string,
  network: Network
) => {
  const preimage = Buffer.from(secret, 'hex')
  const preimageHash = crypto.hash160(preimage);
  const locktime = Math.floor((Date.now() / 1000) + (60 * 60)) // 1 hour in the future
  const recipientAddr = address.fromBech32(recipientAddress);
  if (!revocationAddress.address)
    throw new Error(`Revocation Address not set`);
  const revocationAddr = address.fromBech32(revocationAddress.address);

  // Create the P2WSH address for the script
  const locking_script = script.compile([
    opcodes.OP_HASH160,
    preimageHash,
    opcodes.OP_EQUAL,
    opcodes.OP_IF,
    opcodes.OP_DUP,
    opcodes.OP_HASH160,
    recipientAddr.data,
    opcodes.OP_EQUALVERIFY,
    opcodes.OP_CHECKSIG,
    opcodes.OP_ELSE,
    script.number.encode(locktime),
    opcodes.OP_CHECKLOCKTIMEVERIFY,
    opcodes.OP_DROP,
    opcodes.OP_DUP,
    opcodes.OP_HASH160,
    revocationAddr.data,
    opcodes.OP_EQUALVERIFY,
    opcodes.OP_CHECKSIG,
    opcodes.OP_ENDIF
  ]);

  const p2wsh = payments.p2wsh({
    redeem: { output: locking_script, network },
    network
  });

  if (!p2wsh.address)
    throw new Error('Could not create P2WSH address');

  const { inputs, outputs, fee } = coinselect(
    utxos,
    [
      {
        address: p2wsh.address,
        value: amountInSatoshis,
      },
    ],
    1
  );

  if (!inputs || !outputs) throw new Error("Unable to construct transaction");
  if (fee > amountInSatoshis) throw new Error("Fee is too high!");

  // Now you can create a transaction that sends some bitcoins to this P2wsh address
  const fundingPsbt = new Psbt({ network })

  inputs.forEach((input) => {
    fundingPsbt.addInput({
      hash: input.txid,
      index: input.vout,
      sequence: 0xfffffffd, // enables RBF
      witnessUtxo: {
        value: input.value,
        script: input.address.output!,
      },
      bip32Derivation: input.bip32Derivation,
    });
  });

  outputs.forEach((output) => {
    // coinselect doesnt apply address to change output, so add it here
    if (!output.address) {
      output.address = changeAddress.address!;
    }

    fundingPsbt.addOutput({
      address: output.address,
      value: output.value,
    });
  });

  await signTransaction(fundingPsbt, mnemonic, network);

  const partialSpendingPsbt = new Psbt({ network });
  partialSpendingPsbt.addInput({
    hash: fundingPsbt.extractTransaction().getId(),
    index: 0,
    witnessUtxo: { script: p2wsh.output!, value: amountInSatoshis },
    witnessScript: locking_script
  });

  return { fundingPsbt, partialSpendingPsbt };
}

export const decodePsbtHex = (hex: string) => {
  return Psbt.fromHex(hex);
}

export const decodeScript = (
  scriptBuf: Buffer
) => {
  return script.decompile(scriptBuf) ?? [];
}

export const isRedeemAddress = (locking_script: (number | Buffer)[], addr: Address) => {
  const { data } = address.fromBech32(addr.address ?? "");
  const redeemAddr = locking_script[6];
  if (typeof redeemAddr === 'number') return false;
  const result = redeemAddr.compare(data);

  return result === 0;
}

export const getPrivateKeyForDerivationPath = async (
  derivationPath: string,
  mnemonic: string,
  network: Network
) => {
  const seed = await mnemonicToSeed(mnemonic);
  const privateKey = bip32.fromSeed(seed, network)
    .derivePath(derivationPath)
    .privateKey;

  if (!privateKey)
    throw new Error(`Could not get private key for ${derivationPath}`);

  return privateKey;
}

export const createRedeemTransaction = async (
  psbt: Psbt,
  address: Address,
  secret: string,
  privateKey: Buffer,
  network: Network
) => {
  const redeemPsbt = new Psbt({ network }, psbt.data);
  redeemPsbt.addOutput({
    address: address.address!,
    value: psbt.data.inputs[0].witnessUtxo!.value - 200, // Transactin fee of 200 satoshis
  });
  const signer = ECPair.fromPrivateKey(privateKey);
  redeemPsbt.signInput(0, signer);

  const finalizeInput = (_inputIndex: number, input: any) => {
    const preimage = Buffer.from(secret, 'hex');

    const redeemPayment = payments.p2wsh({
      redeem: {
        input: script.compile([
          input.partialSig[0].signature,
          address.pubkey,
          preimage
        ]),
        output: input.witnessScript
      }
    });

    const finalScriptWitness = witnessStackToScriptWitness(
      redeemPayment.witness ?? []
    );

    return {
      finalScriptSig: Buffer.from(""),
      finalScriptWitness
    }
  }

  redeemPsbt.finalizeInput(0, finalizeInput);

  return redeemPsbt;
}

// export const createRevocationTransaction = async (
//   vin: { txid: string, vout: number, value: number },
//   recipientAddress: string,
//   bip32Derivation: DecoratedUtxo['bip32Derivation'],
//   network: Network
// ) => {
//   const psbt = new Psbt({ network });

//   psbt.addInput({
//     hash: vin.txid,
//     index: vin.vout,
//     bip32Derivation
//   });

//   psbt.addOutput({
//     address: recipientAddress,
//     value: vin.value
//   });

//   return psbt;
// }

export const signTransaction = async (
  psbt: Psbt,
  mnemonic: string,
  network: Network
): Promise<Psbt> => {
  const seed = await mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed, network);

  psbt.signAllInputsHD(root);
  psbt.validateSignaturesOfAllInputs();
  psbt.finalizeAllInputs();
  return psbt;
};
