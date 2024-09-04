import React, {useState, useEffect, useMemo} from 'react';
import { createRoot } from 'react-dom/client';
import {__} from '@wordpress/i18n';
import { get, entries, set } from 'https://unpkg.com/idb-keyval@5.0.2/dist/esm/index.js';

import './index.scss';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ThemeProvider, createTheme} from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';

import PwaInstallButton from './PwaInstallButton';
import FileMenu from './menuFile';
import EditMenu from './menuEdit';
import CodeEditor from './Code';

import GitHubIcon from '@mui/icons-material/GitHub';

// import getRemoteDirArray from './utils/getRemoteDirArray.js';
// console.log( await getRemoteDirArray('sample-plugin') );
import boilerPlugin from './utils/boilerPlugin';
import useWebContainer from './stackblitz/useWebContainer';
import Terminal from './Terminal';

import copyDirToLocal from './utils/copyDirToLocal';
import parsePluginHeader from './utils/parsePluginHeader';
import fixPluginHeader from './utils/fixPluginHeader';

// if ('serviceWorker' in navigator) {
// 	window.addEventListener('load', () => {
// 	  navigator.serviceWorker.register('/service-worker.js')
// 		.then(registration => {
// 		  console.log('ServiceWorker registration successful with scope: ', registration.scope);
// 		})
// 		.catch(error => {
// 		  console.log('ServiceWorker registration failed: ', error);
// 		});
// 	});
// }

const LightTheme = createTheme({
	palette: {
		mode: 'light',
		primary: {
		  light: '#ffef62',
		  main: '#ffeb3b',
		  dark: '#b2a429',
		  contrastText: '#fff',
		},
		background: {
			paper: '#fff',
			default: '#fff',
		},
		secondary: {
		  light: '#ff7961',
		  main: '#f44336',
		  dark: '#ba000d',
		  contrastText: '#000',
		},
	  },
});

const DarkTheme = createTheme({
	palette: {
		mode: 'dark',
		primary: {
			light: '#ffef62',
			main: '#ffeb3b',
			dark: '#b2a429',
		},
		divider: 'rgba(255, 255, 255, 0.12)',
		background: {
			paper: '#424242',
			default: 'rgb(16, 20, 24)',
		},
		background10: {
			default: 'rgb(15, 25, 36)',
		},
		background20: {
			default: 'rgb(16 24 32)',
		},
		secondary: {
			light: '#ff7961',
			main: '#f44336',
			dark: '#ba000d',
		}
	},
});

const domNode = document.getElementById('pluginade');
const root = createRoot(domNode);


function a11yProps(index) {
	return {
	  id: `plugin-tab-${index}`,
	  'aria-controls': `plugin-tabpanel-${index}`,
	};
}

const thePluginDirHandles = {};
const pluginadePluginsLocalStorage = window.localStorage.getItem('pluginadePlugins') ? JSON.parse(window.localStorage.getItem('pluginadePlugins')) : [];
const actuallyOpenPlugins = pluginadePluginsLocalStorage;
const entriesInIndexDb = await entries();
entriesInIndexDb.forEach( async (entry) => {
	if ( pluginadePluginsLocalStorage.includes( entry[0] ) ) {
		thePluginDirHandles[entry[0]] = entry[1];
	} else {
		// Remove the entry from actuallyOpenPlugins
		// let actuallyOpenPlugins = actuallyOpenPlugins.filter( item => item != entry[1]);
	}
} );

