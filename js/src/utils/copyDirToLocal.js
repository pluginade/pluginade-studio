export default async function copyDirToLocal(parentDirHandle, directoryFiles, topLevelDirectoryName = null) {
    // Check if a subdirectory exists
    let theMainDirHandle;

    // Create a directory for the top level directory, unless it is blank. If blank, just copy the files to the parent directory.
    if (topLevelDirectoryName) {
        try {
            theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName);
        } catch (error) {
            theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName, { create: true });
        }
    } else {
        theMainDirHandle = parentDirHandle;
    }

    const fileOperations = Object.keys(directoryFiles).map(async (filename) => {
        if (filename === 'node_modules') {
            // Skip node_modules
            // return;
        }

        if ('directory' in directoryFiles[filename]) {
            // Add these files in a subdirectory of the current parent.
            await copyDirToLocal(theMainDirHandle, directoryFiles[filename].directory, filename);
        }

        if ('file' in directoryFiles[filename]) {
            console.log('copying', filename);
            const fileHandle = await theMainDirHandle.getFileHandle(filename, { create: true });
            try {
                const writable = await fileHandle.createWritable();
                const stream = directoryFiles[filename].file.contents.stream();
                await stream.pipeTo(writable);
            } catch (error) {
                console.log(error);
            }
        }
    });

    await Promise.all(fileOperations);

    return theMainDirHandle;
}
