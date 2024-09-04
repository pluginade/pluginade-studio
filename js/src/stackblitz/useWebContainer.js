import { useState, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';

export default () => {
	const [webContainer, setWebContainer] = useState(null);

	useEffect(() => {
		async function doSetUp() {
			const webcontainerInstance = await WebContainer.boot();
			setWebContainer( webcontainerInstance );
		}
		doSetUp();
	}, []);

	async function runCommandInWebContainer( {command, commandArgs = [], commandOptions = {}, onOutput, onProcessStart, onProcessEnd } ) {
		const webContainerProcess = await webContainer.spawn(command, commandArgs, commandOptions);

		if (onProcessStart) {
			onProcessStart(webContainerProcess);
		}

		webContainerProcess.output.pipeTo(new WritableStream({
			write(data) {
				onOutput(data);
			}
		}));

		const exitCode = await webContainerProcess.exit;
		onProcessEnd(exitCode);
	}

	async function getPluginFiles( plugin_dirname ) {
		const files = await webContainer.fs.readdir( plugin_dirname, {withFileTypes: true}  );
		return files;
	}

	return {
		instance: webContainer,
		runCommand: runCommandInWebContainer,
		getPluginFiles,
	}
}
