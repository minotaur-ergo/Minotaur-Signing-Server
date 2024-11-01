import { Injectable } from '@nestjs/common'

import { BIP32Factory } from 'bip32'
import { mnemonicToSeedSync } from 'bip39'
import { createHash } from 'crypto'
import {
  Address,
  ErgoBox,
  ErgoBoxes,
  ErgoTree,
  extract_hints,
  NetworkPrefix,
  Propositions,
  ReducedTransaction,
  SecretKey,
  SecretKeys,
  TransactionHintsBag,
  verify_signature,
  verify_tx_input_proof,
  Wallet,
} from 'ergo-lib-wasm-nodejs'
import * as ecc from 'tiny-secp256k1'
import { loggers } from 'winston'
import { AppService } from './app.service'
import { PartialProof } from './interfaces'
import { NodeService } from './node.service'

const logger = loggers.get('default')

@Injectable()
export class UtilsService {
  constructor(
    private readonly appService: AppService,
    private nodeService: NodeService,
  ) {}

  private bip32 = BIP32Factory(ecc)
  private RootPathWithoutIndex = "m/44'/429'/0'/0"

  /**
   * Derive secret key from mnemonic
   * @param mnemonic mnemonic
   * @param index derivation index
   * @returns SecretKey
   */
  deriveSecretKeyFromMnemonic(mnemonic: string, index: number = 0): SecretKey {
    const seed = mnemonicToSeedSync(mnemonic)
    const master = this.bip32.fromSeed(seed)
    const derived = master.derivePath(this.RootPathWithoutIndex).derive(index)
    return SecretKey.dlog_from_bytes(derived.privateKey)
  }

  /**
   * Derive address from xpub
   * @param xpub xpub
   * @param index  derivation index
   * @returns Address
   */
  deriveAddressFromXPub(xpub: string, index: number = 0): Address {
    this.bip32.fromBase58(xpub)
    const derived = this.bip32.fromBase58(xpub).derive(index)
    return Address.from_public_key(Uint8Array.from(derived.publicKey))
  }

  /**
   * Derive address from public key
   * @param pub public key
   * @returns Address
   */
  pubToAddress(pub: Uint8Array): Address {
    return Address.from_public_key(pub)
  }

  /**
   * Verify signature
   * @param addr address
   * @param message message
   * @param signature signature
   * @returns boolean
   */
  verifySignature(addr: Address, message: Uint8Array, signature: Uint8Array) {
    try {
      return verify_signature(addr, message, signature)
    } catch (error) {
      return false
    }
  }

  int8Vlq = (value: number) => {
    const sign = value > 0 ? 0 : 1
    value = (value << 1) + sign
    return this.uInt8Vlq(value)
  }

  uInt8Vlq = (value: number) => {
    const res = []
    while (value > 0) {
      if ((value & ~0x7f) === 0) {
        res.push(value)
        break
      } else {
        res.push((value & 0x7f) | 0x80)
        value = value >> 7
      }
    }
    return Buffer.from(Uint8Array.from(res)).toString('hex')
  }

  generateMultiSigAddressFromPublicKeys = (
    publicKeys: Array<string>,
    minSign: number,
    prefix: NetworkPrefix,
  ) => {
    let ergoTree = '10' + this.uInt8Vlq(publicKeys.length + 1)
    ergoTree += '04' + this.int8Vlq(minSign)
    publicKeys.sort().forEach((item) => (ergoTree += '08cd' + item))
    ergoTree += '987300'
    ergoTree += `83${this.uInt8Vlq(publicKeys.length)}08` // add coll operation
    publicKeys.forEach(
      (item, index) => (ergoTree += '73' + this.uInt8Vlq(index + 1)),
    )
    return Address.recreate_from_ergo_tree(
      ErgoTree.from_base16_bytes(ergoTree),
    ).to_base58(prefix)
  }

  deriveMultiSigWalletAddress = async (
    xPubs: Array<string>,
    requiredSign: number,
    index: number = 0,
  ) => {
    const pub_keys = xPubs.map((key) => {
      const pub = this.bip32.fromBase58(key)
      const derived1 = pub.derive(index)
      return derived1.publicKey.toString('hex')
    })
    return this.generateMultiSigAddressFromPublicKeys(
      pub_keys,
      requiredSign,
      NetworkPrefix.Testnet,
    )
  }

