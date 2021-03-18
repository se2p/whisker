import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import math


def plot_coverage():
    projects = ["Archery", "BoatRace", "BrainGame", "ChatBot", "CreateYourOwnWorld",
                "Dodgeball", "FruitCatcher", "Memory", "PoetryGenerator", "Rockband",
                "SnowballFight", "SpaceJunk"]
    random_path = "./ResultsRandom/"
    neat_path = "./ResultsNEAT/"

    cov_random = []
    cov_neat = []
    blocks_random = []
    blocks_neat = []
    blocks_total = []
    time_random = []
    time_neat = []
    for p in projects:
        csv_rnd = pd.read_csv(random_path + p + "/Coverage/CoverageResults.csv", delimiter=',')
        cov_random.append(csv_rnd["bestCoverage"][0] * 100)
        blocks_random.append(csv_rnd["coveredFitnessFunctionCount"][0])
        blocks_total.append(csv_rnd["fitnessFunctionCount"][0])
        rnd_time = csv_rnd["timeToReachFullCoverage"][0]
        if math.isnan(rnd_time):
            rnd_time = 30
        else:
            rnd_time = rnd_time / 1000
        time_random.append(rnd_time)

        csv_neat = pd.read_csv(neat_path + p + "/Coverage/CoverageResults.csv", delimiter=',')
        if p.startswith("CreateYourOwnWorld"):
            neat_time = csv_neat["timeToReachFullCoverage"][1]
            cov_neat.append(csv_neat["bestCoverage"][1] * 100)
            blocks_neat.append(csv_neat["coveredFitnessFunctionCount"][1])
        else:
            neat_time = csv_neat["timeToReachFullCoverage"][0]
            cov_neat.append(csv_neat["bestCoverage"][0] * 100)
            blocks_neat.append(csv_neat["coveredFitnessFunctionCount"][0])
        if math.isnan(neat_time):
            neat_time = 30
        else:
            neat_time = neat_time / 1000
        time_neat.append(neat_time)

    print("Total Blocks: " + str(np.sum(blocks_total)))
    print("RandomBlocks: " + str(np.sum(blocks_random)))
    print("NEAT__Blocks: " + str(np.sum(blocks_neat)))
    print("TimeRnd : " + str(time_random))
    print("TimeNEAT: " + str(time_neat))
    print("Random: "+ str(np.average(cov_random)))
    print()
    print("NEAT: " + str(np.average(cov_neat)))

    x = np.arange(len(projects))  # the label locations
    width = 0.35  # the width of the bars

    fig, ax = plt.subplots()
    coverage_bars_neat = ax.bar(x - width / 2, cov_neat, width, color='royalblue', label="WhiskerNet")
    coverage_bars_random = ax.bar(x + width / 2, cov_random, width, color='darkorange', label="Random")

    # Add some text for labels, title and custom x-axis tick labels, etc.
    ax.set_ylabel('Coverage in %')
    ax.set_title('Projects')
    ax.set_xticks(x)
    ax.set_xticklabels(projects)
    ax.legend()

    plt.xticks(rotation=75)
    plt.grid(axis='y')
    fig.tight_layout()

    plt.savefig('./Plots/CoveragePlot.pdf')
    plt.show()


