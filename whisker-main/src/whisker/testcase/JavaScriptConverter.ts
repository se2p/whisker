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
import {WhiskerTest} from "../testgenerator/WhiskerTest";
import {Container} from "../utils/Container";

export class JavaScriptConverter {

    getText(test: TestChromosome): string {
        let text = "const test = async function (t) {\n";
        for (const {event} of test.trace.events) {
            text += "  " + event.toJavaScript() + "\n";
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

    getSuiteText(tests: WhiskerTest[]): string {
        // Generate dynamic test suite.
        if (Container.config.getTestSuiteType() === 'dynamic') {
            const testJSON = {}

            // Set necessary configuration parameter for re-executing the dynamic suite.
            const configs = {}
            configs['testSuiteType'] = 'dynamic'
            configs['timeout'] = Container.config.neuroevolutionProperties.timeout;
            configs['networkFitness'] = Container.config.neuroevolutionProperties.networkFitness.toParameterIdentifier();
            configs['eventSelection'] = Container.config.neuroevolutionProperties.eventSelection;
            configs['seed'] = Container.config.getRandomSeed();
            configs['repetitions'] = Container.config.neuroevolutionProperties.repetitions;

            const durationConfigs = {}
            durationConfigs['waitStepUpperBound'] = Container.config.getWaitStepUpperBound();
            durationConfigs['pressDurationUpperBound'] = Container.config.getPressDurationUpperBound();
            durationConfigs['soundDuration'] = Container.config.getSoundDuration();
            durationConfigs['clickDuration'] = Container.config.getClickDuration();
            configs['durations'] = durationConfigs;

            testJSON['Configs'] = configs

            // Save the networks.
            const networkTestSuite = {};
            for (let i = 0; i < tests.length; i++) {
                networkTestSuite[`Network ${i}`] = tests[i].chromosome;
            }
            testJSON['Networks'] = networkTestSuite;
            return JSON.stringify(testJSON);
        }
        // Generate static test suite.
        else {
            let text = "";
            let i = 0;
            let footer = "";
            for (const test of tests) {
                text += "const test" + i + " = async function (t) {\n";
                for (const {event} of test.chromosome.trace.events) {
                    text += "  " + event.toJavaScript() + "\n";
                }
                text += "}\n";

                footer += "  {\n";
                footer += "      test: test" + i + ",\n";
                footer += "      name: 'Generated Test',\n";
                footer += "      description: '',\n";
                footer += "      categories: []\n";
                if (i < tests.length - 1) {
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
