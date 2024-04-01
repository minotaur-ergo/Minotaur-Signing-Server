import { Injectable } from '@nestjs/common';

import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import { Address, ErgoBox, ErgoBoxes, NetworkAddress, NetworkPrefix, Propositions, ReducedTransaction, SecretKey, SecretKeys, TransactionHintsBag, Wallet, extract_hints, verify_signature, verify_tx_input_proof } from 'ergo-lib-wasm-nodejs';
import { createHash } from 'crypto';
import { mnemonicToSeedSync } from 'bip39';
import { EncryptService } from './encryption.service';
import { AppService } from './app.service';
import fakeContext from 'example/multiSig/fakeContext';
import { PartialProof } from './interfaces';


@Injectable()
export class UtilsService {
  constructor(private readonly appService: AppService) {}

  private bip32 = BIP32Factory(ecc);
  private RootPathWithoutIndex = "m/44'/429'/0'/0";

  deriveSecretKeyFromMnemonic(mnemonic: string, index: number = 0): SecretKey {
    const seed = mnemonicToSeedSync(mnemonic);
    const master = this.bip32.fromSeed(seed);
    const derived = master.derivePath(this.RootPathWithoutIndex).derive(index);
    return SecretKey.dlog_from_bytes(derived.privateKey);
  }

  deriveAddressFromXPub(xpub: string, index: number = 0): Address {
    this.bip32.fromBase58(xpub);
    const derived = this.bip32.fromBase58(xpub).derive(index);
    return Address.from_public_key(
      Uint8Array.from(derived.publicKey),
    );
  }

  verifySignature(addr: Address, message: Uint8Array, signature: Uint8Array) {
    return verify_signature(addr, message, signature);
  }

  signMessage(mnemonic: string, message: Uint8Array): Uint8Array {
    // const wallet = Wallet.from_mnemonic(mnemonic, '');
    const secrets = new SecretKeys();
    secrets.add(this.deriveSecretKeyFromMnemonic(mnemonic));
    const wallet = Wallet.from_secrets(secrets);
    const xpub = this.mnemonicToXpub(mnemonic);
    const address = this.xpubToAddress(xpub);
    return wallet.sign_message_using_p2pk(address, message);
  }


  sha256(data: Uint8Array): Uint8Array {
    const hash = createHash('sha256');
    hash.update(data);
    return hash.digest(); 
  }

  bytesToBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('base64');
  }

  base64ToBytes(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  mnemonicToXpub(mnemonic: string): string {
    const bip32 = BIP32Factory(ecc);
    const seed = mnemonicToSeedSync(mnemonic, '');
    const master = bip32.fromSeed(seed);
    const xpub = master
      .derivePath(this.RootPathWithoutIndex)
      .neutered();
    const xpubBase58 = xpub.toBase58()
    return xpubBase58;
  }

  xpubToAddress(xpub: string): Address {
    return this.deriveAddressFromXPub(xpub);
  }

  async getReducedInputLength(reducedId: string): Promise<number> {
    const reduced = await this.appService.getReduced(reducedId, true)
    const reducedTx = ReducedTransaction.sigma_parse_bytes(Buffer.from(reduced.reduced, "base64"))
    return reducedTx.unsigned_tx().inputs().len();
  }

  async mergeBags(reducedId: string, bags: string[]): Promise<TransactionHintsBag> {
    const merged = TransactionHintsBag.empty();
    const numInputs = await this.getReducedInputLength(reducedId);
    bags.map((bag: any) => {
      const cur = TransactionHintsBag.from_json(bag);
      for (let i = 0; i < numInputs; i++) {
        merged.add_hints_for_input(i, cur.all_hints_for_input(i));
      }
    })
    return merged;
  }

  getEmptyWallet(): Wallet {
    return Wallet.from_secrets(new SecretKeys())
  }

  async getSimulationBag(reducedId: string, save: boolean = false): Promise<any> {
    const wallet = this.getEmptyWallet();

    const reduced = await this.appService.getReduced(reducedId, true)
    const reducedTx = ReducedTransaction.sigma_parse_bytes(Buffer.from(reduced.reduced, "base64"))
    const commitments = await this.appService.getCommitments(reducedId)
    const signHints = await this.mergeBags(reducedId, commitments.map((c) => c.commitment));

    const boxes = ErgoBoxes.empty()
    reduced.boxes.forEach(item => boxes.add(ErgoBox.sigma_parse_bytes(Buffer.from(item, "base64"))))

    const commitmentXpubs = commitments.map((commitment: any) => commitment.xpub)
    const teamXpubs = reduced.team.xpubs;
    const toSimXpubs = teamXpubs.filter((xpub: string) => !commitmentXpubs.includes(xpub))

    const bags = []
    for (let i = 0; i < toSimXpubs.length; i++) {
      const xpub = toSimXpubs[i];

      // TODO fix this
      const pubs = Array.from({length: 10}, (_, i) => this.deriveAddressFromXPub(xpub, i)).map((address: Address) => Buffer.from(address.content_bytes()).toString("hex"))

      const txSim = wallet.sign_reduced_transaction_multi(reducedTx, signHints);
      const simulated = new Propositions();
      pubs.forEach(element => simulated.add_proposition_from_byte(Buffer.from('cd' + element, "hex")));
      const signed = new Propositions();
      // TODO fix data inputs
      // TODO fix fakeContext
      const extracted: TransactionHintsBag = extract_hints(txSim, fakeContext(), boxes, ErgoBoxes.empty(), signed, simulated)
      const commitment = JSON.stringify(extracted.to_json());
      bags.push({
        xpub: xpub,
        commitment: commitment
      })

      if (save) {
        await this.appService.addCommitment(xpub, commitment, reducedId, true)
      }
    }

    return bags;
  }

  async signReduced(reducedId: string, save: boolean = false): Promise<any> {
    const wallet = this.getEmptyWallet();

    const reduced = await this.appService.getReduced(reducedId, true)
    const reducedTx = ReducedTransaction.sigma_parse_bytes(Buffer.from(reduced.reduced, "base64"))
    const commitments = await this.appService.getCommitments(reducedId)
    const proofs: PartialProof[] = await this.appService.getPartialProofs(reducedId)

    const signPb = await this.mergeBags(reducedId, commitments.map((c) => c.commitment));
    console.log('here 2')
    const signHintsPr = await this.mergeBags(reducedId, proofs.map((p) => p.proof));
    console.log('here 3')

    const allHints = TransactionHintsBag.empty();
    const inputNum = await this.getReducedInputLength(reducedId);

    for (let i = 0; i < inputNum; i++) {
      allHints.add_hints_for_input(i, signPb.all_hints_for_input(i));
      allHints.add_hints_for_input(i, signHintsPr.all_hints_for_input(i));
    }

    const tx = wallet.sign_reduced_transaction_multi(reducedTx, allHints);
    const boxes = ErgoBoxes.empty()
    reduced.boxes.forEach(item => boxes.add(ErgoBox.sigma_parse_bytes(Buffer.from(item, "base64"))))
    console.log(verify_tx_input_proof(0, fakeContext(), tx, boxes, ErgoBoxes.empty()))


    if (save) {
      await this.appService.addTx(tx.to_json(), reducedId)
    }

    return JSON.parse(tx.to_json());
  }
}