function PluginadeApp() {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
	const [showCreatePlugin, setShowCreatePlugin] = useState(false);
	const [pluginDirHandles, setPluginDirHandles] = useState(thePluginDirHandles);
	const [plugins, setPlugins] = useState({});
	const [currentPluginTab, setCurrentPluginTabState] = useState( null );
	const webContainer = useWebContainer();

	useEffect( () => {
		if ( ! webContainer.instance ) {
			return;
		}

		actuallyOpenPlugins.forEach( async (plugin) => {
			const directoryHandleOrUndefined = await get(plugin);
			if ( directoryHandleOrUndefined ) {
				openPlugin( directoryHandleOrUndefined );
			} else {
				openPlugin( null );
			}
		} );
	}, [webContainer.instance]);

	useEffect(() => {
		window.localStorage.setItem('pluginadePlugins', JSON.stringify(Object.keys(plugins)));

		if ( ! currentPluginTab ) {
			setCurrentPluginTabState(Object.keys(plugins).length > 0 ? Object.keys(plugins)[0] : null);
		}
	}, [plugins]);

	function setCurrentPluginTab(value) {
		// Make sure we have permission to use the file system for each open plugin.
		Object.keys( plugins ).forEach( async (plugin) => {
			const directoryHandleOrUndefined = await get(plugin);
			if (directoryHandleOrUndefined) {
				window.localStorage.setItem('currentPluginTab', value);
				setCurrentPluginTabState(value);
				setShowCreatePlugin(false);
			} else {
				const directoryHandle = await window.showDirectoryPicker( { mode: 'readwrite' });
				await set(plugin, directoryHandle);

				window.localStorage.setItem('currentPluginTab', value);
				setCurrentPluginTabState(value);
				setShowCreatePlugin(false);
			}
		});
	}

	async function openPlugin( dirHandle ) {
		console.log( 'opening', dirHandle );
		if ( ! dirHandle ) {
			dirHandle = await window.showDirectoryPicker( { mode: 'readwrite' });
		}

		let isWpPlugin = false;
		// Extract plugin data from the main plugin file.
		for await (const entry of dirHandle.values()) {
			// Check if the entry is a php file by checking if it ends with .php
			const fileExtensionRegex = /(?:\.([^.]+))?$/;
			const fileExtension = fileExtensionRegex.exec(entry.name)[1];  

			if ( fileExtension === 'php' ) {
				const file = await entry.getFile();
				const fileContents = await file.text();
				const pluginData = parsePluginHeader( fileContents );
				
				// This PHP file did not have a plugin header.
				if ( Object.keys( pluginData ).length === 0 ) {
					continue;
				}
				
				pluginData.plugin_path = dirHandle.name;
				pluginData.plugin_dirname = dirHandle.name;
				isWpPlugin = true;

				pluginData.filesObject = await getFilesObject( dirHandle );

				// Mount the plugin into the webContainer.
				if ( webContainer.instance ) {
					// Make a directory in the webContainer for this plugin
					await webContainer.instance.fs.mkdir( pluginData.plugin_dirname );
					await webContainer.instance.mount( pluginData.filesObject, { mountPoint: pluginData.plugin_dirname } );
					const content = await webContainer.instance.fs.readFile('/' + pluginData.plugin_dirname + '/' + pluginData.plugin_dirname + '.php', 'utf-8');
					console.log( 'mounted?', content );
				}

				let hasWpModules = false;
				for await (const possibleWpModulesEntry of dirHandle.values()) {
					if ( possibleWpModulesEntry.name === 'wp-modules' ) {
						hasWpModules = true;
						// Get all of the names of each directory inside the wp-modules directory.
						const modules = [];
						const modulesDir = await dirHandle.getDirectoryHandle('wp-modules');
						// console.log( modulesDir );
						for await (const module of modulesDir.values()) {
							modules.push(module.name);
						}
						pluginData.plugin_modules = modules;
					}
				}
				if ( ! hasWpModules ) {
					pluginData.plugin_modules = {};
				}

				pluginData.dirHandle = dirHandle;

				await set(pluginData.plugin_dirname, dirHandle);

				setPlugins((nonStalePlugins) => {
					return {
						...nonStalePlugins,
						[pluginData.plugin_dirname]: {
							...pluginData,
						}
					};
				});

				setCurrentPluginTab( pluginData.plugin_dirname );
			}
		}
	}

	if ( ! ( 'showOpenFilePicker' in self ))  {
		return <ThemeProvider theme={prefersDarkMode ? DarkTheme : DarkTheme}>
			<CssBaseline />
			<Box className="pluginade-studio" sx={{
				display: 'grid',
				gridTemplateRows: 'min-content min-content 1fr'
			}}>
				<Box sx={{backgroundColor: 'background20.default', display: 'flex'}}>
					<Typography sx={{padding: 2, fontSize: '1em'}} component="h1">Pluginade Studio</Typography>
					<Divider orientation="vertical" />
				</Box>
				<Divider />
				<Box>
					<Alert severity="error">{'Your browser does not support the File System Access API. Please use a browser that does. (Chrome 86+ or Edge 86+)'}</Alert>
				</Box>
			</Box>
		</ThemeProvider>
	}

	return (
		<ThemeProvider theme={prefersDarkMode ? DarkTheme : DarkTheme}>
			<CssBaseline />
			<Box className="pluginade-studio" sx={{
				display: 'grid',
				gridTemplateRows: 'min-content min-content min-content min-content 1fr'
			}}>
				<Box sx={{backgroundColor: 'background20.default', display: 'flex'}}>
					<Typography sx={{padding: 2, fontSize: '1em'}} component="h1">Pluginade Studio</Typography>
					<Divider orientation="vertical" />
					<FileMenu
						onNewPlugin={() => {
							setShowCreatePlugin(true);
						}}
						onOpenPlugin={() => {
							openPlugin();
						}}
					/>
					<Divider orientation="vertical" />
					<EditMenu />
					<Divider orientation="vertical" />
					<Box sx={{display: 'flex', marginLeft: 'auto'}}>
						<Divider orientation="vertical" />
						<Button href="https://github.com/pluginade/pluginade-studio" aria-label="Check out this project on Github"><GitHubIcon /></Button>
						<Divider orientation="vertical" />
						<PwaInstallButton />
						<Divider orientation="vertical" />
					</Box>
				</Box>
				<Divider />
				<Box sx={{backgroundColor: 'background20.default', display: 'flex'}}>
					{/* <Typography sx={{fontSize: '.8em'}} component="h2">Open Plugins:</Typography> */}
					<Divider orientation="vertical" />
					{ showCreatePlugin ? <Box></Box> : (
						<Tabs
							value={currentPluginTab}
							onChange={(event, newValue) => {
								setCurrentPluginTab(newValue)
							}}
							variant="scrollable"
							scrollButtons="auto"
							aria-label="Open Plugins. Choose one to work on it."
							sx={{minHeight: '40px'}}
						>
							{
								Object.keys( plugins ).map((plugin, index) => {
									return <Tab key={index} value={plugin} label={plugins[plugin].plugin_name} sx={{minHeight: '40px'}}/>
								})
							}
						</Tabs>
					) }
				</Box>
				<Divider />
				<Box className="pluginade-studio-body" sx={{
					display: 'grid',
					gridTemplateColumns: '1fr',
					backgroundColor: 'background20.default',
					overflow: 'hidden',
				}}>
					<CssBaseline />
					{/* <Box sx={{backgroundColor: 'background.default', width: '100%', borderRadius: '.4em'}}> */}
						<Box sx={{display: (showCreatePlugin ? 'none' : 'grid'), overflow: 'hidden'}}>
							{
								Object.keys( plugins ).map((plugin, index) => {
									const currentPluginSlug = plugin;

									return <Plugin key={index} plugins={plugins} setPlugins={setPlugins} currentPluginSlug={currentPluginSlug} hidden={currentPluginSlug !== currentPluginTab } webContainer={webContainer} />
								})
							}
							{/* <TerminalWindow /> */}
						</Box>
						<Box className="create-plugin" sx={{display: (showCreatePlugin ? 'grid' : 'none'), height: '100%', width: '100%', overflow: 'auto', alignItems: 'center', justifyItems: 'center' }}>
							<CreatePlugin setShowCreatePlugin={setShowCreatePlugin} uponSuccess={(newPluginSlug) => setCurrentPluginTab(newPluginSlug)} plugins={plugins} setPlugins={setPlugins} openPlugin={openPlugin} />
						</Box>
						<Box>
						<div id="output"></div>
						</Box>
					{/* </Box> */}
				</Box>
			</Box>
		</ThemeProvider>
	);
}
root.render(<PluginadeApp />);

