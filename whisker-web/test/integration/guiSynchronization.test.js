const {assertNoPageCrash, loadProject, openWhiskerPage, uploadFile} = require('../utils/whisker-gui');

beforeEach(async () => {
    await openWhiskerPage();
});

test('uploads wait for delayed project loading before loading block-based tests', async () => {
    await page.evaluate(() => {
        const vm = window.Whisker.scratch.vm;
        const originalLoad = vm.loadProject.bind(vm);
        window.pendingProjectLoads = 0;
        window.maximumProjectLoads = 0;
        vm.loadProject = async project => {
            window.pendingProjectLoads++;
            window.maximumProjectLoads = Math.max(window.maximumProjectLoads, window.pendingProjectLoads);
            try {
                await new Promise(resolve => setTimeout(resolve, 300));
                return await originalLoad(project);
            } finally {
                window.pendingProjectLoads--;
            }
        };
    });
    const project = 'test/integration/blockBasedTesting/bbt-tests.sb3';
    await loadProject(project);
    expect(await page.evaluate(() => window.pendingProjectLoads)).toBe(0);
    await uploadFile('#fileselect-tests', project);
    expect(await page.evaluate(() => window.pendingProjectLoads)).toBe(0);
    expect(await page.evaluate(() => window.maximumProjectLoads)).toBe(1);
    expect(await page.evaluate(() => window.Whisker.bbtTests.size)).toBe(4);
});

test('resetting the GUI closes the previous context and retains the managed page', async () => {
    const previousContext = page.browserContext();
    await openWhiskerPage();
    expect(previousContext.closed).toBe(true);
    expect(await page.browserContext().pages()).toHaveLength(1);
});

test('renderer crashes reach the shared teardown check with their original error', () => {
    const error = new Error('renderer crash regression');
    page.emit('error', error);
    expect(assertNoPageCrash).toThrow(error);
});
