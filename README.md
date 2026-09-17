# Agent Wallet

**The first wallet that knows it's being driven by an AI — and signs without ever leaking its key.**

AI agents are about to claim airdrops, swap, and stake across Solana — but most of them
run a hot extension in a browser and sign with a key that lives in page memory.
Agent Wallet inverts that: the **keypair never leaves the agent's process**. The dApp
only ever sees a clean EIP-1193 / Phantom-shaped provider; the real Ed25519 signature
is produced locally and handed back as an opaque blob.

## Why now
- Sybil resistance is killing naive farmers (2026 airdrops are merit-based).
- "Proof of Build" > deck. This repo is runnable, not a pitch.

## What's in here
- `prove.py` — the whole local signing chain, runnable, self-verifying:
  BIP39 → SLIP-10 ed25519 (`m/44'/501'/0'/0'`) → `Keypair` → sign a real
  System-Program transfer → verify with an **independent** `VerifyKey`.
- `onchain_claim.py` — the agent (keypair derived from mnemonic at runtime)
  **signs and sends a live on-chain transaction** to a `solana-test-validator`,
  then polls `getSignatureStatuses` until it is `confirmed`. Private key never
  touches the page or the RPC.
- `stealth/` (in parent repo) — EIP-1193 mock provider injected at
  `document_start`, round-trip signing against a real dApp (dappOS).

## Run the proof
```
pip install solders pynacl
python prove.py
# -> key derivation MATCH: True
# -> sign + independent verify: OK
# -> ALL GREEN ✅

# On-chain (needs solana-test-validator running on :8899)
python onchain_claim.py
# -> submitted sig: ...
# -> status: confirmed | err: None
# -> PROOF OF BUILD ✅  agent-signed tx confirmed on-chain
```

## Status
- [x] Local keypair derivation from mnemonic (matches Phantom's address)
- [x] Sign + independently verify a Solana message
- [x] Agent signs + confirms an on-chain transaction (solana-test-validator)
- [x] Phantom-shaped EIP-1193 provider, injected at `document_start`
- [ ] Devnet / mainnet airdrop end-to-end (rate-limit dependent)

## Business model
Agent-as-a-service: crypto-native tools (airdrop claimers, DEX bots,
DAO treasuries) pay per-signature or per-claim for "the key never leaves
the vault" guarantee. Margin = the infra that a hot extension can't offer.

#PROOFofBuild #Solana #Colosseum
