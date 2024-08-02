import React from 'react';
import Menu from '@mui/material/Menu';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import ContentCut from '@mui/icons-material/ContentCut';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ContentPaste from '@mui/icons-material/ContentPaste';
import Button from '@mui/material/Button';

export default function IconMenu({onNewPlugin, onOpenPlugin}) {
const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
	setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
	setAnchorEl(null);
  };

  return (
	<>
		<Button
			id="file-button"
			aria-controls={open ? 'file-menu' : undefined}
			aria-haspopup="true"
			aria-expanded={open ? 'true' : undefined}
			onClick={handleClick}
		>
			File
		</Button>
		<Menu
			id="edit-menu"
			anchorEl={anchorEl}
			open={open}
			onClose={handleClose}
			MenuListProps={{
				'aria-labelledby': 'file-button',
			}}
		>
			<MenuList sx={{ width: 320, maxWidth: '100%' }}>
				<MenuItem onClick={() => {
					onNewPlugin();
					handleClose();
				}}>
					<ListItemIcon>
						<ContentCut fontSize="small" />
					</ListItemIcon>
					<ListItemText>New Plugin</ListItemText>
					<Typography variant="body2" color="text.secondary">
						⌘N
					</Typography>
				</MenuItem>
				<MenuItem onClick={() => {
					onOpenPlugin();
					handleClose();
				}}>
					<ListItemIcon>
						<ContentCut fontSize="small" />
					</ListItemIcon>
					<ListItemText>Open Plugin</ListItemText>
					<Typography variant="body2" color="text.secondary">
						⌘O
					</Typography>
				</MenuItem>
			</MenuList>
		</Menu>
	</>
  );
}