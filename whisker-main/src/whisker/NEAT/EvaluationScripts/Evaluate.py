import subprocess
import os
import pandas as pd


def evaluate(projects, config_file, runs):

    os.chdir("../../../../../")

    for p in projects:

        # Set up Names
        project_name = p.replace(".sb3", "")
        target_directory = "./whisker-main/src/whisker/NEAT/EvaluationScripts/" + project_name + "Results"

        # Create the directory for the project to store the results in.
        if not os.path.isdir(target_directory):
            os.mkdir(target_directory)

        # Execute the NEAT-Algorithm several times and save the output as CSV file and the tests in their directories
        for x in range(1, runs + 1):
            cmd = "node ./servant/servant.js "
            cmd += "-s ./testProjects/" + p + " "
            cmd += "-c ./config/" + config_file + " "
            cmd += "-u ./whisker-web/dist/index.html "
            cmd += "-a 20 -g -l -k"
            print(cmd)
            output = str(subprocess.run(cmd, capture_output=True, shell=True).stdout)
            output = output.replace('\\n', "\n")

            # Extract the required information
            csv_output = ""
            found = 0
            for line in output.splitlines():
                line = line.strip().strip('INFO:').strip().strip("Forwarded:").strip()
                if line.startswith('fitness') or found == 1:
                    csv_output += (line + "\n")
                    found += 1

            # Save the results in a CSV File
            target_path_csv = target_directory + "/" + project_name + str(x) + ".csv"
            with open(target_path_csv, "w") as csvFile:
                csvFile.write(csv_output)

            os.rename("tests.js", target_directory + "/" + project_name + str(x) + ".js")

            print("Finished: " + project_name + " Round " + str(x))

        # Merge the Rounds into one CSV File
        starting_csv_path = target_directory + "/" + project_name + "1.csv"
        if os.path.isfile(starting_csv_path):
            start_csv = pd.read_csv(starting_csv_path)
            for x in range(2, runs + 1):
                path_to_combine_csv = target_directory + "/" + project_name + str(x) + ".csv"
                combine_csv = pd.read_csv(path_to_combine_csv)
                start_csv = pd.concat([start_csv, combine_csv])

                os.remove(path_to_combine_csv)

            start_csv.insert(0, "Round", [x for x in range(1, runs + 1)])
            start_csv.to_csv(target_directory + "/" + project_name + ".csv", index=False)
            os.remove(starting_csv_path)


score_projects = ["Archery.sb3", "Balloons.sb3", "BeatTheGoalie.sb3", "ChatBot.sb3", "GreenYourCity.sb3"]
create_your_own_word = ["CreateYourOwnWorld.sb3"]
fruit_catcher = ["FruitCatcher.sb3"]
survive_projects = ["SpaceJunk.sb3", "FruitCatcher.sb3"]
space_junk = ["SpaceJunk.sb3"]
memory = ["Memory.sb3"]

survive_config = "surviveNeuroevolution.json"
score_config = "scoreNeuroevolution.json"

evaluate(fruit_catcher, survive_config, 1)