function getFilesObject( dirHandle ) {
	const filesObject = {};
	return new Promise( async (resolve, reject) => {
		for await (const entry of dirHandle.values()) {
			if ( entry.kind === 'file' ) {
				const file = await entry.getFile();
				const fileContents = await file.text();
				filesObject[entry.name] = {
					file: {
						contents: fileContents
					}
				};
			} else if ( entry.kind === 'directory' ) {
				const subDirFiles = await getFilesObject( entry );
				filesObject[entry.name] = {
					directory: subDirFiles
				};
			}
		}
		resolve( filesObject );
	});
}

function CreatePlugin({openPlugin, setShowCreatePlugin}) {
	const [creationState, setCreationState] = useState('initial');
	const [creationMessage, setCreationMessage] = useState('');

	const [pluginDataState, setPluginDataState] = useState({
		plugin_name: '',
		plugin_dirname: '',
		plugin_textdomain: '',
		plugin_namespace: '',
		plugin_description: '',
		plugin_uri: '',
		plugin_min_wp_version: '',
		plugin_min_php_version: '7.2',
		plugin_license: 'GPL-2.0-or-later',
		plugin_update_uri: '',
	});

	async function createPlugin(setLoading, pluginDataState) {
		try {
			setCreationState('creating');
			setCreationMessage('');
			
			console.log( pluginDataState );

			async function promptForDirectoryCreation() {
				try {
					// Prompt user to select a directory
					const parentDirHandle = await window.showDirectoryPicker();

					const files = await boilerPlugin();
			
					const pluginDirHandle = await copyDirToLocal( parentDirHandle, pluginDataState.plugin_dirname, files );

					const stringFixerResult = await fixPluginHeader( pluginDirHandle, pluginDataState );

					console.log( stringFixerResult );

					setLoading(false);

					if ( pluginDirHandle === 'dir-already-exists') {
						setCreationState('error');
						setCreationMessage('Directory already exists');
					}

					// if ( copyResult === 'success' ) {
						setCreationState('success');
						setCreationMessage('Plugin successfully created');

						openPlugin(pluginDirHandle);
					// }
			
				} catch (error) {
					setLoading(false);
					setCreationState( 'error' );
					setCreationMessage('Directory selection canceled or failed. Try again.');
					console.error('Directory selection canceled or failed:', error);
				}
			}
			
			promptForDirectoryCreation();

		} catch (error) {
			setLoading(false);
			setCreationState('error');
			setCreationMessage(error.message);
		}
	}

	return <Box sx={{width: '100%', height: '100%', overflow: 'hidden'}}>
		{creationState === 'creating' ? <LinearProgress /> : null}
		{creationState === 'error' ? <Alert severity="error">{creationMessage}</Alert> : null}
		{creationState === 'success' ? <Alert severity="success">{creationMessage}</Alert> : null}
		
		<Box>
			<PluginDataForm
				pluginDataState={pluginDataState}
				setPluginDataState={setPluginDataState}
				onSubmit={(event, setLoading)=>{
					event.preventDefault();
					createPlugin(setLoading, pluginDataState);
				}}
				saveButtonText={"Choose plugin location on disk"} 
				onCancel={() => {
					setShowCreatePlugin(false);
				}}
			/>
		</Box>
	</Box>
}

