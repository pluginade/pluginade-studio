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

import FileMenu from './menuFile';
import EditMenu from './menuEdit';

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
			default: 'rgba(59, 74, 89, 0.2)',
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
		let actuallyOpenPlugins = actuallyOpenPlugins.filter( item => item != entry[1]);
	}
} );

function PluginadeApp() {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
	const [showCreatePlugin, setShowCreatePluginState] = useState(false);
	const [pluginDirHandles, setPluginDirHandles] = useState(thePluginDirHandles);
	const [plugins, setPlugins] = useState({});
	const [currentPluginTab, setCurrentPluginTabState] = useState( null );

	useEffect( () => {
		actuallyOpenPlugins.forEach( async (plugin) => {
			const directoryHandleOrUndefined = await get(plugin);
			if ( directoryHandleOrUndefined ) {
				openPlugin( directoryHandleOrUndefined );
			} else {
				openPlugin( null );
			}
		} );
	}, []);

	useEffect(() => {
		window.localStorage.setItem('pluginadePlugins', JSON.stringify(Object.keys(plugins)));
	}, [plugins]);

	function setCurrentPluginTab(value) {
		// Make sure we have permission to use the file system for each open plugin.
		Object.keys( plugins ).forEach( async (plugin) => {
			const directoryHandleOrUndefined = await get(plugin);
			if (directoryHandleOrUndefined) {
				window.localStorage.setItem('currentPluginTab', value);
				setCurrentPluginTabState(value);
				setShowCreatePluginState(false);
			} else {
				const directoryHandle = await window.showDirectoryPicker( { mode: 'readwrite' });
				await set(plugin, directoryHandle);

				window.localStorage.setItem('currentPluginTab', value);
				setCurrentPluginTabState(value);
				setShowCreatePluginState(false);
			}
		});
	}

	function setShowCreatePlugin(value) {
		if ( value ) {
			setCurrentPluginTabState( null );
		}
		setShowCreatePluginState(value);
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

				await set(pluginData.plugin_dirname, dirHandle);

				setPlugins((nonStalePlugins) => {
					return {
						...nonStalePlugins,
						[pluginData.plugin_dirname]: {
							...pluginData,
						}
					};
				});
			}
		}
		// if ( ! isWpPlugin ) {
		// 	alert('Make sure the main plugin file is named the same as the directory and is a .php file.');
		// }
	}

	return (
		<ThemeProvider theme={prefersDarkMode ? DarkTheme : DarkTheme}>
			<CssBaseline />
			<Box className="pluginade-studio" sx={{
				display: 'grid',
				gridTemplateRows: 'min-content min-content 1fr'
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
				</Box>
				<Divider />
				<Box className="pluginade-studio-body" sx={{
					display: 'grid',
					gridTemplateColumns: '200px min-content 1fr'
				}}>
					<CssBaseline />
					<Box sx={{backgroundColor: 'background20.default'}}>
						<List>
							{
								Object.keys( plugins ).map((plugin, index) => {
									return <ListItem disablePadding>
										<ListItemButton selected={currentPluginTab === plugin} onClick={() => setCurrentPluginTab(plugin)}>
											<ListItemText primary={plugins[plugin].plugin_name} />
										</ListItemButton>
									</ListItem>
								})
							}
						</List>
					</Box>
					<Divider orientation="vertical" />
					<Box sx={{display: (showCreatePlugin ? 'none' : 'grid'), height: '100%', overflow: 'hidden'}}>
							{
								Object.keys( plugins ).map((plugin, index) => {
									const currentPluginSlug = plugin;

									return <Plugin plugins={plugins} setPlugins={setPlugins} currentPluginSlug={currentPluginSlug} hidden={currentPluginSlug !== currentPluginTab } />
								})
							}
						<TerminalWindow />
					</Box>
					<Box className="create-plugin" sx={{display: (showCreatePlugin ? 'grid' : 'none'), height: '100%', width: '100%', overflow: 'auto', alignItems: 'center', justifyItems: 'center' }}>
						<CreatePlugin uponSuccess={(newPluginSlug) => setCurrentPluginTab(newPluginSlug)} plugins={plugins} setPlugins={setPlugins} />
					</Box>
				</Box>
			</Box>
		</ThemeProvider>
	);
}
root.render(<PluginadeApp />);

function CreatePlugin({plugins, setPlugins, uponSuccess}) {
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

	async function createPlugin(setLoading) {
		try {
			setCreationState('creating');
			setCreationMessage('');
			const result = await fetch(pluginadeApiEndpoints.generatePlugin, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(pluginDataState),
			});
			
			if ( ! result.ok ) {
				const data = await result.json();
				throw new Error(data?.message ? data.message : 'Error creating plugin');
			}

			const data = await result.json();
			
			setLoading(false);
			setCreationState('success');
			setCreationMessage(data.message);
			setPlugins(data.plugins);
			setTimeout(() => {
				uponSuccess(data.newPluginSlug);
			}, 1000);
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
		
		<Box sx={{display: 'grid', width: '100%', height: '100%', overflow: 'auto', alignItems: 'center', justifyItems: 'center'}}>
			<PluginDataForm pluginDataState={pluginDataState} setPluginDataState={setPluginDataState} onSubmit={(event, setLoading)=>{
				event.preventDefault();
				createPlugin(setLoading);
			}} />
		</Box>
	</Box>
}

function Plugin({plugins, setPlugins, currentPluginSlug, hidden}) {
	const pluginDataState = plugins[currentPluginSlug];
	const [currentTab, setCurrentTab] = useState('modules');

	const pluginTabs = {
		'modules': 'Modules',
		'webpack': 'Webpack',
		'phpunit': 'PHPUnit',
		'scans': 'Scans',
		'fixers': 'Fixers',
	}

	return (
		<Box id={`plugin-tabpanel-${pluginDataState.plugin_dirname}`} sx={{display: (hidden ? 'none' : 'grid'), gridTemplateRows: 'min-content min-content 1fr', height: '100%', overflow: 'hidden'}}>
			<Box className="plugin-header" sx={{display: 'grid'	, gridTemplateRows: 'min-content min-content'}}>
				<Box sx={{padding: 2}}>
					<Typography variant="h5" component="h2">{pluginDataState.plugin_name}</Typography>
					<Box>{pluginDataState.plugin_path}</Box>
				</Box>
				<Tabs className="plugin-control-tabs" value={currentTab} onChange={(event, newValue) => {setCurrentTab(newValue)}} aria-label="Plugins Tools" variant="scrollable">
					{
						Object.keys( pluginTabs ).map((tool, index) => {
							return <Tab value={tool} label={pluginTabs[tool]} {...a11yProps(tool)} />
						})
					}
				</Tabs>
			</Box>
			<Divider />
			<Box className="plugin-content" sx={{display: 'block', height: '100%', overflow: 'hidden'}}>
				<Box id={`plugin-tabpanel-webpack`} sx={{display: 'webpack' === currentTab ? 'flex' : 'none', gap: 2, padding: 2}}>
					<Box sx={{display: 'grid', gap: 2}}>
						<Box>
							<Typography component="p">{__( 'To enable webpack and watch for file changes, run the following in a terminal window:')}</Typography>
						</Box>
						<CopyCode language="shell" code={`
						sh pluginade.sh dev;
						`} />
					</Box>
				</Box>
				<Box id={`plugin-tabpanel-phpunit`} sx={{display: 'phpunit' === currentTab ? 'flex' : 'none', gap: 2, padding: 2}}>
					<Box sx={{display: 'grid', gap: 2}}>
						<Box>
							<Typography component="p">{__( 'To run PHPUnit tests run the following in a terminal window:')}</Typography>
						</Box>
						<CopyCode language="bash" code={`sh pluginade.sh test:phpunit;`} />
					</Box>
				</Box>
				<Box id={`plugin-tabpanel-scans`} sx={{display: 'scans' === currentTab ? 'grid' : 'none', gap: 2, padding: 2}}>
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
							return <ListItem disablePadding>
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

function parsePluginHeader(pluginHeader) {
    const result = {};
    const regex = /(\*|\/)\s*(\w[\w\s-]+):\s*([\w\s:\/\.\-\@]+)/g;
    let match;

    while ((match = regex.exec(pluginHeader)) !== null) {
        const key = match[2].trim().replace(/\s+/g, '_').toLowerCase();
        const value = match[3].trim();
        result[key] = value;
    }

    return result;
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

	async function createPlugin(setLoading) {
		try {
			setCreationState('creating');
			setCreationMessage('');
			const result = await fetch(pluginadeApiEndpoints.generatePlugin, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(pluginDataState),
			});
			
			if ( ! result.ok ) {
				const data = await result.json();
				throw new Error(data?.message ? data.message : 'Error creating plugin');
			}

			const data = await result.json();
			
			setLoading(false);
			setCreationState('success');
			setCreationMessage(data.message);
			setPlugins(data.plugins);
			setTimeout(() => {
				uponSuccess(data.newPluginSlug);
			}, 1000);
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
					onChange={(event) => setPluginDataState({...pluginDataState, plugin_name: event.target.value})}
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
					{creationState === 'creating' ? <CircularProgress size={24} /> : 'Update plugin files' }
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

function PluginDataForm({pluginDataState, setPluginDataState, onSubmit}) {
	const [loading, setLoading] = useState(false);

	return (
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
				onChange={(event) => setPluginDataState({...pluginDataState, plugin_name: event.target.value})}
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
				{loading ? <CircularProgress size={24} /> : 'Update plugin files' }
			</Button>
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
