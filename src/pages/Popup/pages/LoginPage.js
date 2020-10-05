import React, { useEffect, useState } from 'react';
import {
  generateMnemonicAndSeed,
  hasLockedMnemonicAndSeed,
  loadMnemonicAndSeed,
  mnemonicToSeed,
  storeMnemonicAndSeed,
} from '../utils/wallet-seed';
import Container from '@material-ui/core/Container';
import LoadingIndicator from '../components/LoadingIndicator';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { Typography } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import { useCallAsync } from '../utils/notifications';
import Link from '@material-ui/core/Link';

export default function LoginPage() {
  const [restore, setRestore] = useState(false);
  return (
    <Container maxWidth="sm">
      {restore ? (
        <RestoreWalletForm goBack={() => setRestore(false)} />
      ) : (
          <>
            {hasLockedMnemonicAndSeed() ? <LoginForm /> : <CreateWalletForm />}
            <br />
            <Link style={{ cursor: 'pointer' }} onClick={() => setRestore(true)}>
              Restore existing wallet
            </Link>
          </>
        )}
    </Container>
  );
}

function CreateWalletForm() {
  const [mnemonicAndSeed, setMnemonicAndSeed] = useState(null);
  useEffect(() => {
    generateMnemonicAndSeed().then(setMnemonicAndSeed);
  }, []);
  const [savedWords, setSavedWords] = useState(false);
  const callAsync = useCallAsync();

  function submit(password) {
    const { mnemonic, seed } = mnemonicAndSeed;
    callAsync(storeMnemonicAndSeed(mnemonic, seed, password), {
      progressMessage: 'Creating wallet...',
      successMessage: 'Wallet created',
    });
  }

  if (!savedWords) {
    return (
      <SeedWordsForm
        mnemonicAndSeed={mnemonicAndSeed}
        goForward={() => setSavedWords(true)}
      />
    );
  }

  return (
    <ChoosePasswordForm
      mnemonicAndSeed={mnemonicAndSeed}
      goBack={() => setSavedWords(false)}
      onSubmit={submit}
    />
  );
}

function SeedWordsForm({ mnemonicAndSeed, goForward }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Card style={{ height: 450, padding: 5 }}>
      <CardContent style={{ paddingBottom: 10, textAlign: "center" }}>
        <Typography variant="h6" style={{ marginBottom: 50, marginTop: 10 }}>
          Create New Wallet
        </Typography>
        <Typography paragraph style={{ fontSize: 14 }}>
          Create a new wallet to hold SPL tokens.
        </Typography>
        <p></p>
        {mnemonicAndSeed ? (
          <TextField
            variant="outlined"
            fullWidth
            multiline
            margin="normal"
            value={mnemonicAndSeed.mnemonic}
            label="Seed Words"
            onFocus={(e) => e.currentTarget.select()}
            inputProps={{ style: { fontSize: 13 } }} // font size of input text
            InputLabelProps={{ style: { fontSize: 14 } }} // font size of input label
          />
        ) : (
            <LoadingIndicator />
          )}
        <p></p>
        <Typography paragraph style={{ fontSize: 12, marginBottom: 0 }}>
          Your private keys are only stored on your current computer or device.
          You will need these words to restore your wallet if your browser's
          storage is cleared or your device is damaged or lost.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={confirmed}
              disabled={!mnemonicAndSeed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
          }
          label={<Typography style={{ fontSize: 12 }}>I have saved these words in a safe place.</Typography>}
        />
      </CardContent>
      <CardActions style={{ justifyContent: 'center' }}>
        <Button color="primary" disabled={!confirmed} onClick={goForward}>
          Continue
        </Button>
      </CardActions>
    </Card>
  );
}

function ChoosePasswordForm({ goBack, onSubmit }) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  return (
    <Card style={{ height: 450, padding: 5 }}>
      <CardContent style={{ textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Choose a Password<br />(Optional)
        </Typography>
        <Typography style={{ fontSize: 12, paddingTop: 30, paddingBottom: 5 }}>
          Optionally pick a password to protect your wallet.
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="New Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputProps={{ style: { fontSize: 14 } }} // font size of input text
          InputLabelProps={{ style: { fontSize: 14 } }} // font size of input label
        />
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          inputProps={{ style: { fontSize: 14 } }} // font size of input text
          InputLabelProps={{ style: { fontSize: 14 } }} // font size of input label
        />
        <Typography style={{ fontSize: 12, paddingTop: 20 }}>
          If you forget your password you will need to restore your wallet using
          your seed words.
        </Typography>
      </CardContent>
      <CardActions style={{ justifyContent: 'space-between', marginTop: 15 }}>
        <Button onClick={goBack}>Back</Button>
        <Button
          color="primary"
          disabled={password !== passwordConfirm}
          onClick={() => onSubmit(password)}
        >
          Create Wallet
        </Button>
      </CardActions>
    </Card>
  );
}

function LoginForm() {
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const callAsync = useCallAsync();

  function submit() {
    callAsync(loadMnemonicAndSeed(password, stayLoggedIn), {
      progressMessage: 'Unlocking wallet...',
      successMessage: 'Wallet unlocked',
    });
  }

  return (
    <Card style={{ height: 450, padding: 5 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom style={{ textAlign: "center", marginBottom: 50, marginTop: 50 }}>
          Unlock Wallet
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputProps={{ style: { fontSize: 14 } }} // font size of input text
          InputLabelProps={{ style: { fontSize: 14 } }} // font size of input label
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
            />
          }
          label={<Typography style={{ fontSize: 12 }}>Keep wallet unlocked</Typography>}
        />
      </CardContent>
      <CardActions style={{ justifyContent: 'center', marginTop: 80 }}>
        <Button color="primary" onClick={submit}>
          Unlock
        </Button>
      </CardActions>
    </Card>
  );
}

function RestoreWalletForm({ goBack }) {
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const callAsync = useCallAsync();

  function submit() {
    callAsync(
      mnemonicToSeed(mnemonic).then((seed) =>
        storeMnemonicAndSeed(mnemonic, seed, password),
      ),
    );
  }

  return (
    <Card style={{ height: 500, padding: 5 }}>
      <CardContent style={{ textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Restore Existing Wallet
        </Typography>
        <Typography style={{ fontSize: 14, paddingTop: 30, paddingBottom: 5 }}>
          Restore your wallet using your twelve seed words. Note that this will
          delete any existing wallet on this device.
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          margin="normal"
          label="Seed Words"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          inputProps={{ style: { fontSize: 14 } }} // font size of input text
          InputLabelProps={{ style: { fontSize: 14 } }} // font size of input label
        />
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="New Password (Optional)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputProps={{ style: { fontSize: 14 } }} // font size of input text
          InputLabelProps={{ style: { fontSize: 14 } }} // font size of input label
        />
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          inputProps={{ style: { fontSize: 14 } }} // font size of input text
          InputLabelProps={{ style: { fontSize: 14 } }} // font size of input label
        />
      </CardContent>
      <CardActions style={{ justifyContent: 'space-between', paddingTop: 0 }}>
        <Button onClick={goBack}>Cancel</Button>
        <Button
          color="primary"
          disabled={password !== passwordConfirm}
          onClick={submit}
        >
          Restore
        </Button>
      </CardActions>
    </Card>
  );
}
