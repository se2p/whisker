import subprocess

arguments = ["node", "../servant/servant.js",
             "-u", "../whisker-web/dist/index.html",
             "-s", "../../../../Datasets/FruitCatching2/",
             "-c", "../config/Neuroevolution/dynamicTestSuiteScore.json",
             "-t", "../networks/FruitCatching.json",
             "-v", "../results/AutoGradingResults.csv",
             "-l", "-k", "-a", "10"]
#process = subprocess.Popen(arguments, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
#output, error = process.communicate()
process = subprocess.Popen(arguments)
process.wait()
