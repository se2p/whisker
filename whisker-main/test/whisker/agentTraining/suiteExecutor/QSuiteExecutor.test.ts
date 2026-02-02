import {QSuiteExecutor} from "../../../../src/whisker/agentTraining/suiteExecutor/QSuiteExecutor";
import path from "path";
import {expect} from "@jest/globals";
import fs from "fs";
import JSZip from "jszip";

describe("Test RLSuiteExecutor", () => {
    it('test load agents', async () => {
        const agentsPath = path.join(__dirname, `./agents.zip`);
        const zip = await JSZip.loadAsync(fs.readFileSync(agentsPath));
        const agents = await QSuiteExecutor.parseAgents(zip);
        expect(agents.length).toBe(2);
    });
});
