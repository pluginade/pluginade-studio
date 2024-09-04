import React, { useState, useRef, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Terminal } from '@xterm/xterm';

// Import the styles
import '@xterm/xterm/css/xterm.css';

const files = {
	// This is a file - provide its path as a key:
	'package.json': {
	  // Because it's a file, add the "file" key
	  file: {
		// Now add its contents
		contents: `
		{
			"name": "pluginade-scripts",
			"warning": "WARNING: This file is generated by Pluginade Scripts. Do not edit it directly. If you wish to stop Pluginade Scripts from updating this file, change the name field to something other than pluginade-scripts",
			"version": "1.0.0",
			"repository": {
				"type": "git",
				"url": "https://github.com/pluginade/pluginade-scripts"
			},
			"devDependencies": {
				"playwright": "1.45.1",
				"@playwright/test": "1.45.1",
				"@wordpress/e2e-test-utils-playwright": "^1.0.0",
				"@wordpress/env": "^10.0.0",
				"@wordpress/eslint-plugin": "^17.6.0",
				"@wordpress/jest-preset-default": "^11.20.0",
				"@wordpress/prettier-config": "^3.6.0",
				"@wordpress/scripts": "27.0.0",
				"prettier": "npm:wp-prettier@^3.0.3"
			}
		}
		`,
	  },
	},
};

export default () => {
	const terminalRef = useRef(null);
	const [xTerm, setXTerm] = useState(null);
	const [webContainer, setWebContainer] = useState(null);
	const [output, setOutput] = useState('');

	useEffect(() => {
		async function doSetUp() {
			const term = new Terminal();
			term.open(terminalRef.current);
			setXTerm(term);

			const webcontainerInstance = await WebContainer.boot();
			setWebContainer( webcontainerInstance );
		}
		doSetUp();
	}, []);

	return (
		<div>
			<button
				onClick={() => {
					xTerm.write('Running npm install \r\n');
					runCommandInWebContainer( webContainer, 'npm', ['install'], (data) => {
						setOutput(data)
						xTerm.write(data);
					})
				}}>Run npm install</button>
			<div ref={terminalRef} />
		</div>
	);
}

async function startWebContainer( files ) {
	// Call only once
	const webcontainerInstance = await WebContainer.boot();
	await webcontainerInstance.mount(files);
  
	const packageJSON = await webcontainerInstance.fs.readFile('package.json', 'utf-8');
	console.log(packageJSON);

	return webcontainerInstance;

	const exitCode = await installDependencies( webcontainerInstance );

	console.log( 'Response from installDependencies:', exitCode );

	if (exitCode !== 0) {
		throw new Error('Installation failed');
	};
}

async function runCommandInWebContainer( webcontainerInstance, command, args = [], onOutput ) {
	console.log( webcontainerInstance );
	const installProcess = await webcontainerInstance.spawn(command, args);

	installProcess.output.pipeTo(new WritableStream({
	  write(data) {
		onOutput(data);
	  }
	}));
}