import * as wasm from 'ergo-lib-wasm-nodejs';

const extractCommitments = (
    commitment: wasm.TransactionHintsBag,
    inputLength: number,
  ) => {
    const tx_known = wasm.TransactionHintsBag.empty();
    const tx_own = wasm.TransactionHintsBag.empty();
    for (let index = 0; index < inputLength; index++) {
      const input_commitments = commitment.all_hints_for_input(index);
      const input_known = wasm.HintsBag.empty();
      if (input_commitments.len() > 0) {
        input_known.add_commitment(input_commitments.get(0));
        tx_known.add_hints_for_input(index, input_known);
      }
      const input_own = wasm.HintsBag.empty();
      if (input_commitments.len() > 1) {
        input_own.add_commitment(input_commitments.get(1));
        tx_own.add_hints_for_input(index, input_own);
      }
    }
    return {
      public: tx_known,
      private: tx_own,
    };
  };
  
  export {
    extractCommitments
  }