/*
 * Copyright (C) 2020 Whisker contributors
 *
 * This file is part of the Whisker test generator for Scratch.
 *
 * Whisker is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Whisker is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Whisker. If not, see http://www.gnu.org/licenses/.
 *
 */

import {TestChromosome} from "./TestChromosome";
import {TestExecutor} from "./TestExecutor";
import {EventObserver} from "./EventObserver";
import {ScratchEvent} from "./ScratchEvent";
import {WaitEvent} from "./events/WaitEvent";
import {List} from "../utils/List";
import {WhiskerTest} from "../testgenerator/WhiskerTest";

export class JavaScriptConverter implements EventObserver {

    private text = "";

    private executor: TestExecutor;

    constructor(executor: TestExecutor) {
        this.executor = executor;
    }

    getText(test: TestChromosome): string {
        this.text = "const test = async function (t) {\n";
        this.executor.attach(this);
        this.executor.execute(test);
        this.executor.detach(this);
        this.text += `}

        module.exports = [
            {
                test: test,
                name: 'Generated Test',
                description: '',
                categories: []
            }
        ];`;
        return this.text;
    }

    getSuiteText(tests: List<WhiskerTest>): string {

        let i = 0;
        let footer = "";
        for (const test of tests) {
            this.text += "const test"+i+" = async function (t) {\n";
            this.executor.attach(this);
            this.executor.execute(test.chromosome);
            this.executor.detach(this);
            this.text += "}\n";

            footer += "  {\n";
            footer += "      test: test"+i+",\n";
            footer += "      name: 'Generated Test',\n";
            footer += "      description: '',\n";
            footer += "      categories: []\n";
            if (i < tests.size() - 1) {
                footer += "  },\n";
            } else {
                footer += "  }\n";
            }

            i++;
        }

        this.text += "module.exports = [\n";
        this.text += footer;
        this.text += "]\n";

        return this.text;
    }

    update(event: ScratchEvent, args: number[]) {
        this.text += "  " + event.toJavaScript(args) + "\n";
        this.text += "  " + new WaitEvent().toJavaScript([]) + "\n";
    }
}
