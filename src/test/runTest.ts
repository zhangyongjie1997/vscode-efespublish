import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
	try {
		// 插件的开发目录 src
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// 测试目录 suite
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath, extensionTestsPath });
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
