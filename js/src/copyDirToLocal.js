export default async function copyDirToLocal(parentDirHandle, topLevelDirectoryName, directoryFiles ) {

    // Check if a subdirectory exists
    let theMainDirHandle;

    try {
        theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName);
        return 'dir-already-exists';
    } catch (error) {
        // If not, create the directory
        theMainDirHandle = await parentDirHandle.getDirectoryHandle(topLevelDirectoryName, { create: true });

        directoryFiles.map( async (fileData, index) => {
            if ( fileData.type === 'dir' ) {
                // Add these files in a subdirectory of the current parent.
                await copyDirToLocal( theMainDirHandle, fileData.name, fileData.contents )
            }
            if ( fileData.type === 'file' ) {
                console.log( fileData );
                const fileHandle = await theMainDirHandle.getFileHandle(fileData.name, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(fileData.content);
                await writable.close();
            }
        });

    }

    return 'success'

}
