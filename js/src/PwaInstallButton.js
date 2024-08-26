import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InstallDesktopIcon from '@mui/icons-material/InstallDesktop';

const PwaInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
	const handler = (event) => {
		console.log( 'beforeinstallprompt event triggered' );
	  // Prevent the mini-infobar from appearing on mobile
	  event.preventDefault();
	  // Save the event so it can be triggered later
	  setDeferredPrompt(event);
	  // Show the install button
	  setIsVisible(true);
	};

	window.addEventListener('beforeinstallprompt', handler);

	// Optionally hide the button if the app is already installed
	window.addEventListener('appinstalled', () => {
	  console.log('PWA was installed');
	  setIsVisible(false);
	});

	// Clean up the event listeners on component unmount
	return () => {
	  window.removeEventListener('beforeinstallprompt', handler);
	  window.removeEventListener('appinstalled', () => setIsVisible(false));
	};
  }, []);

  const handleInstallClick = () => {
	if (deferredPrompt) {
	  // Show the install prompt
	  deferredPrompt.prompt();
	  // Wait for the user to respond to the prompt
	  deferredPrompt.userChoice.then((choiceResult) => {
		if (choiceResult.outcome === 'accepted') {
		  console.log('User accepted the install prompt');
		} else {
		  console.log('User dismissed the install prompt');
		}
		// Clear the deferred prompt variable, since it can only be used once
		setDeferredPrompt(null);
		// Hide the install button
		setIsVisible(false);
	  });
	}
  };

  return (
	isVisible && (  
		<Button
			id="install-button"
			onClick={handleInstallClick}
		>
			<Box sx={{display: 'flex', gap: '.5em'}}>
				<InstallDesktopIcon />
				<span>Install As App</span>
			</Box>
		</Button>
	)
  );
};

export default PwaInstallButton;
