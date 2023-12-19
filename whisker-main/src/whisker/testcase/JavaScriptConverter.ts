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

import {WhiskerTest} from "../testgenerator/WhiskerTest";
import {Container} from "../utils/Container";
import {Randomness} from "../utils/Randomness";

export class JavaScriptConverter {

    private getTestBody(test: WhiskerTest) {
        let text = "";
        let position = 0;

        for (const {event} of test.chromosome.trace.events) {
            text += "  " + event.toJavaScript() + "\n";
            for (const assertion of test.getAssertionsAt(position)) {
                text += "  " + assertion.toJavaScript() + "\n";
            }
            position++;
        }
        text += "  t.end();\n";

        return text;
    }

    getText(test: WhiskerTest): string {
        let text = "const test = async function (t) {\n";
        text += this.getTestBody(test);
        text += `}

        module.exports = [
            {
                test: test,
                name: 'Generated Test',
                description: '',
                categories: [],
                generationAlgorithm: '${Container.config.getAlgorithm()}',
                seed: '${Randomness.getInitialRNGSeed()}'
            }
        ];`;
        return text;
    }

    getSuiteText(tests: WhiskerTest[]): string {
        // If we create a NE Suite, we have to set some configurations.
        const configs = {};
        if (Container.isNeuroevolution) {
            // Set necessary configuration parameter for re-executing the dynamic suite.
            configs['testSuiteType'] = 'dynamic';
            configs['timeout'] = Container.config.neuroevolutionProperties.timeout;
            configs['eventSelection'] = Container.config.neuroevolutionProperties.eventSelection;
            configs['seed'] = Container.config.getRandomSeed();

            const durationConfigs = {};
            durationConfigs['waitStepUpperBound'] = Container.config.getWaitStepUpperBound();
            durationConfigs['pressDurationUpperBound'] = Container.config.getPressDurationUpperBound();
            durationConfigs['soundDuration'] = Container.config.getSoundDuration();
            durationConfigs['clickDuration'] = Container.config.getClickDuration();
            configs['durations'] = durationConfigs;
        }

        // Generate static test suite.
        let text = "";
        let i = 0;
        let footer = "";
        const type = Container.isNeuroevolution ? 'neuroevolution' : 'standard';
        for (const test of tests) {
            text += `const test${i} = async function (t) {\n`;
            text += this.getTestBody(test);
            text += "}\n";

            footer += "  {\n";
            footer += "      test: test" + i + ",\n";
            footer += "      name: 'Generated Test',\n";
            footer += "      description: '',\n";
            footer += "      categories: [],\n";
            footer += `      generationAlgorithm: '${Container.config.getAlgorithm()}',\n`;
            footer += `      seed: '${Randomness.getInitialRNGSeed()}',\n`;
            footer += "      type: '" + type + "',\n";
            if (type === "neuroevolution") {
                footer += "      configs: " + JSON.stringify(configs) + ",\n";
            }
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

        if (Container.isNeuroevolution) {
            const testSuites = {};
            const networkJSON = {};
            networkJSON['Configs'] = configs;

            // Save the networks.
            const networkTestSuite = {};
            for (let i = 0; i < tests.length; i++) {
                networkTestSuite[`Network ${i}`] = tests[i].chromosome;
            }
            networkJSON['Networks'] = networkTestSuite;
            testSuites['Static'] = text;
            testSuites['Dynamic'] = networkJSON;
            return `{"Static":${JSON.stringify(testSuites['Static'])},"Dynamic":${JSON.stringify(testSuites['Dynamic'])}}`;
        }

        return text;
    }
}
