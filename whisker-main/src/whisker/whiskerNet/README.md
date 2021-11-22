# WhiskerNet

The basic idea of WhiskerNet originates from the observation that while neural networks are learning to play a given
game, many statements of that game are discovered. Thus, whenever WhiskerNet reaches new statements during training, it
saves the network or the trace of Scratch events that were executed to reach a particular statement in the **archive**.
Then as soon as the training phase stops, all the networks (**dynamic test suite**) or traces of Events (**static test
suite**)
saved in the archived are gathered and reported to the user in the form of a test suite.

The training phase of WhiskerNet involves four phases, of which phases 2 up to 4 are repeated until a user-specified
stopping criterion has been met:

1. Generation of Networks
2. Play Loop
3. Network Evaluation
4. Evolving the population of Networks using [**NEAT**](https://ieeexplore.ieee.org/abstract/document/6790655).

----

## 1. Generation of Networks

In order to know how many input and output nodes our networks require, we analyse the source code of the given Scratch
program. For the input nodes, we extract specific attributes from all Sprites contained inside the Scratch program and
map each extracted attribute to precisely one input node. The extracted attributes are:

- **Position**
- **Moving direction**
- **Selected costume**
- **Distance to sensed sprite**
- **Distance to sensed colour**

On the other hand, output nodes represent the actions a human player can take within a given game. WhiskerNet currently
supports:

- **KeyPress**: Presses a specific key on the keyboard for a parameterised amount of time.
- **ClickSprite**: Clicks on a specific sprite.
- **ClickStage**: Clicks on the stage.
- **TypeText**: Types some text in a text field.
- **Mouse move**: Moves the mouse to a parameterised position.
- **Wait**: Does nothing and waits for a parameterised amount of time.

Whenever additional parameters are required, for instance, for **mouse move** events, one additional output node for each
required parameter is added to the network topology. Thus, in the case of **mouse move** events, two additional output
nodes are added to the network, one for the x-coordinate and one for the y-coordinate.

WhiskerNet uses three different methods to generate an initial topology of networks:

- **FullyConnectedGenerator**: Generates a homogeneous population of networks where each input node is connected to
  every output node
- **SparseGenerator**: Randomly selects one sprite and connects all its attributes to all output nodes. With a
  predefined probability, additional sprites are connected as well.
- **TemplateNetworkGenerator**: Generates a population of networks from a **dynamic test suite**. Each network contained
  in the test suite is cloned and mutated in a round-robin fashion until the desired population size has been reached.

---

## 2. Play Loop

The decision about which output event should be chosen and executed within the Scratch game is cast to a multi-class
single-label classification problem. Each repetition of the training phase starts with the play loop, in which every
neural network of the population plays the game. Within the play loop, WhiskerNet starts by extracting the input and
output features of the current state defined in **1. Generation of Networks**. Next, we feed the extracted input
features to the input nodes and activate the networks. Finally, we decide which action to take by forming a probability
distribution over all output-classification nodes using the **softmax function** and selecting the most probable event.
If an event that requires additional parameters has been selected, the regression nodes responsible for the selected
event are queried for the parameter values. Every network is allowed to play a game until either a predefined timeout
has run out or a GameOver state is reached. GameOver states are states which end the game through so-called
**Stop All**
blocks.

---

## 3. Network Evaluation

As soon as all networks have finished their playthrough, they are evaluated by assigning them a fitness value determined
via **network fitness functions**. These functions are selected by the user and should represent the global goal of a
game. WhiskerNet primarily supports the following two functions:

- ScoreFitness: Measures the score a network has achieved during the playthrough by extracting a value from parameters
  which are named **score** or similarly. Suitable for games where the player has to reach a high score.
- SurviveFitness: Measures the time a network has been playing a game. Suitable for games where the player has to
  survive for as long as possible without reaching a GameOver state.
- TargetFitness: Measures the distance to a specified destination on the screen. Suitable for labyrinth-like games where
  the player has to reach a specific destination on the screen.
- NoveltyFitness: Rewards networks that show novel behaviour. Suitable for games in which exploration of novel states
  might be beneficial.

In addition to assigning a fitness value, all networks are evaluated to check if they have reached a previously
uncovered statement. If they did, they are added to the archive, which is later used to form a test suite.

---

## 4. Evolving the Population of Networks using [**NEAT**](https://ieeexplore.ieee.org/abstract/document/6790655).

To actually improve the capability of our population in playing a game, we use the NEAT method. NEAT is based on the
principles of neuroevolution and uses evolutionary programming methods. First, a **selection operator** is used to
select the most promising members of a population based on the assigned fitness value of a network. The selected networks are
then evolved using **mutation** and **crossover**. After multiple generations of selecting and evolving the best
performing networks, we expect to eventually obtain a population of networks that have learnt to play the game
according to the specified fitness function. For a detailed explanation of the NEAT algorithm, please refer to
the [**original NEAT paper**](https://ieeexplore.ieee.org/abstract/document/6790655).

---

## Executing WhiskerNet

Similar to Whisker, WhiskerNet can be executed using the servant. Thus, WhiskerNet supports the same command-line
options as Whisker and can be built by executing `yarn install && yarn build`. The list of supported command-line
parameters can be found in
the [README](https://gitlab.infosun.fim.uni-passau.de/se2/whisker/whisker-main/-/blob/master/README.md) residing within
the root directory **whisker-main**. For instance, to execute WhiskerNet to train the **FruitCatching** game use the
following command:

```
node servant.js
-u whisker-web/dist/index.html
-s FruitCatching.sb3
-c config/Neuroevolution/scoreNeuroevolution.json
-g
```

Within the configuration file, passed on to the servant using the `-c` option, you can define the hyperparameters of
NEAT and make some additional configurations:

- **chromosome**: Defines the generator used for generating an initial population (`fullyConnectedNetwork`
  / `sparseNetwork` / `templateNetwork`)
- **testSuiteType**: Defines the type of the generated test suite (`dynamic` / `static`).
- **networkFitness**: Defines the used network fitness function (`score` / `survive` / `target` / `novelty`).
- **stoppingCondition**: Defines when the training phase should stop (`fixedIteration` / `fixedTime` / `optimal`
  / `events` /
  `evaluations` / `combined`)



