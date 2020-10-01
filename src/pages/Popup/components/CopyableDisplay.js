import React, { useRef } from 'react';
import { TextField } from '@material-ui/core';
import CopyIcon from 'mdi-material-ui/ContentCopy';
import { makeStyles } from '@material-ui/core/styles';
import { useSnackbar } from 'notistack';
import QRCode from 'qrcode.react';
import IconButton from '@material-ui/core/IconButton';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    alignItems: 'center',
  }
}));

export default function CopyableDisplay({
  value,
  label,
  helperText,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const textareaRef = useRef();
  const classes = useStyles();
  const copyLink = () => {
    let textArea = textareaRef.current;
    if (textArea) {
      textArea.select();
      document.execCommand('copy');
      enqueueSnackbar(`Copied ${label}`, {
        variant: 'info',
        autoHideDuration: 2500,
      });
    }
  };

  return (
    <div>
      <div className={classes.root}>
        <TextField
          inputRef={(ref) => (textareaRef.current = ref)}
          value={value}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          fullWidth
          helperText={helperText}
          label={label}
          spellCheck={false}
          InputProps={{ style: { fontSize: 12 } }}
        />
        <IconButton onClick={copyLink} style={{ marginTop: 15, padding: 6, marginLeft: 6 }}>
          <CopyIcon fontSize="small" />
        </IconButton>
      </div>
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <QRCode value={value} size={300} includeMargin />
      </div>
    </div>
  );
}
