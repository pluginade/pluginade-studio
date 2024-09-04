export default async function copyDirToLocal(parentDirHandle, topLevelDirectoryName, directoryFiles ) {

    // Check if a subdirectory exists
    let theMainDirHandle;

    try {
        theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName);
        return 'dir-already-exists';
    } catch (error) {
        // If not, create the directory
        theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName, { create: true });

        for ( const filename of Object.keys( directoryFiles ) ) {
            if ( 'directory' in directoryFiles[filename] ) {
                // Add these files in a subdirectory of the current parent.
                await copyDirToLocal(theMainDirHandle, filename, directoryFiles[filename].directory);
            }
            if ( 'file' in directoryFiles[filename] ) {
                console.log('copying', filename);
                const fileHandle = await theMainDirHandle.getFileHandle(filename, { create: true });
                try {
                    const writable = await fileHandle.createWritable();
                    await writable.write(directoryFiles[filename].file.contents);
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