function Plugin({plugins, setPlugins, currentPluginSlug, hidden, webContainer}) {
	const pluginDataState = plugins[currentPluginSlug];
	const [currentTab, setCurrentTab] = useState('modules');

	const pluginTabs = {
		'modules': 'Modules',
		'code': 'Code',
		'webpack': 'Webpack',
		'test': 'Test',
		'lint': 'Lint',
		'security': 'Security',
		'fixers': 'Fixers',
		'playground': 'Playground',
		'build': 'Build',
		'deploy': 'Deploy',
	}

	return (
		<Box id={`plugin-tabpanel-${pluginDataState.plugin_dirname}`} sx={{display: (hidden ? 'none' : 'grid'), gridTemplateRows: 'min-content min-content 1fr', height: '100%', overflow: 'hidden'}}>
			<Box className="plugin-header" sx={{display: 'grid'	, gridTemplateRows: 'min-content'}}>
				{/* <Box sx={{padding: 2}}>
					<Typography variant="h5" component="h2">Plugin: {pluginDataState.plugin_name}</Typography>
				</Box> */}
				<Tabs className="plugin-control-tabs" value={currentTab} onChange={(event, newValue) => {setCurrentTab(newValue)}} aria-label="Plugins Tools" variant="scrollable">
					{
						Object.keys( pluginTabs ).map((tool, index) => {
							return <Tab key={index} value={tool} label={pluginTabs[tool]} {...a11yProps(tool)} />
						})
					}
				</Tabs>
			</Box>
			<Divider />
			<Box className="plugin-content" sx={{display: 'grid', overflow: 'hidden'}}>
				<Box id={`plugin-tabpanel-webpack`} sx={{display: 'webpack' === currentTab ? 'flex' : 'none', gap: 2, padding: 2, overflow: 'hidden'}}>
					<Webpack webContainer={webContainer} pluginData={pluginDataState}/>
				</Box>
				<Box id={`plugin-tabpanel-phpunit`} sx={{display: 'phpunit' === currentTab ? 'flex' : 'none', gap: 2, padding: 2}}>
					<Box sx={{display: 'grid', gap: 2}}>
						<Box>
							<Typography component="p">{__( 'To run PHPUnit tests run the following in a terminal window:')}</Typography>
						</Box>
						<CopyCode language="bash" code={`sh pluginade.sh test:phpunit;`} />
					</Box>
				</Box>
				<Box id={`plugin-tabpanel-lint`} sx={{display: 'lint' === currentTab ? 'grid' : 'none', gap: 2, padding: 2}}>
					<Box sx={{display: 'grid', gap: 2}}>
						<Box>
							<Typography component="p">{__( 'To scan your code using WPCS, run following in a terminal window:')}</Typography>
						</Box>
						<CopyCode language="bash" code={`cd ${pluginDataState.plugin_path}; \n
						sh pluginade.sh lint:php;
						`} />
					</Box>
				</Box>
				<Box id={`plugin-tabpanel-modules`} sx={{display: 'modules' === currentTab ? 'block' : 'none', height: '100%', overflow: 'hidden'}}>
					<Modules plugins={plugins} setPlugins={setPlugins} currentPluginSlug={currentPluginSlug} />
				</Box>
				<Box id={`plugin-tabpanel-playground`} sx={{display: 'playground' === currentTab ? 'block' : 'none', height: '100%', overflow: 'hidden'}}>
					{/* <Playground /> */}
				</Box>
				<Box id={`plugin-tabpanel-code`} sx={{display: 'code' === currentTab ? 'block' : 'none', height: '100%', overflow: 'hidden'}}>
					<Terminal />
				</Box>
			</Box>
		</Box>
	);
}

