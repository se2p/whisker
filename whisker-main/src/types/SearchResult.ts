import {BlockBasedTest} from "./BlockBasedTest";
import {TfAgentWrapper} from "../whisker/agentTraining/reinforcementLearning/agents/TfAgentWrapper";

export type SearchResult = {
    javaScriptText: string,
    summary: string,
    csvOutput: string,
    blockBasedTests: BlockBasedTest[],
    agentTests?: TfAgentWrapper[]
};
