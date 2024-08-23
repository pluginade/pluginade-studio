export default async function copyDirToLocal(parentDirHandle, topLevelDirectoryName, directoryFiles ) {

    // Check if a subdirectory exists
    let theMainDirHandle;

    try {
        theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName);
        return 'dir-already-exists';
    } catch (error) {
        // If not, create the directory
        theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName, { create: true });

        for (const fileData of directoryFiles) {
            if (fileData.type === 'dir') {
                // Add these files in a subdirectory of the current parent.
                await copyDirToLocal(theMainDirHandle, fileData.name, fileData.contents);
            }
            if (fileData.type === 'file') {
                console.log('copying', fileData.name);
                const fileHandle = await theMainDirHandle.getFileHandle(fileData.name, { create: true });
                try {
                    const writable = await fileHandle.createWritable();
                    await writable.write(fileData.content);
                    await writable.close();
                } catch (error) {
                    console.log(fileData);
                    console.log(error);
                }
            }
        }

        
        return theMainDirHandle;

    }
}
