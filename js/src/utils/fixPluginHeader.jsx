export default async function fixPluginHeader( pluginDirHandle, pluginData ) {
	console.log( 'fixPluginaheader );');
	// Extract plugin data from the main plugin file.
	for await (const entry of pluginDirHandle.values()) {

		console.log( entry.name );

		// Check if the entry is a php file by checking if it ends with .php
		const fileExtensionRegex = /(?:\.([^.]+))?$/;
		const fileExtension = fileExtensionRegex.exec(entry.name)[1];  

		if ( fileExtension === 'php' ) {
			const file = await entry.getFile();
			const fileContents = await file.text();

			console.log( 'fileContents', file.name, file );
			
			// This PHP file did not have a plugin header.
			if ( Object.keys( pluginData ).length === 0 ) {
				continue;
			}
	
			let fixedFileHeader = `/**
* Plugin Name: ` + pluginData[`plugin_name`] + `
* Plugin URI: ` + pluginData[`plugin_uri`] + `
* Description: ` + pluginData[`plugin_description`] + `
* Version: ` + pluginData[`plugin_version`] + `
* Author: ` + pluginData[`plugin_author`] + `
* Text Domain: ` + pluginData[`plugin_textdomain`] + `
* Domain Path: languages
* License: GPLv2 or later
*
* @package ` + pluginData[`plugin_dirname`] + `
*/`;

			// Replace string occurrences
			const updated = fileContents.replace(/\/\*\*[^*] \* Plugin Name:[^;]*\*\//g, fixedFileHeader);

			const fileHandle = await pluginDirHandle.getFileHandle(pluginData.plugin_dirname + '.php', { create: true });
			const writable = await fileHandle.createWritable();
			await writable.write(updated);
			await writable.close();

			// We will also rename the file if the name of the plugin is different than the filename.
			if ( pluginData.plugin_dirname !== file.name ) {
				// Delete the original file, as we already made the new one with the right name.
				await pluginDirHandle.removeEntry(file.name);
				
			}
		}
	}

	return true;
}