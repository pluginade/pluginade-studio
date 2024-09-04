import React, { useState, useRef, useEffect } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

// Import the styles
import '@xterm/xterm/css/xterm.css';

export default ({terminalOutput}) => {
	const terminalRef = useRef(null);
	const [xTerm, setXTerm] = useState(null);
	const [fitAddon, setFitAddon] = useState(null);

	useEffect(() => {
		async function doSetUp() {
			const term = new Terminal();
			const fitAddon = new FitAddon();
			term.loadAddon(fitAddon);
			setFitAddon(fitAddon);
			term.open(terminalRef.current);
			setXTerm(term);
		}
		doSetUp();
	}, []);

	// When the terminalOutput changes, write it to the terminal
	useEffect(() => {
		if (xTerm) {
			fitAddon.fit();
			xTerm.write(terminalOutput);
		}
	}, [terminalOutput]);

	return (
		<div style={{display:'grid', overflow: 'hidden'}} ref={terminalRef} />
	);
}
