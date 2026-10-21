const fs = require('fs');
const os = require('os');
const path = require('path');

// The HTTP API is tested without a browser: the CLI options, the pool of Whisker instances and the actual test
// execution are replaced by mocks.
jest.mock('../../src/cli', () => ({subcommand: 'api', opts: {port: 0, numberOfJobs: 1, verbose: 0}}));
jest.mock('../../src/whiskers', () => jest.fn());
jest.mock('../../src/common', () => ({runTests: jest.fn()}));

const {runTests} = require('../../src/common');
const {createApp} = require('../../src/api');

const whiskerResult = {
    summary: {
        project: [
            {test: {name: 'first test', index: 1, testResultClass: 'pass'}},
            {test: {name: 'second test', index: 2, testResultClass: 'fail'}},
        ],
    },
    coverage: {
        coveredBlockIdsPerSprite: new Map([['Stage', new Set(['a'])], ['Cat', new Set(['b'])]]),
        blockIdsPerSprite: new Map([['Stage', new Set(['a'])], ['Cat', new Set(['b', 'c'])]]),
    },
};

describe('Servant: Unit tests for the HTTP API', () => {

    let pool;
    let server;
    let url;
    let uploadedPaths;

    beforeEach(async () => {
        const fileSelect = {uploadFile: jest.fn(async (testPath) => uploadedPaths.push(testPath))};
        pool = {
            acquire: jest.fn(async () => ({page: {$: async () => fileSelect}})),
            release: jest.fn(async () => undefined),
        };

        uploadedPaths = [];
        runTests.mockReset();
        runTests.mockImplementation(async (whisker, projectPath) => {
            uploadedPaths.push(projectPath);
            return whiskerResult;
        });

        server = createApp(pool).listen(0);
        await new Promise((resolve) => server.once('listening', resolve));
        url = `http://localhost:${server.address().port}/test`;
    });

    afterEach(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    function postFiles(files) {
        const body = new FormData();
        for (const [field, content] of Object.entries(files)) {
            body.append(field, new Blob([content]), `${field}.bin`);
        }
        return fetch(url, {method: 'POST', body});
    }

    test('Reports test results and coverage', async () => {
        const response = await postFiles({project: 'sb3', testsuite: 'js'});

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            testResults: [
                {name: 'first test', index: 1, result: 'pass'},
                {name: 'second test', index: 2, result: 'fail'},
            ],
            coverage: {covered: 2, total: 3},
        });
        expect(pool.release).toHaveBeenCalledTimes(1);
    });

    test('Stores uploads in the temporary directory of the OS and deletes them afterwards', async () => {
        const response = await postFiles({project: 'sb3', testsuite: 'js'});
        await response.json();

        expect(uploadedPaths).toHaveLength(2);
        for (const uploadedPath of uploadedPaths) {
            expect(path.dirname(uploadedPath)).toBe(path.normalize(os.tmpdir()));
            expect(fs.existsSync(uploadedPath)).toBe(false);
        }
    });

    test('Rejects requests with missing files', async () => {
        const response = await postFiles({project: 'sb3'});

        expect(response.status).toBe(400);
        expect((await response.json()).message).toContain('testsuite');
        expect(pool.acquire).not.toHaveBeenCalled();
    });

    test('Rejects files that exceed the size limit instead of truncating them', async () => {
        const response = await postFiles({project: Buffer.alloc(50 * 1024 * 1024 + 1), testsuite: 'js'});

        expect(response.status).toBe(413);
        expect(runTests).not.toHaveBeenCalled();
    }, 30000);

    test('Includes the error message when Whisker crashes', async () => {
        runTests.mockRejectedValue(new Error('Scratch VM exploded'));

        const response = await postFiles({project: 'sb3', testsuite: 'js'});

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({message: 'Whisker crashed', error: 'Error: Scratch VM exploded'});
        expect(pool.release).toHaveBeenCalledTimes(1);
    });
});
