import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
const { TransportError } = require("@ledgerhq/errors");
const bs58 = require("bs58");
const solana = require("@solana/web3.js");

const INS_GET_PUBKEY = 0x05;
const INS_SIGN_MESSAGE = 0x06;

const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;

const P2_EXTEND = 0x01;
const P2_MORE = 0x02;

const MAX_PAYLOAD = 255;

const LEDGER_CLA = 0xe0;

const INTERACTION_TIMEOUT = 120 * 1000;

/*
 * Helper for chunked send of large payloads
 */
async function solana_send(transport, instruction, p1, payload) {
    var p2 = 0;
    var payload_offset = 0;

    if (payload.length > MAX_PAYLOAD) {
        while ((payload.length - payload_offset) > MAX_PAYLOAD) {
            const buf = payload.slice(payload_offset, payload_offset + MAX_PAYLOAD);
            payload_offset += MAX_PAYLOAD;
            console.log("send", (p2 | P2_MORE).toString(16), buf.length.toString(16), buf);
            const reply = await transport.send(LEDGER_CLA, instruction, p1, (p2 | P2_MORE), buf);
            if (reply.length !== 2) {
                throw new TransportError(
                    "solana_send: Received unexpected reply payload",
                    "UnexpectedReplyPayload"
                );
            }
            p2 |= P2_EXTEND;
        }
    }

    const buf = payload.slice(payload_offset);
    console.log("send", p2.toString(16), buf.length.toString(16), buf);
    const reply = await transport.send(LEDGER_CLA, instruction, p1, p2, buf);

    return reply.slice(0, reply.length - 2);
}

const BIP32_HARDENED_BIT = ((1 << 31) >>> 0);
function _harden(n) {
    return (n | BIP32_HARDENED_BIT) >>> 0;
}

function solana_derivation_path(account, change) {
    var length;
    if (typeof (account) === 'number') {
        if (typeof (change) === 'number') {
            length = 4;
        } else {
            length = 3;
        }
    } else {
        length = 2;
    }

    var derivation_path = Buffer.alloc(1 + (length * 4));
    var offset = 0;
    offset = derivation_path.writeUInt8(length, offset);
    offset = derivation_path.writeUInt32BE(_harden(44), offset);  // Using BIP44
    offset = derivation_path.writeUInt32BE(_harden(501), offset); // Solana's BIP44 path

    if (length > 2) {
        offset = derivation_path.writeUInt32BE(_harden(account), offset);
        if (length === 4) {
            offset = derivation_path.writeUInt32BE(_harden(change), offset);
        }
    }

    return derivation_path;
}

async function solana_ledger_get_pubkey(transport, derivation_path) {
    return solana_send(transport, INS_GET_PUBKEY, P1_NON_CONFIRM, derivation_path);
}

async function solana_ledger_sign_transaction(transport, derivation_path, transaction) {
    const msg_bytes = transaction.serializeMessage();


    // XXX: Ledger app only supports a single derivation_path per call ATM
    var num_paths = Buffer.alloc(1);
    num_paths.writeUInt8(1);

    const payload = Buffer.concat([num_paths, derivation_path, msg_bytes]);

    return solana_send(transport, INS_SIGN_MESSAGE, P1_CONFIRM, payload);
}

export async function ledger_get_pubkey() {
    try {
        var transport = await TransportWebUSB.create(INTERACTION_TIMEOUT);
        let from_derivation_path = solana_derivation_path();
        let from_pubkey_bytes = await solana_ledger_get_pubkey(transport, from_derivation_path);
        return bs58.encode(from_pubkey_bytes);
    } catch (err) {
        /* istanbul ignore next: specific error rewrite */
        if (
            err.message
                .trim()
                .startsWith("No WebUSB interface found for your Ledger device")
        ) {
            throw new Error(
                "Couldn't connect to a Ledger. Please upgrade the Ledger firmware to version 1.5.5 or later."
            );
        }
        /* istanbul ignore next: specific error rewrite */
        if (err.message.trim().startsWith("Unable to claim interface")) {
            // apparently can't use it in several tabs in parallel
            throw new Error(
                "Could not access Ledger device. Is it being used in another tab?"
            );
        }
        /* istanbul ignore next: specific error rewrite */
        if (err.message.trim().startsWith("Not supported")) {
            // apparently can't use it in several tabs in parallel
            throw new Error(
                "Your browser doesn't seem to support WebUSB yet. Try updating it to the latest version."
            );
        }
        /* istanbul ignore next: specific error rewrite */
        if (err.message.trim().startsWith("No device selected")) {
            // apparently can't use it in several tabs in parallel
            throw new Error(
                "You did not select a Ledger device. Check if the Ledger is plugged in and unlocked."
            );
        }

        // throw unknown error
        // throw err;
        throw new Error(
            "Unknown Error. Check if the Ledger is unlocked."
        );
    }
}

export async function ledger_sign_transaction(transaction) {
    var transport = await TransportWebUSB.create(INTERACTION_TIMEOUT);
    let from_derivation_path = solana_derivation_path();
    return await solana_ledger_sign_transaction(transport, from_derivation_path, transaction);
    // return bs58.encode(sig_bytes);
}

// (async () => {
//     var transport = await Transport.create();

//     const from_derivation_path = solana_derivation_path();
//     const from_pubkey_bytes = await solana_ledger_get_pubkey(transport, from_derivation_path);
//     const from_pubkey_string = bs58.encode(from_pubkey_bytes);
//     console.log("---", from_pubkey_string);

//     const to_derivation_path = solana_derivation_path(1);
//     const to_pubkey_bytes = await solana_ledger_get_pubkey(transport, to_derivation_path);
//     const to_pubkey_string = bs58.encode(to_pubkey_bytes);
//     console.log("---", to_pubkey_string);

//     const from_pubkey = new solana.PublicKey(from_pubkey_string);
//     const to_pubkey = new solana.PublicKey(to_pubkey_string);
//     var tx = solana.SystemProgram.transfer({
//         fromPubkey: from_pubkey,
//         toPubkey: to_pubkey,
//         lamports: 42,
//     })

//     // XXX: Fake blockhash so this example doesn't need a
//     // network connection. It should be queried from the
//     // cluster in normal use.
//     tx.recentBlockhash = bs58.encode(Buffer.from([
//         3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
//         3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
//     ]));

//     const sig_bytes = await solana_ledger_sign_transaction(transport, from_derivation_path, tx);

//     const sig_string = bs58.encode(sig_bytes);
//     console.log("--- len:", sig_bytes.length, "sig:", sig_string);

//     tx.addSignature(from_pubkey, sig_bytes);
//     console.log("--- verifies:", tx.verifySignatures());
// })().catch(e => console.log(e));
