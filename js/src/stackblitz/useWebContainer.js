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
		const pluginFilesObject = {};
		const files = await webContainer.fs.readdir( plugin_dirname, {withFileTypes: true, buffer: 'utf-8'}  );
		for( const file of files ) {
			if ( file.isDirectory() ) {
				pluginFilesObject[file.name] = {
					directory: await getPluginFiles( plugin_dirname + '/' + file.name )
				}
			}
			if ( file.isFile() ) {
				const fileContents = await webContainer.fs.readFile( plugin_dirname + '/' + file.name );
				pluginFilesObject[file.name] = {
					file: {
						contents: fileContents
					}
				}
			}
		}
				
		return pluginFilesObject;
	}

	return {
		instance: webContainer,
		runCommand: runCommandInWebContainer,
		getPluginFiles,
	}
}
