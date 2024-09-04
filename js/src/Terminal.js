import React, { useState, useRef, useEffect } from 'react';
import { Terminal } from '@xterm/xterm';

// Import the styles
import '@xterm/xterm/css/xterm.css';

export default ({terminalOutput}) => {
	const terminalRef = useRef(null);
	const [xTerm, setXTerm] = useState(null);

	useEffect(() => {
		async function doSetUp() {
			const term = new Terminal();
			term.open(terminalRef.current);
			setXTerm(term);
		}
		doSetUp();
	}, []);

	// When the terminalOutput changes, write it to the terminal
	useEffect(() => {
		if (xTerm) {
			xTerm.write(terminalOutput);
		}
	}, [terminalOutput]);

	return (
		<div>
			<div ref={terminalRef} />
		</div>
	);
}
