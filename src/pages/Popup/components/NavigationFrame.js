import React, { useState } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useConnectionConfig, MAINNET_URL } from '../utils/connection';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { clusterApiUrl } from '@solana/web3.js';
import { useWalletSelector } from '../utils/wallet';
import { openExpandPopup } from '../utils/utils'
import ListItemIcon from '@material-ui/core/ListItemIcon';
import CheckIcon from '@material-ui/icons/Check';
import AddIcon from '@material-ui/icons/Add';
import AccountIcon from '@material-ui/icons/AccountCircle';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import SolanaIcon from './SolanaIcon';
import Tooltip from '@material-ui/core/Tooltip';

const useStyles = makeStyles((theme) => ({
  content: {
    flexGrow: 1,
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  title: {
    flexGrow: 1,
  },
  button: {
    marginLeft: theme.spacing(1),
  },
  menuItemIcon: {
    minWidth: 32,
  },
}));

export default function NavigationFrame({ children }) {
  const classes = useStyles();
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className={classes.title} component="h1">
            SPL Token Wallet
          </Typography>
          <WalletSelector />
          <NetworkSelector />
        </Toolbar>
      </AppBar>
      <main className={classes.content}>{children}</main>
    </>
  );
}

function NetworkSelector() {
  const { endpoint, setEndpoint } = useConnectionConfig();
  const [anchorEl, setAnchorEl] = useState(null);
  const classes = useStyles();

  const networks = [
    MAINNET_URL,
    clusterApiUrl('devnet'),
    clusterApiUrl('testnet'),
    'http://localhost:8899',
  ];

  // const networkLabels = {
  //   [MAINNET_URL]: 'Mainnet Beta',
  //   [clusterApiUrl('devnet')]: 'Devnet',
  //   [clusterApiUrl('testnet')]: 'Testnet',
  // };

  return (
    <>
      <Tooltip title="Select Network" arrow>
        <IconButton color="inherit" onClick={(e) => setAnchorEl(e.target)}>
          <SolanaIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        getContentAnchorEl={null}
      >
        {networks.map((network) => (
          <MenuItem
            key={network}
            onClick={() => {
              setAnchorEl(null);
              setEndpoint(network);
            }}
            selected={network === endpoint}
            style={{ padding: "0px 16px" }}
          >
            <ListItemIcon className={classes.menuItemIcon}>
              {network === endpoint ? <CheckIcon fontSize="small" /> : null}
            </ListItemIcon>
            <Typography style={{ fontSize: 12 }}>{network}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function WalletSelector() {
  const { addresses, walletIndex, setWalletIndex } = useWalletSelector();
  const [anchorEl, setAnchorEl] = useState(null);
  const classes = useStyles();

  if (addresses.length === 0) {
    return null;
  }

  return (
    <>
      <Tooltip title="Select Account" arrow>
        <IconButton color="inherit" onClick={(e) => setAnchorEl(e.target)}>
          <AccountIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        getContentAnchorEl={null}
      >
        {addresses.map((address, index) => {
          let pubKey = address;
          if (address !== 'Ledger') {
            pubKey = address.toBase58();
          }

          return (
            <MenuItem
              key={pubKey}
              onClick={() => {
                setAnchorEl(null);
                setWalletIndex(index);
              }}
              selected={index === walletIndex}
              style={{ padding: "0px 16px" }}
            >
              <ListItemIcon className={classes.menuItemIcon}>
                {index === walletIndex ? <CheckIcon fontSize="small" /> : null}
              </ListItemIcon>
              <Typography style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>{pubKey}</Typography>
            </MenuItem>
          )
        })}
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setWalletIndex(addresses.length);
          }}
          style={{ padding: "0px 16px" }}
        >
          <ListItemIcon className={classes.menuItemIcon}>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <Typography style={{ fontSize: 12 }}>Create Account</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            openExpandPopup('/ledger-connect');
          }}
          style={{ padding: "0px 16px" }}
        >
          <ListItemIcon className={classes.menuItemIcon}>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <Typography style={{ fontSize: 12 }}>Connect Ledger</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
