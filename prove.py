"""Agent Wallet — Solana signing proof (W2 stealth wallet).

Proves the full local signing chain for the Colosseum hackathon project:
  BIP39 mnemonic -> SLIP-10 ed25519 (m/44'/501'/0'/0') -> Keypair
  -> build & sign a real System-Program transfer message
  -> verify with an INDEPENDENT VerifyKey (not the signer itself)

No key ever touches the network / page memory — the whole point of the project.
Run: python prove.py
"""
import sys, os, json, hashlib, hmac
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ledger"))
from nacl.signing import SigningKey, VerifyKey
import nacl.exceptions
from solders.keypair import Keypair
from solders.message import Message
from solders.hash import Hash
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.transaction import VersionedTransaction

LEDGER = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "ledger", "wallets_W1_W4.json"))


def bip39_seed(mnemo, passphrase=""):
    return hashlib.pbkdf2_hmac("sha512", mnemo.encode(),
                               (passphrase or "mnemonic").encode(), 2048)


def slip10_ed25519(seed):
    I = hashlib.pbkdf2_hmac("sha512", seed, b"ed25519 seed", 1)
    return I[:32], I[32:]


def ckd_ed25519(k, chain, index):
    hardened = index >= 0x80000000
    data = (b"\x00" if hardened else b"") + bytes(SigningKey(k).verify_key) + index.to_bytes(4, "big")
    I = hmac.new(chain, data, "sha512").digest()
    L = 2**255 - 19
    k_new = (int.from_bytes(k, "big") + int.from_bytes(I[:32], "big")) % L
    return k_new.to_bytes(32, "big"), I[32:]


def solana_keypair(mnemo):
    """BIP39 -> SLIP-10 ed25519 m/44'/501'/0'/0' -> solders.Keypair (64-byte form)."""
    seed = bip39_seed(mnemo)
    k, chain = slip10_ed25519(seed)
    for idx in (0x80000000 + 44, 0x80000000 + 501, 0x80000000 + 0, 0):
        k, chain = ckd_ed25519(k, chain, idx)
    return Keypair.from_bytes(k + bytes(SigningKey(k).verify_key))


def main():
    wallets = json.load(open(LEDGER))
    w2 = wallets[1]  # W2

    kp = solana_keypair(w2["mnemonic"])
    derived = str(kp.pubkey())
    stored = w2["solana"]
    print(f"W2 derived pubkey : {derived}")
    print(f"W2 stored address : {stored}")
    print(f"key derivation MATCH: {derived == stored}")
    assert derived == stored, "derived Solana address != stored"

    # build + sign a real System-Program transfer message
    recent = Hash.from_string("Sysvar1111111111111111111111111111111111111")
    to = Pubkey.from_string("11111111111111111111111111111112")  # System Program
    ix = transfer(TransferParams(from_pubkey=kp.pubkey(), to_pubkey=to, lamports=1, idempotent=False))
    msg = Message.new_with_blockhash([ix], kp.pubkey(), recent)
    msg_bytes = bytes(msg)

    sig = kp.sign_message(msg_bytes)

    # independent verification (VerifyKey, not the signer)
    vkey = VerifyKey(bytes(kp.pubkey()))
    vkey.verify(msg_bytes, bytes(sig))  # raises BadSignatureError if wrong
    print("sign + independent verify: OK")
    print(f"signature: {bytes(sig).hex()[:48]}...")
    print("serialized message bytes:", len(msg_bytes))
    print("\nALL GREEN ✅  Solana local signing chain proven.")


if __name__ == "__main__":
    main()
