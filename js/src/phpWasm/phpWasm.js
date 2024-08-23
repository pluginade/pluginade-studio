const { PhpWeb } = await import('https://cdn.jsdelivr.net/npm/php-wasm/PhpWeb.mjs');
const php = new PhpWeb({
	sharedLibs: [
		'php8.3-phar.so',
		'php8.3-openssl.so',
	],
	files: [
		{
			name: 'sample-plugin.php',
			parent: '/preload/',
			url: 'https://raw.githubusercontent.com/pluginade/sample-plugin/main/sample-plugin.php'
		}
	]
});

export default async () => {
	// Listen to STDOUT
	php.addEventListener('output', (event) => {
		console.log(event.detail);
	});

	// Listen to STDERR
	php.addEventListener('error', (event) => {
		console.log(event.detail);
	});

	const exitCode = await php.run(`
		<?php 
		file_put_contents('composer.phar', file_get_contents('https://getcomposer.org/composer-stable.phar'));

		// Optionally, make the file executable
		chmod('composer.phar', 0755);
		?>
	`);
};