function Webpack({webContainer, pluginData}) {
	const [terminalOutput, setTerminalOutput] = useState('Starting Webpack...');

	return (
		<Box sx={{display: 'grid', gap: 2, overflow: 'hidden', gridTemplateRows: 'min-content min-content 1fr', width: '100%'}}>
			<Typography component="h2">Webpack</Typography>
			<Button
			onClick={() => {
				webContainer.runCommand( 'npm', ['install'], {cwd: pluginData.plugin_dirname}, (data) => {
					setTerminalOutput(data);
				})
			}}>Run npm install</Button>
			
			<Terminal terminalOutput={terminalOutput} setTerminalOutput={setTerminalOutput} />
			
		</Box>
	);
}

function Playground() {
	return (
		<Box sx={{padding: 2, height: '100%', overflow: 'hidden'}}>
			<Box>
				<iframe style={{width: '100%', height: '100%', border: 0}}src="https://playground.wordpress.net/"></iframe>
			</Box>
		</Box>
	);
}

function Modules({plugins, setPlugins, currentPluginSlug}) {
	const thisPlugin = plugins[currentPluginSlug];
	const thisPluginsModules = thisPlugin.plugin_modules;
	const [currentModule, setCurrentModule] = useState( Object.keys( thisPluginsModules )[0] );
	return (
		<Box sx={{padding: 2, height: '100%', overflow: 'hidden'}}>
			<Box sx={{display: 'grid', gridTemplateColumns: '200px 1fr', height: '100%', overflow: 'hidden', border: '1px solid', borderColor: 'background20.default', borderRadius: 2}}>
				<List sx={{overflow: 'auto', borderRight: '1px solid', borderRightColor: 'background20.default', backgroundColor: 'background20.default'}}>
					<ListItem disablePadding>
						<Box sx={{display: 'grid', alignItems: 'center', padding: 2, width: '100%'}}>
							<Button variant="contained" color="secondary" aria-label="Create New Plugin" onClick={() => {
								setCurrentModule('pluginadeCreateNewModule');
							}} sx={{width: '100%'}}>
								{ __( 'New Module +', 'pluginade' )}
							</Button>
						</Box>
					</ListItem>
					{
						Object.keys( thisPluginsModules ).map((module, index) => {
							return <ListItem key={index} disablePadding>
								<ListItemButton selected={currentModule === module} onClick={() => setCurrentModule(module)}>
									<ListItemText primary={thisPluginsModules[module].name} />
								</ListItemButton>
							</ListItem>
						})
					}
				</List>
				<Box className={'tab-panel-create-module'} sx={{height: '100%', overflow: 'hidden', display: currentModule === 'pluginadeCreateNewModule' ? 'block' : 'none'}}>
					<CreateModule pluginSlug={currentPluginSlug} plugins={plugins} setPlugins={setPlugins} />
				</Box>
			</Box>
		</Box>
	);
}

