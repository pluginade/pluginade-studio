export default async function getRemoteDirArray(repoSlug, directoryPath = '' ) {
	
	const response = await fetch('https://pluginade.com/?repo=' + repoSlug + '&path=' + directoryPath);
    const files = await response.json();

    const repoFiles = {};

    for (const file of files) {
        if (file.type === 'file') {
            const fileContent = await fetch(file.download_url);
            const blob = await fileContent.text();
            
            // Follow the format used by stackblitz.
            repoFiles[file.name] = {
                file: {
                    contents: blob,
                },
            };
        } else if (file.type === 'dir') {
            const subDirFiles = await getRemoteDirArray(repoSlug, file.path);
            
            repoFiles[file.name] = {
                directory: subDirFiles
            };
            // repoFiles.push({
            //     name: file.name,
            //     type: 'dir',
            //     contents: subDirFiles,
            // });
        }
    }

    return repoFiles;
}