def plot_fitness():


    fruit_catcher_whiskernet = "./ResultsNEAT/FruitCatcherFitness/NetworkFitness/NetworkFitnessRun3.csv"
    fruit_catcher_random = "./ResultsRandom/FruitCatcherFitness/NetworkFitness/NetworkFitnessRun2.csv"
    fruit_catcher_neat = "./ResultsFullyConnected/FruitCatcher/NetworkFitness/NetworkFitnessRun1.csv"

    dataframe_fruit_catcher_whiskernet = pd.read_csv(fruit_catcher_whiskernet)
    dataframe_fruit_catcher_random = pd.read_csv(fruit_catcher_random)
    dataframe_fruit_catcher_neat = pd.read_csv(fruit_catcher_neat)

    iteration = dataframe_fruit_catcher_random["Iteration"]
    fitness_fruit_catcher_whiskernet = dataframe_fruit_catcher_whiskernet["Highest Network Fitness"]
    fitness_fruit_catcher_random = dataframe_fruit_catcher_random["Highest Network Fitness"]
    fitness_fruit_catcher_neat = dataframe_fruit_catcher_neat["Highest Network Fitness"]
    avg_fitness_fruit_catcher_whiskernet = dataframe_fruit_catcher_whiskernet["Average Network Fitness"]
    avg_fitness_fruit_catcher_random = dataframe_fruit_catcher_random["Average Network Fitness"]
    avg_fitness_fruit_catcher_neat = dataframe_fruit_catcher_neat["Average Network Fitness"]

    fitness_fruit_catcher_whiskernet = [element - 8.01 for element in fitness_fruit_catcher_whiskernet]
    avg_fitness_fruit_catcher_whiskernet = [element - 8.01 for element in avg_fitness_fruit_catcher_whiskernet]
    fitness_fruit_catcher_random = [element - 8.01 for element in fitness_fruit_catcher_random]
    avg_fitness_fruit_catcher_random = [element - 8.01 for element in avg_fitness_fruit_catcher_random]
    fitness_fruit_catcher_neat = [element - 8.01 for element in fitness_fruit_catcher_neat]
    avg_fitness_fruit_catcher_neat = [element - 8.01 for element in avg_fitness_fruit_catcher_neat]


    plt.plot(iteration, fitness_fruit_catcher_whiskernet, "royalblue", label="WhiskerNet Max Fitness")
    plt.plot(iteration, fitness_fruit_catcher_random, "darkorange", label="Random Max Fitness")
    plt.plot(iteration, avg_fitness_fruit_catcher_whiskernet, "royalblue", linestyle='dotted', label="WhiskerNet Avg Fitness")
    plt.plot(iteration, avg_fitness_fruit_catcher_random, "darkorange", linestyle='dotted', label="Random Avg Fitness")
    plt.legend()
    plt.title("Score Fitness: WhiskerNet vs. Random")
    plt.xlabel("Iterations")
    plt.ylabel("Achieved Score")
    plt.savefig('./Plots/FruitCatcherWhiskerNetVsRandom.pdf')
    plt.show()
    plt.clf()

    plt.plot(iteration, fitness_fruit_catcher_whiskernet, "royalblue", label="WhiskerNet Max Fitness")
    plt.plot(iteration, fitness_fruit_catcher_neat, "darkorange", label="NEAT Max Fitness")
    plt.plot(iteration, avg_fitness_fruit_catcher_whiskernet, "royalblue", linestyle='dotted',
             label="WhiskerNet Avg Fitness")
    plt.plot(iteration, avg_fitness_fruit_catcher_neat, "darkorange", linestyle='dotted', label="NEAT Avg Fitness")
    plt.legend()
    plt.title("Score Fitness: WhiskerNet vs. NEAT")
    plt.xlabel("Iterations")
    plt.ylabel("Achieved Score")
    plt.savefig('./Plots/FruitCatcherWhiskerNetVsNEAT.pdf')
    plt.show()
    plt.clf()

    space_junk_whiskernet = "./ResultsNEAT/SpaceJunk/NetworkFitness/NetworkFitnessRun2.csv"
    space_junk_random = "./ResultsRandom/SpaceJunk/NetworkFitness/NetworkFitnessRun3.csv"
    space_junk_neat = "./ResultsFullyConnected/SpaceJunk/NetworkFitness/NetworkFitnessRun3.csv"

    dataframe_space_junk_whiskernet = pd.read_csv(space_junk_whiskernet)
    dataframe_space_junk_random = pd.read_csv(space_junk_random)
    dataframe_space_junk_neat = pd.read_csv(space_junk_neat)

    fitness_space_junk_whiskernet = dataframe_space_junk_whiskernet["Highest Network Fitness"].array
    fitness_space_junk_random = dataframe_space_junk_random["Highest Network Fitness"].array
    fitness_space_junk_neat = dataframe_space_junk_neat["Highest Network Fitness"].array
    avg_fitness_space_junk_whiskernet = dataframe_space_junk_whiskernet["Average Network Fitness"].array
    avg_fitness_space_junk_random = dataframe_space_junk_random["Average Network Fitness"].array
    avg_fitness_space_junk_neat = dataframe_space_junk_neat["Average Network Fitness"].array

    normalizing_factor_whiskernet = fitness_space_junk_whiskernet[-1]
    normalizing_factor_neat = fitness_space_junk_neat[-1]

    fitness_space_junk_whiskernet = [element / normalizing_factor_whiskernet * 30 for element in fitness_space_junk_whiskernet]
    avg_fitness_space_junk_whiskernet = [element / normalizing_factor_whiskernet * 30 for element in avg_fitness_space_junk_whiskernet]

    fitness_space_junk_neat = [element / normalizing_factor_neat * 30 for element in fitness_space_junk_neat]
    avg_fitness_space_junk_neat = [element / normalizing_factor_neat * 30 for element in avg_fitness_space_junk_neat]

    size_diff = len(fitness_space_junk_whiskernet) - len(fitness_space_junk_neat)
    if size_diff > 0:
        for _ in range(0, size_diff):
            fitness_space_junk_neat.append(fitness_space_junk_neat[-1])
            avg_fitness_space_junk_neat.append(avg_fitness_space_junk_neat[-1])
    else:
        for _ in range(0, abs(size_diff)):
            fitness_space_junk_whiskernet.append(fitness_space_junk_whiskernet[-1])
            avg_fitness_space_junk_whiskernet.append(avg_fitness_space_junk_whiskernet[-1])

    iteration = list(range(len(fitness_space_junk_neat)))

    plt.plot(iteration, fitness_space_junk_whiskernet, "royalblue", label="WhiskerNet Max Fitness")
    plt.plot(iteration, fitness_space_junk_neat, "darkorange", label="NEAT Max Fitness")
    plt.plot(iteration, avg_fitness_space_junk_whiskernet, "royalblue", linestyle='dotted',
             label="WhiskerNet Avg Fitness")
    plt.plot(iteration, avg_fitness_space_junk_neat, "darkorange", linestyle='dotted', label="NEAT Avg Fitness")
    plt.xticks(iteration)
    plt.legend()
    plt.title("Survive Fitness: WhiskerNet vs. NEAT")
    plt.xlabel("Iterations")
    plt.ylabel("Survived Time in seconds")
    plt.savefig('./Plots/SpaceJunkWhiskerNetVsNEAT.pdf')
    plt.show()
    plt.clf()

    target_size = len(fitness_space_junk_whiskernet) + 3

    for _ in range(0, 3):
        fitness_space_junk_whiskernet.append(fitness_space_junk_whiskernet[-1])
        avg_fitness_space_junk_whiskernet.append(avg_fitness_space_junk_whiskernet[-1])

    fitness_space_junk_random = fitness_space_junk_random[0: target_size]
    avg_fitness_space_junk_random = avg_fitness_space_junk_random[0: target_size]

    fitness_space_junk_random = [element / 10 for element in fitness_space_junk_random]
    avg_fitness_space_junk_random = [element / 10 for element in avg_fitness_space_junk_random]

    print(type(fitness_space_junk_random))

    iteration = list(range(len(fitness_space_junk_whiskernet)))

    plt.plot(iteration, fitness_space_junk_whiskernet, "royalblue", label="WhiskerNet Max Fitness")
    plt.plot(iteration, fitness_space_junk_random, "darkorange", label="Random Max Fitness")
    plt.plot(iteration, avg_fitness_space_junk_whiskernet, "royalblue", linestyle='dotted',
             label="WhiskerNet Avg Fitness")
    plt.plot(iteration, avg_fitness_space_junk_random, "darkorange", linestyle='dotted', label="Random Avg Fitness")
    plt.xticks(iteration)
    plt.legend()
    plt.title("Survive Fitness: WhiskerNet vs. Random")
    plt.xlabel("Iterations")
    plt.ylabel("Survived Time in seconds")
    plt.savefig('./Plots/SpaceJunkWhiskerNetVsRandom.pdf')
    plt.show()
    plt.clf()


#plot_fitness()
plot_coverage()
