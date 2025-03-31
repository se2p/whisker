import {BlockBasedTest} from "./BlockBasedTest";

export type SearchResult = {
    javaScriptText: string,
    summary: string,
    csvOutput: string,
    blockBasedTests: BlockBasedTest[]
};