function CreateModule({pluginSlug, plugins, setPlugins, uponSuccess}) {
	const [creationState, setCreationState] = useState('initial');
	const [creationMessage, setCreationMessage] = useState('');

	const [pluginDataState, setPluginDataState] = useState({
		plugin_name: '',
		plugin_dirname: '',
		plugin_textdomain: '',
		plugin_namespace: '',
		plugin_description: '',
		plugin_uri: '',
		plugin_min_wp_version: '',
		plugin_min_php_version: '7.2',
		plugin_license: 'GPL-2.0-or-later',
		plugin_update_uri: '',
	});

	async function createModule(setLoading) {
		
	}

	return <Box sx={{width: '100%', height: '100%', overflow: 'hidden'}}>
		{creationState === 'creating' ? <LinearProgress /> : null}
		{creationState === 'error' ? <Alert severity="error">{creationMessage}</Alert> : null}
		{creationState === 'success' ? <Alert severity="success">{creationMessage}</Alert> : null}
		
		<Box sx={{display: 'grid', width: '100%', height: '100%', overflow: 'auto', alignItems: 'start', justifyItems: 'start'}}>
			<Box component="form" sx={{padding: 2, display: 'grid', gap: 3, width: '100%', maxWidth: '400px'}} onSubmit={(event) => {
				event.preventDefault();
				setLoading( true );
				onSubmit(event, setLoading);
			}}>
				<TextField
					label="Plugin Name"
					variant="outlined"
					fullWidth
					required
					value={pluginDataState.plugin_name}
					onChange={(event) => setPluginDataState(
						{
							...pluginDataState,
							plugin_name: event.target.value,
							plugin_dirname: event.target.value.replace(/\s+/g, '-').toLowerCase(),
						}
					)}
				/>

				<TextField
					label="Plugin Namespace"
					variant="outlined"
					fullWidth
					required
					value={pluginDataState.plugin_namespace}
					onChange={(event) => setPluginDataState({...pluginDataState, plugin_namespace: event.target.value})}
				/>
				
				<TextField
					label="Plugin Description"
					variant="outlined"
					fullWidth
					required
					value={pluginDataState.plugin_description}
					onChange={(event) => setPluginDataState({...pluginDataState, plugin_description: event.target.value})}
				/>

				<TextField
					label="Plugin Version"
					variant="outlined"
					fullWidth
					required
					value={pluginDataState.plugin_version}
					onChange={(event) => setPluginDataState({...pluginDataState, plugin_version: event.target.value})}
				/>

				<TextField
					label="Plugin Author"
					variant="outlined"
					fullWidth
					required
					value={pluginDataState.plugin_author}
					onChange={(event) => setPluginDataState({...pluginDataState, plugin_author: event.target.value})}
				/>

				<TextField
					label="Plugin Author URI"
					variant="outlined"
					fullWidth
					required
					value={pluginDataState.plugin_author_uri}
					onChange={(event) => setPluginDataState({...pluginDataState, plugin_author_uri: event.target.value})}
				/>

				<Button type="submit" variant="contained" color="secondary">
					{creationState === 'creating' ? <CircularProgress size={24} /> : 'Update Module files' }
				</Button>
			</Box>
		</Box>
	</Box>
}

