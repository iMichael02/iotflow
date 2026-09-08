---
name: ts-unit-test
description: TypeScript unit test skill. Use this when adding, updating, or running a unit test for a .ts or .tsx source file in this repository and when the repository needs a matching test file in the test folder structure.
---

# TypeScript Unit Test

Use this skill when a TypeScript source file needs a unit test, when a TypeScript unit test must be changed or when a TypeScript test should be verified against the repository conventions. All unit tests for TypeScript source files must be written in TypeScript using Vitest and follow the repository's test folder structure and naming conventions.

Do these things first and in this order:

1. Read the TypeScript source file and identify the exported symbol or behavior that needs coverage.
2. Create or update the test file in the repository's test folder structure.
3. Keep the test file naming and import path consistent with the folder structure.
4. Run the repository's TypeScript test command for the affected test file.
5. Only stop when the test command exits cleanly and the new test file follows the repository conventions.

Reference material:

- `package.json` test scripts
- `tsconfig.json` compiler and module resolution settings
- Existing tests in `tests/` or `src/**/__tests__/`
- Any test helper or fixture conventions used elsewhere in the repo

Folder structure for test files:

- Place a unit test inside test folder which is placed beside the source file's feature area in the repository test tree.
- If the repo uses a nested test tree, use the same nested area under `tests/` and keep one file per source file.
- Use the same file extension as the repo's existing test naming pattern (`.test.ts` or `.spec.ts`) and update only the test file for the selected source file.

Anything that applies only to some test paths should live in a separate file referenced from here, for example a fixture or wrapper file. Do not mix path-specific guidance into this skill file.

Completion criterion:

- Done only when the test file exists in the required folder structure for the TypeScript file under test.
- Done only when the test file imports the same source module path and uses the repo's test runner command.
- Done only when the test command exits with code 0 for the changed test file or for the relevant test suite.
- Not done if the test file is missing, mislocated, or not named to match the repository test convention.
