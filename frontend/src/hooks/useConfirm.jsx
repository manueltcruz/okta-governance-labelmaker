import { useState, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

const ConfirmDialogView = ({ open, title, message, confirmLabel, onConfirm, onCancel }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} variant="outlined">Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export function useConfirm() {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    resolve: null,
  });

  const confirm = useCallback((title, message, confirmLabel = 'Confirm') => {
    return new Promise(resolve => {
      setState({ open: true, title, message, confirmLabel, resolve });
    });
  }, []);

  const handleClose = useCallback((result) => {
    setState(prev => {
      prev.resolve?.(result);
      return { ...prev, open: false, resolve: null };
    });
  }, []);

  const confirmDialog = (
    <ConfirmDialogView
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      onConfirm={() => handleClose(true)}
      onCancel={() => handleClose(false)}
    />
  );

  return { confirm, confirmDialog };
}
