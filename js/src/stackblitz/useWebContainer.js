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

	async function runCommandInWebContainer( command, args = [], onOutput ) {
		const installProcess = await webContainer.spawn(command, args);

		installProcess.output.pipeTo(new WritableStream({
		write(data) {
			onOutput(data);
		}
		}));
	}

	return {
		instance: webContainer,
		runCommand: runCommandInWebContainer
	}
}
