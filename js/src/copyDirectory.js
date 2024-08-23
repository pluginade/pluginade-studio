export default async function fetchRepoFiles(repoSlug, directoryPath = '' ) {
	
	const response = await fetch('https://pluginade.com/?repo=' + repoSlug + '&path=' + directoryPath);
    const files = await response.json();

    const repoFiles = [];

    for (const file of files) {
        if (file.type === 'file') {
            const fileContent = await fetch(file.download_url);
            const blob = await fileContent.blob();

            repoFiles.push({
                name: file.name,
                content: blob,
            });
        } else if (file.type === 'dir') {
            const subDirFiles = await fetchGitHubRepoFiles(repoSlug, file.path);
            repoFiles.push({
                name: file.name,
                contents: subDirFiles,
            });
        }
    }

    return repoFiles;
}
