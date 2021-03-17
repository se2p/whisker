import subprocess
import os
import pandas as pd
import numpy as np


def evaluate(projects, config_file, runs):
    os.chdir("../../../../../")

    for p in projects:

        # Set up Names
        project_name = p.replace(".sb3", "")
        target_directory_project = "./whisker-main/src/whisker/NEAT/EvaluationScripts/ResultsRandom/" + project_name + "Survive"
        target_directory_coverage = target_directory_project + "/Coverage"
        # target_directory_tests = target_directory_project + "/Tests"
        target_directory_network_fitness = target_directory_project + "/NetworkFitness"

        # Create the directory for the project to store the results in
        if not os.path.isdir(target_directory_project):
            os.mkdir(target_directory_project)
        if not os.path.isdir(target_directory_coverage):
            os.mkdir(target_directory_coverage)
        # if not os.path.isdir(target_directory_tests):
        # os.mkdir(target_directory_tests)
        if not os.path.isdir(target_directory_network_fitness):
            os.mkdir(target_directory_network_fitness)

        # Execute the NEAT-Algorithm several times and save the output as CSV file and the tests in their directories
        for x in range(1, runs + 1):
            cmd = "node ./servant/servant.js "
            cmd += "-s ./testProjects/" + p + " "
            cmd += "-c ./config/" + config_file + " "
            cmd += "-u ./whisker-web/dist/index.html "
            cmd += "-g -l -k -d"
            print(cmd)
            output = str(subprocess.run(cmd, capture_output=True, shell=True).stdout)
            output = output.replace('\\n', "\n")

            # Extract the required information
            csv_output = ""
            found = 0
            iteration = []
            highest_network_fitness = []
            average_network_fitness = []
            current_highest_network_fitness = []
            filter_highest_network_fitness = 'Highest Network Fitness:'
            filter_average_network_fitness = 'Average Fitness:'
            filter_current_highest_network_fitness = 'Current Iteration Highest Network Fitness:'
            filter_iteration = 'Iteration:'
            for line in output.splitlines():
                line = line.strip().strip('INFO:').strip().strip("Forwarded:").strip()
                if line.startswith('fitness') or found == 1:
                    csv_output += (line + "\n")
                    found += 1
                if line.startswith("".join(filter_iteration)):
                    iteration.append(line.strip("".join(filter_iteration)).strip())
                if line.startswith("".join(filter_highest_network_fitness)):
                    highest_network_fitness.append(line.strip("".join(filter_highest_network_fitness)).strip())
                if line.startswith("".join(filter_average_network_fitness)):
                    average_network_fitness.append(line.strip("".join(filter_average_network_fitness)).strip())
                if line.startswith("".join(filter_current_highest_network_fitness)):
                    current_highest_network_fitness.append(
                        line.strip("".join(filter_current_highest_network_fitness)).strip())

            iteration = np.asarray(iteration)
            highest_network_fitness = np.asarray(highest_network_fitness)
            average_network_fitness = np.asarray(average_network_fitness)
            current_highest_network_fitness = np.asarray(current_highest_network_fitness)

            # Save the Coverage Results in a CSV file
            target_path_csv = target_directory_coverage + "/CoverageRun" + str(x) + ".csv"
            with open(target_path_csv, "w") as csvFile:
                csvFile.write(csv_output)

            # Save the network Fitness results in a CSV File
            target_path_csv = target_directory_network_fitness + "/NetworkFitnessRun" + str(x) + ".csv"
            dataframe = pd.DataFrame({'Highest Network Fitness': highest_network_fitness,
                                      'Iteration Highest Network Fitness': current_highest_network_fitness,
                                      'Average Network Fitness': average_network_fitness})
            dataframe.insert(0, 'Iteration', iteration)
            dataframe.to_csv(target_path_csv)

            # Save the Generated test file
            # os.rename("tests.js", target_directory_tests + "/Test" + str(x) + ".js")

            print("Finished: " + project_name + " Round " + str(x))

        # Merge the Rounds of the resulting Coverage into one CSV File
        starting_csv_path = target_directory_coverage + "/CoverageResults.csv"
        if os.path.isfile(starting_csv_path):
            start_csv = pd.read_csv(starting_csv_path)
            for x in range(2, runs + 1):
                path_to_combine_csv = target_directory_coverage + "/CoverageRun" + str(x) + ".csv"
                combine_csv = pd.read_csv(path_to_combine_csv)
                start_csv = pd.concat([start_csv, combine_csv])

                os.remove(path_to_combine_csv)

            start_csv.insert(0, "Round", [x for x in range(1, runs + 1)])
            start_csv.to_csv(target_directory_coverage + "/CoverageResults" + project_name + ".csv", index=False)
            os.remove(starting_csv_path)


score_projects_acc = ["Archery.sb3", "Balloons.sb3", "BeatTheGoalie.sb3", "BoatRace.sb3", "BrainGame.sb3",
                      "CatchTheDots.sb3", "ChatBot.sb3", "CloneWars.sb3", "CYOW-SpeedBoost.sb3", "Dodgeball.sb3",
                      "FruitCatcher.sb3", "Ghostbusters.sb3", "GreenYourCity.sb3", "LostInSpace.sb3", "Memory.sb3",
                      "MoonhackScratch2017.sb3", "RockBand.sb3", "Sprint.sb3", "SynchronisedSwimming.sb3",
                      "TechToys.sb3", "UsernameGenerator.sb3"]
score_projects = ["PoetryGenerator.sb3"]
create_your_own_word = ["CreateYourOwnWorld.sb3"]
fruit_catcher = ["FruitCatcher.sb3"]
survive_projects = []
space_junk = ["SpaceJunk.sb3"]
memory = ["Memory.sb3"]
snowball = ["SnowballFight.sb3"]
brain_game = ["BrainGame.sb3"]

survive_config = "surviveNeuroevolution.json"
score_config = "scoreNeuroevolution.json"
random_config = "randomNeuroevolution.json"
brain_config = "brainGame.json"
create_your_own_world_config = "CreateYourOwnWorld.json"
create_your_own_world_long_config = "CreateYourOwnWorldLong.json"
create_your_own_world_random_config = "CreateYourOwnWorldRandom.json"
fruit_score_random_config = "fruitScoreRandom.json"
fruit_score_config = "fruitScore.json"
space_config = "spaceJunk.json"
fruit_catcher_survive_config = "fruitCatcherSurvive.json"
fruit_catcher_survive_random_config = "fruitCatcherSurviveRandom.json"

evaluate(fruit_catcher, fruit_catcher_survive_random_config, 1)
