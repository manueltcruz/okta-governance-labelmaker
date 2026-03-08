// frontend/src/components/ProfileDropdown.jsx

import React, { useMemo, useState } from 'react';
import { Avatar, Menu, MenuItem, Divider, Typography, Box } from '@mui/material';

const ProfileDropdown = ({ userName, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const displayName = (userName || 'User').trim() || 'User';

  const initials = useMemo(() => {
    const parts = String(displayName).trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((p) => (p[0] || '').toUpperCase()).join('') || 'U';
  }, [displayName]);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = async () => { handleClose(); await onLogout?.(); };

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={handleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
        sx={{
          display: 'flex', alignItems: 'center', gap: 2,
          width: '100%', px: 2, py: 1, borderRadius: 2,
          border: '1px solid', borderColor: 'divider',
          background: 'white', cursor: 'pointer',
          transition: 'background 150ms',
          '&:hover': { background: 'grey.50' },
        }}
      >
        <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main' }}>
          {initials}
        </Avatar>
        <Typography variant="body2" fontWeight={500} noWrap sx={{ flex: 1, textAlign: 'left' }}>
          {displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
          ▼
        </Typography>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 240, mt: -1 } } }}
      >
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="caption" color="text.secondary">Signed in as</Typography>
          <Typography variant="body2" fontWeight={600} noWrap>{displayName}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
        <MenuItem onClick={handleClose}>Close</MenuItem>
      </Menu>
    </>
  );
};

export default ProfileDropdown;
