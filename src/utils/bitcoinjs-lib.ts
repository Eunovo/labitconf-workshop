import { generateMnemonic, mnemonicToSeed } from "bip39";
import { BIP32Interface, fromSeed } from "bip32";
import {
  payments,
  Psbt,
  bip32,
  networks,
  opcodes,
  script,
  crypto,
  address
} from "bitcoinjs-lib";
import coinselect from "coinselect";

import { Address, DecoratedUtxo } from "src/types";

export const getNewMnemonic = (): string => {
  const mnemonic = generateMnemonic(256);
  return mnemonic;
};

export const getMasterPrivateKey = async (
  mnemonic: string
): Promise<BIP32Interface> => {
  const seed = await mnemonicToSeed(mnemonic);
  const privateKey = fromSeed(seed, networks.bitcoin);
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
  derivationPath: string
): BIP32Interface => {
  const node = bip32.fromBase58(xpub, networks.bitcoin);
  const child = node.derivePath(derivationPath);
  return child;
};

export const getAddressFromChildPubkey = (
  child: bip32.BIP32Interface
): payments.Payment => {
  const address = payments.p2wpkh({
    pubkey: child.publicKey,
    network: networks.bitcoin,
  });
  return address;
};

export const createTransasction = async (
  utxos: DecoratedUtxo[],
  recipientAddress: string,
  amountInSatoshis: number,
  changeAddress: Address
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

  const psbt = new Psbt({ network: networks.bitcoin });
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
  changeAddress: Address
) => {
  const preimage = Buffer.from(secret, 'hex')
  const preimageHash = crypto.hash160(preimage);
  const locktime = Math.floor((Date.now() / 1000) + (4 * 7 * 24 * 60 * 60)) // 4 weeks in the future
  const recipientAddr = address.fromBech32(recipientAddress);
  if (!revocationAddress.address)
    throw new Error(`Revocation Address not set`);
  const revocationAddr = address.fromBech32(revocationAddress.address);

  // Create the P2WSH address for the script
  const locking_script = script.compile([
    opcodes.OP_DUP,
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
    redeem: { output: locking_script, network: networks.bitcoin },
    network: networks.bitcoin
  });
  console.log(p2wsh.address);

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
  const psbt = new Psbt({ network: networks.bitcoin })

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
}

export const signTransaction = async (
  psbt: Psbt,
  mnemonic: string
): Promise<Psbt> => {
  const seed = await mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed, networks.bitcoin);

  psbt.signAllInputsHD(root);
  psbt.validateSignaturesOfAllInputs();
  psbt.finalizeAllInputs();
  return psbt;
};
