import fs from "fs";
import path from "path";
import {TestRunner} from "../../../../src";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import makeTestStorage from "scratch-vm/test/fixtures/make-test-storage";

test("Run a Whisker test in a preloaded VM", async () => {

    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);

    const projectUri = path.join(__dirname, 'left-arrow-right-arrow.sb3');
    const project = Buffer.from(fs.readFileSync(projectUri));

    await vm.loadProject(project);

    const testsUri = path.join(__dirname, 'SmallWhiskerTests.js');
    const testsText = fs.readFileSync(testsUri, 'utf8');
    const tests = eval(`
        (function () {
            const module = Object.create(null);
            ${testsText};
            return module.exports;
        })();
    `);

    const testRunner: TestRunner = new TestRunner();

    const result0 = await testRunner.runTestInPreloadedVM(vm, tests[0]);
    const result1 = await testRunner.runTestInPreloadedVM(vm, tests[1]);

    vm.quit();

    expect(result0.status).toBe('pass');
    expect(result1.status).toBe('pass');
});
