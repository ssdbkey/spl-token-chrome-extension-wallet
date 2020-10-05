import React, { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js'
import { ledger_get_pubkey } from '../utils/ledger';
import { useCallAsync } from '../utils/notifications';
import { useWalletSelector } from '../utils/wallet'
import Container from '@material-ui/core/Container';
import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';

export default function LedgerPage() {
  const { setWalletIndex } = useWalletSelector();
  const [pubKey, setPubKey] = useState('');
  const callAsync = useCallAsync();

  useEffect(() => {
    async function fetchPubKey() {
      try {
        const pubKey = await ledger_get_pubkey();
        setPubKey(pubKey);
      } catch (err) {
        throw err;
      }
    }

    callAsync(fetchPubKey());
  }, [callAsync]);

  const onConnect = () => {
    setWalletIndex(0, new PublicKey(pubKey).toString());
    alert('Your ledger account is loaded. To continue, close this tab and use the extension.');
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.remove(tab.id, function () { });
    });
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: 'center' }}>
      <Typography variant="h5" style={{ marginTop: 100 }}>Create a account for ledger</Typography>
      <Typography style={{ fontSize: 14, marginTop: 50, marginBottom: 20 }}>Address</Typography>
      <Typography style={{ fontSize: 12, marginBottom: 100 }}>{pubKey}</Typography>
      <Button color="primary" onClick={onConnect}>
        Connect
      </Button>
    </Container>
  );
}
