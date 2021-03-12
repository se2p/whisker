import subprocess
import os
import pandas as pd
import numpy as np


def evaluate(projects, config_file, runs):

    os.chdir("../../../../../")

    for p in projects:

        # Set up Names
        project_name = p.replace(".sb3", "")
        target_directory = "./whisker-main/src/whisker/NEAT/EvaluationScripts/" + project_name + "NetworkFitness"

        # Create the directory for the project to store the results in.
        if not os.path.isdir(target_directory):
            os.mkdir(target_directory)

        # Execute the NEAT-Algorithm several times and save the output as CSV file and the tests in their directories
        for x in range(1, runs + 1):
            cmd = "node ./servant/servant.js "
            cmd += "-s ./testProjects/" + p + " "
            cmd += "-c ./config/" + config_file + " "
            cmd += "-u ./whisker-web/dist/index.html "
            cmd += "-a 10 -g -l -k -d"
            print(cmd)
            output = str(subprocess.run(cmd, capture_output=True, shell=True).stdout)
            output = output.replace('\\n', "\n")

            # Extract the required information
            network_fitness = []
            iteration = []
            filter_network_fitness = 'Highest Network Fitness:'
            filter_iteration = 'Iteration:'
            for line in output.splitlines():
                line = line.strip().strip('INFO:').strip().strip("Forwarded:").strip()
                if line.startswith("".join(filter_iteration)):
                    iteration.append(line.strip("".join(filter_iteration)).strip())
                if line.startswith("".join(filter_network_fitness)):
                    network_fitness.append(line.strip("".join(filter_network_fitness)).strip())
            network_fitness = np.asarray(network_fitness)
            iteration = np.asarray(iteration)

            # Save the results in a CSV File
            target_path_csv = target_directory + "/" + project_name + str(x) + ".csv"
            dataframe = pd.DataFrame({'Network Fitness': network_fitness})
            dataframe.insert(0, 'Iteration', iteration)
            dataframe.to_csv(target_path_csv)

            print("Finished: " + project_name + " Round " + str(x))





score_projects = ["Archery.sb3", "Balloons.sb3", "BeatTheGoalie.sb3", "ChatBot.sb3", "GreenYourCity.sb3"]
create_your_own_word = ["CreateYourOwnWorld.sb3"]
fruit_catcher = ["FruitCatcher.sb3"]
survive_projects = ["SpaceJunk.sb3", "FruitCatcher.sb3"]
space_junk = ["SpaceJunk.sb3"]
memory = ["Memory.sb3"]

survive_config = "surviveNeuroevolution.json"
score_config = "scoreNeuroevolution.json"

evaluate(fruit_catcher, survive_config, 10)
