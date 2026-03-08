// frontend/src/components/ModalShell.jsx
// Migrated to MUI Dialog — styled by OdysseyProvider automatically.

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from '@mui/material';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SIZE_MAP = { sm: 'xs', md: 'sm', lg: 'md' };

const ModalShell = ({
  isOpen,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}) => (
  <Dialog
    open={!!isOpen}
    onClose={onClose}
    maxWidth={SIZE_MAP[size] || 'sm'}
    fullWidth
  >
    <DialogTitle sx={{ pr: 6 }}>
      {title}
      {description && (
        <Typography variant="body2" color="text.secondary" style={{ marginTop: 4 }}>
          {description}
        </Typography>
      )}
      <IconButton
        aria-label="Close"
        onClick={onClose}
        size="small"
        sx={{ position: 'absolute', top: 12, right: 12 }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>

    <DialogContent dividers>{children}</DialogContent>

    {footer && <DialogActions sx={{ px: 3, py: 2 }}>{footer}</DialogActions>}
  </Dialog>
);

export default ModalShell;
