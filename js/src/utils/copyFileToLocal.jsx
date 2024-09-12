export default async function copyFileToLocal(parentDirHandle, fileName, fileContents ) {

            console.log('copying', fileName, fileContents);
         
            
            const fileHandle = await parentDirHandle.getFileHandle(fileName, { create: true });
            try {
                const writable = await fileHandle.createWritable();
                await writable.write(fileContents);
                await writable.close();
            } catch (error) {
                console.log(fileData);
                console.log(error);
            }
}
