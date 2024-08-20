export default async function getServerFiles(url) {
	const response = await fetch(url);
	const text = await response.text();
	
	const parser = new DOMParser();
	const doc = parser.parseFromString(text, 'text/html');
	const links = Array.from(doc.querySelectorAll('a'));
  
	const serverFiles = [];
  
	for (const link of links) {
	  const href = link.getAttribute('href');
	  if (href !== '../') { // Skip the parent directory link
		const isDirectory = href.endsWith('/');
		const fileName = isDirectory ? href.slice(0, -1) : href;
		
		serverFiles.push({
		  name: fileName,
		  url: new URL(href, url).href,
		  isDirectory,
		  contents: isDirectory ? await getServerFiles(new URL(href, url).href) : null
		});
	  }
	}
  
	return serverFiles;
  }
  
  // Example usage:
  const url = './boiler-plugin/';
  getServerFiles(url).then(serverFiles => {
	console.log(serverFiles);
  });
  