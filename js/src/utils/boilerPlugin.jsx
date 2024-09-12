export default async function boilerPlugin() {
	return {
        ".distignore": {
            "file": {
                "contents": "wpps-scripts\n.pluginade\n.distignore\n.git\n.gitignore\nwporg\nnode_modules\ncss/src\njs/src\ntests\npackage.json\npackage-lock.json\n.nvmrc\nwebpack.config.js\ntsconfig.json\n.circleci\n.github\ncomposer.json\ncomposer.lock\npostcss.config.js\n.DS_Store\n.vscode\nzips\n"
            }
        },
        ".github": {
            "directory": {
                "workflows": {
                    "directory": {
                        "test-and-build.yml": {
                            "file": {
                                "contents": "name: Test and Build\n\non: [push]\n\njobs:\n  lint-php:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout code\n        uses: actions/checkout@v2\n        with:\n          path: plugins/sample-plugin\n\n      - name: Installing Pluginade\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh install\n\n      - name: Linting PHP\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh lint:php\n\n  lint-js:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout code\n        uses: actions/checkout@v2\n        with:\n          path: plugins/sample-plugin\n\n      - name: Installing Pluginade\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh install\n\n      - name: Linting JS\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh lint:js\n\n  lint-css:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout code\n        uses: actions/checkout@v2\n        with:\n          path: plugins/sample-plugin\n\n      - name: Installing Pluginade\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh install\n\n      - name: Linting CSS\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh lint:css\n\n  test-js:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout code\n        uses: actions/checkout@v2\n        with:\n          path: plugins/sample-plugin\n\n      - name: Installing Pluginade\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh install\n\n      - name: Testing JS\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh test:js\n\n  phpunit:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout code\n        uses: actions/checkout@v2\n        with:\n          path: plugins/sample-plugin\n\n      - name: Installing Pluginade\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh install\n\n      - name: PHPUnit Integration Tests\n        working-directory: plugins/sample-plugin\n        run: |\n          sh pluginade.sh build\n          sh pluginade.sh test:phpunit\n\n  zip:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout code\n        uses: actions/checkout@v2\n        with:\n          path: plugins/sample-plugin\n\n      - name: Installing Pluginade\n        working-directory: plugins/sample-plugin\n        run: sh pluginade.sh install\n\n      - name: Creating the zip file\n        working-directory: plugins/sample-plugin\n        run: |\n          sh pluginade.sh build\n          sh pluginade.sh zip\n\n      - name: Upload artifacts\n        uses: actions/upload-artifact@v2\n        with:\n          name: pluginade-artifacts\n          path: /home/runner/work/your-repo-name/your-repo-name/plugins/sample-plugin\n"
                            }
                        }
                    }
                }
            }
        },
        ".gitignore": {
            "file": {
                "contents": "node_modules\n.DS_Store\nbuild\n/vendor\n*.zip\n/.pluginade\n"
            }
        },
        "pluginade.sh": {
            "file": {
                "contents": "#!/bin/bash\n\n# This file lives in the root of a plugin directory to enable pluginade commands.\n\n# Set this to the version of pluginade-scripts you want to use.\n# For a list of available versions, see https://github.com/pluginade/pluginade-scripts/tags\npluginadeversion=\"0.0.3-beta-8\";\n\n# Change the following variables to your plugin's namespace and textdomain:\ntextdomain=\"sample-plugin\";\nnamespace=\"SamplePlugin\";\n\n# Dont make any more edits below this line.\n\n# Check if an argument is provided\nif [ -z \"$1\" ]; then\n\t# If no argument is provided, show help text.\n\techo \"Usage: sh pluginade.sh <The pluginade command you want to run>\"\n\techo \"See all available commands at:\"\n\techo \"https://github.com/pluginade/pluginade-scripts/blob/$pluginadeversion/available-commands.md\"\n\texit 1\nfi\n\n#  Set the plugin directory to be the current directory.\nplugindir=$PWD;\n\n#  Install pluginade-scripts if they are not already installed.\ninstall_pluginade() {\n\tif [ ! -d ./pluginade ]; then\n\t\techo \"Installing pluginade into ${plugindir}/.pluginade\";\n\t\tgit clone https://github.com/pluginade/pluginade-scripts ./.pluginade\n\t\tcd .pluginade && git fetch --tags && git reset --hard && git checkout $pluginadeversion && git pull origin $pluginadeversion\n\tfi\n}\n\nif [ $1 = 'install' ]; then\n\tinstall_pluginade;\n\texit 0;\nfi\n\n# Prior to running any command, ensure pluginade is ready.\ninstall_pluginade;\n\n# Go to the pluginade directory inside the plugin.\necho \"Going to ${plugindir}/.pluginade\";\ncd \"$plugindir\"/.pluginade;\n\n# Pass this command to pluginade-run.sh\nsh pluginade-run.sh -p \"${plugindir}\" -c $1 -t $textdomain -n $namespace;\nexit $?;\n"
            }
        },
        "sample-plugin.php": {
            "file": {
                "contents": "<?php\n/**\n * Plugin Name: Sample Plugin\n * Plugin URI: pluginade.com\n * Description: A sample plugin which demonstrates how to build a plugin with Pluginade.\n * Version: 0.0.0\n * Author: Pluginade\n * Text Domain: sample-plugin\n * Domain Path: languages\n * License: GPLv2\n * License URI: http://www.gnu.org/licenses/gpl-2.0.txt\n * Requires at least: 6.0\n * Requires PHP: 7.4\n * Network:\n * Update URI:\n * Namespace: SamplePlugin\n *\n * @package pluginade-sample\n */\n\nnamespace SamplePlugin;\n\n// Exit if accessed directly.\nif ( ! defined( 'ABSPATH' ) ) {\n\texit;\n}\n\n/**\n * Automatically include wp modules, which are in the \"wp-modules\" directory.\n *\n * @return void\n */\nfunction include_custom_modules() {\n\t$wp_modules = glob( plugin_dir_path( __FILE__ ) . 'wp-modules*/*' );\n\n\tforeach ( $wp_modules as $wp_module ) {\n\t\t$module_name = basename( $wp_module );\n\t\t$filename    = $module_name . '.php';\n\t\t$filepath    = $wp_module . '/' . $filename;\n\n\t\tif ( is_readable( $filepath ) ) {\n\t\t\t// If the module data exists, load it.\n\t\t\trequire $filepath;\n\t\t} else {\n\t\t\t// Translators: The name of the module, and the filename that needs to exist inside that module.\n\t\t\techo esc_html( sprintf( __( 'The module called \"%1$s\" has a problem. It needs a file called \"%2$s\" to exist in its root directory.', 'sample-plugin' ), $module_name, $filename ) );\n\t\t\texit;\n\t\t}\n\t}\n}\nadd_action( 'plugins_loaded', __NAMESPACE__ . '\\include_custom_modules' );\n"
            }
        },
        "wp-modules": {
            "directory": {
                "sample-module-1": {
                    "directory": {
                        "js": {
                            "directory": {
                                "src": {
                                    "directory": {
                                        "index.js": {
                                            "file": {
                                                "contents": "console.log( 'sample module 1' );\n"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "package-lock.json": {
                            "file": {
                                "contents": "{\n  \"name\": \"sample-module-1\",\n  \"version\": \"1.0.0\",\n  \"lockfileVersion\": 1\n}\n"
                            }
                        },
                        "package.json": {
                            "file": {
                                "contents": "{\n\t\"name\": \"sample-module-1\",\n\t\"version\": \"1.0.0\",\n\t\"description\": \"\",\n\t\"main\": \"index.js\",\n\t\"scripts\": {\n\t\t\"build\": \"wp-scripts build js/src/index.js --output-path=js/build/\",\n\t\t\"dev\": \"wp-scripts start js/src/index.js --output-path=js/build/\"\n\t},\n\t\"devDependencies\": {\n\t\t\"@wordpress/scripts\": \"^26.11.0\"\n\t},\n\t\"dependencies\": {\n\t\t\"react\": \"^18.1.0\"\n\t},\n\t\"keywords\": [],\n\t\"author\": \"\",\n\t\"license\": \"ISC\"\n}\n"
                            }
                        },
                        "sample-module-1.php": {
                            "file": {
                                "contents": "<?php\n/**\n * Module Name: Sample Module 1\n * Description: A sample module for pluginade.\n * Namespace: SampleModule1\n *\n * @package sample-plugin\n */\n\ndeclare(strict_types=1);\n\nnamespace SamplePlugin\\SampleModule1;\n\n// Exit if accessed directly.\nif ( ! defined( 'ABSPATH' ) ) {\n\texit;\n}\n"
                            }
                        }
                    }
                },
                "sample-module-2": {
                    "directory": {
                        "js": {
                            "directory": {
                                "src": {
                                    "directory": {
                                        "index.js": {
                                            "file": {
                                                "contents": "console.log( 'sample module 2' );\n"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "package-lock.json": {
                            "file": {
                                "contents": "{\n  \"name\": \"sample-module-2\",\n  \"version\": \"1.0.0\",\n  \"lockfileVersion\": 1\n}\n"
                            }
                        },
                        "package.json": {
                            "file": {
                                "contents": "{\n  \"name\": \"sample-module-2\",\n  \"version\": \"1.0.0\",\n  \"description\": \"\",\n  \"main\": \"index.js\",\n\t\"scripts\": {\n\t\t\"build\": \"wp-scripts build js/src/index.js --output-path=js/build/\",\n\t\t\"dev\": \"wp-scripts start js/src/index.js --output-path=js/build/\"\n\t},\n\t\"devDependencies\": {\n\t\t\"@wordpress/scripts\": \"^26.11.0\"\n\t},\n  \"dependencies\": {\n    \"react\": \"^18.1.0\",\n    \"@mui/material\": \"^5.14.5\"\n  },\n  \"keywords\": [],\n  \"author\": \"\",\n  \"license\": \"ISC\"\n}\n"
                            }
                        },
                        "sample-module-2.php": {
                            "file": {
                                "contents": "<?php\n/**\n * Module Name: Sample Module 2\n * Description: A sample module for pluginade.\n * Namespace: SampleModule2\n *\n * @package sample-plugin\n */\n\ndeclare(strict_types=1);\n\nnamespace SamplePlugin\\SampleModule2;\n\n// Exit if accessed directly.\nif ( ! defined( 'ABSPATH' ) ) {\n\texit;\n}\n"
                            }
                        }
                    }
                }
            }
        }
    }
}