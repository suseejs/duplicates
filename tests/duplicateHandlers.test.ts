import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import type SuSee from "@suseejs/types";
import duplicateHandlers from "../src/index.js";

test("duplicateHandlers.renamed renames duplicate exports across index modules", async () => {
	const root = "/project";
	const deps: SuSee.DepsFile[] = [
		{
			file: `${root}/a/index.ts`,
			content: `const foo = () => 1;\nexport { foo };\n`,
		},
		{
			file: `${root}/b/index.ts`,
			content: `const foo = () => 2;\nexport { foo };\n`,
		},
		{
			file: `${root}/main.ts`,
			content: `import { foo } from "./a";\n` + `export const sum = foo();\n`,
		},
	];

	const namesMap: SuSee.DuplicatesNameMap = new Map();
	const callNameMap: SuSee.NamesSets = [];
	const importNameMap: SuSee.NamesSets = [];
	const exportNameMap: SuSee.NamesSets = [];
	const compilerOptions: ts.CompilerOptions = {
		module: ts.ModuleKind.ESNext,
		target: ts.ScriptTarget.ESNext,
	};

	const renamed = await duplicateHandlers.renamed(
		deps,
		namesMap,
		callNameMap,
		importNameMap,
		exportNameMap,
		compilerOptions,
	);

	const fileA = renamed.find((d) => d.file.endsWith("/a/index.ts"))?.content;
	const fileB = renamed.find((d) => d.file.endsWith("/b/index.ts"))?.content;
	const fileMain = renamed.find((d) => d.file.endsWith("/main.ts"))?.content;

	assert.ok(fileA?.includes("d_foo_1"));
	assert.ok(fileB?.includes("d_foo_2"));
	assert.ok(fileMain?.includes("import { d_foo_1 }"));
	assert.ok(fileMain?.includes("d_foo_1()"));
});
