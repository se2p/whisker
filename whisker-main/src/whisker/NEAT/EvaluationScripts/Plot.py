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
    coverage_bars_random = ax.bar(x - width / 2, cov_random, width, color='darkorange', label="Random")
    coverage_bars_neat = ax.bar(x + width / 2, cov_neat, width, color='royalblue', label="WhiskerNet")

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
    space_junk_neat = "./ResultsRandom/SpaceJunk/NetworkFitness/NetworkFitnessRun1.csv"
    space_junk_random = "./ResultsRandom/SpaceJunk/NetworkFitness/NetworkFitnessRun2.csv"

    dataframe_neat = pd.read_csv(space_junk_neat)
    dataframe_random = pd.read_csv(space_junk_random)

    iteration = dataframe_random["Iteration"]
    fitness_neat = dataframe_neat["Highest Network Fitness"]
    fitness_random = dataframe_random["Highest Network Fitness"]

    plt.plot(iteration, fitness_neat, "royalblue", label="Random")
    plt.plot(iteration, fitness_random, "darkorange", label="WhiskerNet")
    plt.legend()
    plt.show()


# plot_fitness()

plot_coverage()