  /**
   * Sign message
   * @param mnemonic mnemonic
   * @param message message
   * @returns Uint8Array
   */
  signMessage(mnemonic: string, message: Uint8Array): Uint8Array {
    // const wallet = Wallet.from_mnemonic(mnemonic, '');
    const secrets = new SecretKeys()
    secrets.add(this.deriveSecretKeyFromMnemonic(mnemonic))
    const wallet = Wallet.from_secrets(secrets)
    const xpub = this.mnemonicToXpub(mnemonic)
    const address = this.xpubToAddress(xpub)
    return wallet.sign_message_using_p2pk(address, message)
  }

  /**
   * sha256 hash of data
   * @param address address
   * @param message message
   * @param signature signature
   * @returns boolean
   */
  sha256(data: Uint8Array): Uint8Array {
    const hash = createHash('sha256')
    hash.update(data)
    return hash.digest()
  }

  /**
   * Convert bytes to base64
   * @param bytes bytes
   * @returns string
   */
  bytesToBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('base64')
  }

  /**
   * Convert base64 to bytes
   * @param base64 base64
   * @returns Uint8Array
   */
  base64ToBytes(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }

  /**
   * Convert mnemonic to xpub
   * @param mnemonic mnemonic
   * @returns string
   */
  mnemonicToXpub(mnemonic: string): string {
    const bip32 = BIP32Factory(ecc)
    const seed = mnemonicToSeedSync(mnemonic, '')
    const master = bip32.fromSeed(seed)
    const xpub = master.derivePath(this.RootPathWithoutIndex).neutered()
    const xpubBase58 = xpub.toBase58()
    return xpubBase58
  }

  /**
   * Convert xpub to address
   * @param xpub xpub
   * @returns Address
   */
  xpubToAddress(xpub: string): Address {
    return this.deriveAddressFromXPub(xpub)
  }

  /**
   * Input length of reduced transaction
   * @param reducedId Reduced ID
   * @returns number
   */
  async getReducedInputLength(reducedId: string): Promise<number> {
    const reduced = await this.appService.getReduced(reducedId, true)
    const reducedTx = ReducedTransaction.sigma_parse_bytes(
      Buffer.from(reduced.reduced, 'base64'),
    )
    return reducedTx.unsigned_tx().inputs().len()
  }

  /**
   * Merge hints bags
   * @param reducedId Reduced ID
   * @param bags Hints bags
   * @returns TransactionHintsBag
   */
  async mergeBags(
    reducedId: string,
    bags: string[],
  ): Promise<TransactionHintsBag> {
    const merged = TransactionHintsBag.empty()
    const numInputs = await this.getReducedInputLength(reducedId)
    bags.map((bag: any) => {
      const cur = TransactionHintsBag.from_json(bag)
      for (let i = 0; i < numInputs; i++) {
        merged.add_hints_for_input(i, cur.all_hints_for_input(i))
      }
    })
    return merged
  }

  /**
   * Get empty wallet
   * @returns Wallet
   */
  getEmptyWallet(): Wallet {
    return Wallet.from_secrets(new SecretKeys())
  }

  /**
   * Simulate the reduced transaction
   * @param reducedId Reduced ID
   * @param save Whether to save the commitment
   * @returns bags
   */
  async getSimulationBag(
    reducedId: string,
    save: boolean = false,
  ): Promise<any> {
    const wallet = this.getEmptyWallet()

    const reduced = await this.appService.getReduced(reducedId, true)
    const reducedTx = ReducedTransaction.sigma_parse_bytes(
      Buffer.from(reduced.reduced, 'base64'),
    )
    let commitments = await this.appService.getCommitments(reducedId)

    const simulatedCommitments = commitments.filter((c) => c.simulated)
    for (let i = 0; i < simulatedCommitments.length; i++) {
      await this.appService.deleteCommitment(
        simulatedCommitments[i].xpub,
        reducedId,
      )
    }

    commitments = await this.appService.getCommitments(reducedId)

    const signHints = await this.mergeBags(
      reducedId,
      commitments.map((c) => c.commitment),
    )

    const boxes = ErgoBoxes.empty()
    reduced.boxes.forEach((item) =>
      boxes.add(ErgoBox.sigma_parse_bytes(Buffer.from(item, 'base64'))),
    )

    const dataInputs = ErgoBoxes.empty()
    reduced.dataInputs.forEach((item) =>
      dataInputs.add(ErgoBox.sigma_parse_bytes(Buffer.from(item, 'base64'))),
    )

    const commitmentXpubs = commitments.map(
      (commitment: any) => commitment.xpub,
    )
    const teamXpubs = reduced.team.xpubs
    const toSimXpubs = teamXpubs.filter(
      (xpub: string) => !commitmentXpubs.includes(xpub),
    )

    const bags = []
    const maxDerived = reduced.maxDerived
    for (let i = 0; i < toSimXpubs.length; i++) {
      const xpub = toSimXpubs[i]
      const addresses = Array.from({ length: maxDerived }, (_, i) => i).map(
        (index) =>
          this.deriveAddressFromXPub(xpub, index).to_base58(
            NetworkPrefix.Mainnet,
          ),
      )
      const pubs = addresses.map((address: string) =>
        Buffer.from(Address.from_base58(address).content_bytes()).toString(
          'hex',
        ),
      )

      const txSim = wallet.sign_reduced_transaction_multi(reducedTx, signHints)
      const simulated = new Propositions()
      pubs.forEach((element) =>
        simulated.add_proposition_from_byte(Buffer.from('cd' + element, 'hex')),
      )
      const signed = new Propositions()

      const context = await this.nodeService.getContext()
      const extracted: TransactionHintsBag = extract_hints(
        txSim,
        context,
        boxes,
        dataInputs,
        signed,
        simulated,
      )
      const commitment = JSON.stringify(extracted.to_json())
      bags.push({
        xpub: xpub,
        commitment: commitment,
      })

      if (save) {
        await this.appService.addCommitment(xpub, commitment, reducedId, true)
      }
    }

    return bags
  }

  /**
   * Check if the proof is valid
   * @param reducedId Reduced ID
   * @param hint Hint
   * @param xpub xpub
   * @returns boolean
   */
  async isProofOkay(
    reducedId: string,
    hint: string,
    xpub: string,
  ): Promise<boolean> {
    const wallet = this.getEmptyWallet()

    const commitments = await this.appService.getCommitments(reducedId)
    const signPb = await this.mergeBags(
      reducedId,
      commitments.map((c) => c.commitment),
    )

    const inputNum = await this.getReducedInputLength(reducedId)

    const hintJson = JSON.parse(hint)
    const relevantCommitment = commitments.find((c) => c.xpub === xpub)
    if (!relevantCommitment) {
      return false
    }

    const commitmentJs = JSON.parse(relevantCommitment.commitment)
    let pk = null
    const signed = new Propositions()
    try {
      for (let i = 0; i < inputNum; i++) {
        const hintA = hintJson['publicHints'][i.toString()][0]['a']
        const hintH = hintJson['secretHints'][i.toString()][0]['pubkey']['h']

        const commitmentA = commitmentJs['publicHints'][i.toString()][0]['a']
        const commitmentH =
          commitmentJs['publicHints'][i.toString()][0]['pubkey']['h']
        pk = commitmentH

        if (hintA !== commitmentA || hintH !== commitmentH) {
          return false
        }
      }
    } catch (error) {
      logger.error(error)
      return false
    }
    return true
  }

  /**
   * Sign the reduced transaction
   * @param reducedId Reduced ID
   * @param save Whether to save the transaction
   * @returns signed transaction
   */
  async signReduced(reducedId: string, save: boolean = false): Promise<any> {
    const wallet = this.getEmptyWallet()

    const reduced = await this.appService.getReduced(reducedId, true)
    const reducedTx = ReducedTransaction.sigma_parse_bytes(
      Buffer.from(reduced.reduced, 'base64'),
    )
    const commitments = await this.appService.getCommitments(reducedId)
    const inputNum = await this.getReducedInputLength(reducedId)

    const proofs: PartialProof[] =
      await this.appService.getPartialProofs(reducedId)

    const signPb = await this.mergeBags(
      reducedId,
      commitments.map((c) => c.commitment),
    )
    const signHintsPr = await this.mergeBags(
      reducedId,
      proofs.map((p) => p.proof),
    )

    const allHints = TransactionHintsBag.empty()

    for (let i = 0; i < inputNum; i++) {
      allHints.add_hints_for_input(i, signPb.all_hints_for_input(i))
      allHints.add_hints_for_input(i, signHintsPr.all_hints_for_input(i))
    }

    let message = ''
    try {
      const tx = wallet.sign_reduced_transaction_multi(reducedTx, allHints)

      const boxes = ErgoBoxes.empty()
      reduced.boxes.forEach((item) =>
        boxes.add(ErgoBox.sigma_parse_bytes(Buffer.from(item, 'base64'))),
      )

      const context = await this.nodeService.getContext()

      for (let i = 0; i < inputNum; i++) {
        if (!verify_tx_input_proof(i, context, tx, boxes, ErgoBoxes.empty())) {
          message = 'Proof verification failed for input ' + i.toString()
          logger.error(message, { reducedId: reducedId })
        }
      }

      if (save) {
        await this.appService.addOrUpdateTx(tx.to_json(), reducedId, message)
      }

      return JSON.parse(tx.to_json())
    } catch (error) {
      message = error.message
    }
  }
}
