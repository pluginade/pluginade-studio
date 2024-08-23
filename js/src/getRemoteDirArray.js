export default async function getRemoteDirArray(repoSlug, directoryPath = '' ) {
	
	const response = await fetch('https://pluginade.com/?repo=' + repoSlug + '&path=' + directoryPath);
    const files = await response.json();

    const repoFiles = [];

    for (const file of files) {
        if (file.type === 'file') {
            const fileContent = await fetch(file.download_url);
            const blob = await fileContent.text();

            repoFiles.push({
                name: file.name,
                type: 'file',
                content: blob,
            });
        } else if (file.type === 'dir') {
            const subDirFiles = await getRemoteDirArray(repoSlug, file.path);
            repoFiles.push({
                name: file.name,
                type: 'dir',
                contents: subDirFiles,
            });
        }
    }

    return repoFiles;
}
