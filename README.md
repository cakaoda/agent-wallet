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
- `devnet_claim.py` — **PUBLIC devnet proof**: the agent derives its keypair
  at runtime from the mnemonic, signs a live on-chain transaction, submits it
  to **solana-devnet** (public chain), and polls `getSignatureStatuses` until
  `confirmed`. `devnet_proof.json` holds the on-chain signature + Solscan link.
  Verified:
  - Wallet: [`FYQHcP…Hizq1`](https://explorer.solana.com/address/FYQHcPU6hkffFaizh1DtCejW2cT1FtzLW855o2gHizq1?cluster=devnet)
  - Tx: [`wZ5jqg…G71Vp5W`](https://explorer.solana.com/tx/wZ5jqgpHCopRYPSRPWvhb8JC5Vpym44F9zPta9Mk5QByXoHsGMDDTzYcCfufms1a4VrE5cmeTw4E7KSnG71Vp5W?cluster=devnet)
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

# Public devnet (no local validator needed)
python devnet_claim.py
# -> status: confirmed
# -> tx: https://explorer.solana.com/tx/...?cluster=devnet
```

## Status
- [x] Local keypair derivation from mnemonic (matches Phantom's address)
- [x] Sign + independently verify a Solana message
- [x] Agent signs + confirms an on-chain transaction (solana-test-validator)
- [x] Agent signs + confirms on **solana-devnet** (public Solscan link)
- [x] Phantom-shaped EIP-1193 provider, injected at `document_start`
- [ ] Mainnet airdrop end-to-end (rate-limit dependent)

## Business model
Agent-as-a-service: crypto-native tools (airdrop claimers, DEX bots,
DAO treasuries) pay per-signature or per-claim for "the key never leaves
the vault" guarantee. Margin = the infra that a hot extension can't offer.

#PROOFofBuild #Solana #Colosseum