function CopyCode({language, code}) {
	const [copied, setCopied] = useState(false);

	function copyCode() {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => {
			setCopied(false);
		}, 2000);
	}

	return (
		<Box sx={{display: 'grid', gridTemplateRows: 'min-content 1fr min-content', gap: 0, border: '1px solid', borderColor: 'background20.default', borderRadius: 1}}>
			<Box className="language" sx={{padding: 1, borderRadius: '4px', borderBottom: '1px solid', borderBottomColor: 'background20.default'}}>{language}</Box>
			<Box className="code" sx={{
				padding: 1,
				backgroundColor: 'background10.default',
				borderRadius: '4px',
				whiteSpaceCollapse: 'preserve-breaks',
    			lineHeight: 1,
				marginBottom: 1,
			}}>{code}</Box>
			<Button variant="contained" color="secondary" onClick={copyCode}>
				{copied ? 'Copied!' : 'Copy'}
			</Button>
		</Box>
	);
}

function PluginDataForm({pluginDataState, setPluginDataState, onSubmit, onCancel, saveButtonText="Update Plugin Files"}) {
	const [loading, setLoading] = useState(false);

	return (
		<Box component="form" sx={{padding: 2, display: 'grid', gap: 3, width: '100%', maxWidth: '50%'}} onSubmit={(event) => {
			event.preventDefault();
			setLoading( true );
			onSubmit(event, setLoading);
		}}>
			<Typography sx={{fontSize: '1.3em'}} component="h2">Create a new plugin</Typography>
			<TextField
				label="Plugin Name"
				variant="outlined"
				fullWidth
				required
				value={pluginDataState.plugin_name}
				onChange={(event) => setPluginDataState(
					{
						...pluginDataState,
						plugin_name: event.target.value,
						plugin_dirname: event.target.value.replace(/\s+/g, '-').toLowerCase(),
					}
				)}
			/>

			{/* <TextField
				label="Plugin Namespace"
				variant="outlined"
				fullWidth
				required
				value={pluginDataState.plugin_namespace}
				onChange={(event) => setPluginDataState({...pluginDataState, plugin_namespace: event.target.value})}
			/>
			
			<TextField
				label="Plugin Description"
				variant="outlined"
				fullWidth
				required
				value={pluginDataState.plugin_description}
				onChange={(event) => setPluginDataState({...pluginDataState, plugin_description: event.target.value})}
			/>

			<TextField
				label="Plugin Version"
				variant="outlined"
				fullWidth
				required
				value={pluginDataState.plugin_version}
				onChange={(event) => setPluginDataState({...pluginDataState, plugin_version: event.target.value})}
			/>

			<TextField
				label="Plugin Author"
				variant="outlined"
				fullWidth
				required
				value={pluginDataState.plugin_author}
				onChange={(event) => setPluginDataState({...pluginDataState, plugin_author: event.target.value})}
			/>

			<TextField
				label="Plugin Author URI"
				variant="outlined"
				fullWidth
				required
				value={pluginDataState.plugin_author_uri}
				onChange={(event) => setPluginDataState({...pluginDataState, plugin_author_uri: event.target.value})}
			/> */}
			<Box sx={{display: 'flex', gap: 2}}>
				<Button variant="contained" color="secondary" onClick={() => {
					onCancel();
				}}>
					Cancel
				</Button>
				<Button type="submit" variant="contained" color="primary">
					{saveButtonText}
				</Button>
			</Box>
		</Box>
	);
}
function TerminalWindow() {
	return (
		<Box sx={{
			width:'100%',
			height: '100%',
		}}>

		</Box>
	);
}

function PingGoogle() {
	const [response, setResponse] = useState(null);

	function runShellCommand() {
		fetch('/wp-json/pluginade/v1/ping-google')
			.then(response => response.json())
			.then(data => {
				setResponse(data);
			});
	}

	return <TerminalWindow />
}
