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
import {List} from "../utils/List";
import {WhiskerTest} from "../testgenerator/WhiskerTest";
import {Container} from "../utils/Container";

export class JavaScriptConverter {

    getText(test: TestChromosome): string {
        let text = "const test = async function (t) {\n";
        for (const [scratchEvent, args] of test.trace.events) {
            text += "  " + scratchEvent.toJavaScript() + "\n";
        }
        text += "  t.end();\n";
        text += `}

        module.exports = [
            {
                test: test,
                name: 'Generated Test',
                description: '',
                categories: []
            }
        ];`;
        return text;
    }

    getSuiteText(tests: List<WhiskerTest>): string {

        // If we want a dynamic test suite print out the networks instead of static test cases.
        if (Container.config.getTestSuiteType() === 'dynamic') {
            const networkTestSuite = {};
            for (let i = 0; i < tests.size(); i++) {
                networkTestSuite[`Network ${i}`] = tests.get(i).chromosome;
            }
            return JSON.stringify(networkTestSuite, undefined, 4);
        } else if (Container.config.getTestSuiteType() === 'static') {
            const eventTestSuite = {};
            for (let i = 0; i < tests.size(); i++) {
                const chromosome = tests.get(i).chromosome;
                const events = {};
                for (let j = 0; j < chromosome.trace.events.size(); j++) {
                    events[`Event ${j}`] = chromosome.trace.events.get(j)[0].toJSON();
                }
                eventTestSuite[`TestCase ${i}`] = events;
            }
            return JSON.stringify(eventTestSuite, undefined, 4);
        } else {
            let text = "";
            let i = 0;
            let footer = "";
            for (const test of tests) {
                text += "const test" + i + " = async function (t) {\n";
                for (const [scratchEvent, args] of test.chromosome.trace.events) {
                    text += "  " + scratchEvent.toJavaScript() + "\n";
                }
                text += "}\n";

                footer += "  {\n";
                footer += "      test: test" + i + ",\n";
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

            text += "\nmodule.exports = [\n";
            text += footer;
            text += "]\n";

            return text;
        }
    }
}
