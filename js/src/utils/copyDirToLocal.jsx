export default async function copyDirToLocal(parentDirHandle, directoryFiles, topLevelDirectoryName = null ) {

    // Check if a subdirectory exists
    let theMainDirHandle;

    // Create a directory for the top level directory, unless it is blank. If blank, just copy the files to the parent directory.
    if ( topLevelDirectoryName ) {
        try {
            theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName);
        } catch (error) {
            // If not, create the directory
            theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName, { create: true });
        }
    } else {
        theMainDirHandle = parentDirHandle;
    }

    for ( const filename of Object.keys( directoryFiles ) ) {
        if ( 'node_modules' === filename ) {
            // Skip node_modules
            // continue;
        }
        if ( 'directory' in directoryFiles[filename] ) {
            // Add these files in a subdirectory of the current parent.
            await copyDirToLocal(theMainDirHandle, directoryFiles[filename].directory, filename);
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
