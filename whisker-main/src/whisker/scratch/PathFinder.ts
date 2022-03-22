import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import {ScratchPosition} from "./ScratchPosition";
import {ScratchInterface} from "./ScratchInterface";

export class PathFinder {

    /**
     * Use the A-Star algorithm to find a path between the player sprite and a colour on the canvas.
     * @param player the player which servers as the starting point of our search.
     * @param targetColor the color in hex representation serving as our goal.
     * @param resolution the resolution at which we look for adjacent nodes.
     * @param colorObstacles array of hex color values representing obstacles.
     * @param spriteObstacles array of sprites representing obstacles.
     * @returns Promise<ScratchPosition[]> a valid path from the player to the target.
     */
    public static async aStarPlayerToColor(player: RenderedTarget, targetColor: string, resolution: number,
                                           colorObstacles: string[] = [], spriteObstacles: RenderedTarget[] = []): Promise<ScratchPosition[]> {

        // OpenSet contains all Nodes which we still plan to visit and is kept sorted with the most promising node
        // positioned at index 0.
        const openSet: AStarNode[] = [];
        // Visited contains all nodes which we have already visited and we won't visit again.
        const visited: AStarNode[] = [];

        // Convert targetColor in Uint8 representation.
        const targetColorUint8 = ScratchInterface.getColorFromHex(targetColor);

        // Get comparable Arrays of our obstacles.
        const obstacleSprites = spriteObstacles.map(sprite => ScratchInterface.getPositionOfTarget(sprite));

        // Get starting Node
        const startingPosition = ScratchInterface.getPositionOfTarget(player);
        const targetPosition = ScratchInterface.findColorWithinRadius(targetColor);
        const startingDistance = startingPosition.distanceTo(targetPosition);
        const startNode = new AStarNode(startingPosition, null, 0, startingDistance);
        openSet.push(startNode);

        console.log(`Starting search for path from ${startingPosition} to ${targetPosition}`);
        // Within the loop we keep searching for as long as we have nodes worth visiting.
        while (openSet.length > 0) {
            let current = openSet[0];
            player.setXY(current.position.x, current.position.y, true);
            const colorAtCurrentPosition = ScratchInterface.getColorAtPosition(current.position);
            visited.push(current);
            // If we found our goal reproduce the path.
            if (current.position.equals(targetPosition) ||
                ScratchInterface.isColorMatching(colorAtCurrentPosition, targetColorUint8)) {
                const path: ScratchPosition[] = [];
                path.push(current.position);
                // Trace back from our final node to our starting node.
                while (!current.position.equals(startNode.position)) {
                    current = current.previous;
                    path.push(current.position);
                }
                path.reverse();
                console.log("Found valid Path!");
                return path;
            }
            // Keep searching if we haven't found our target yet.
            else {
                const neighbours = this.getNeighbours(current, targetPosition, resolution, player, colorObstacles, obstacleSprites);
                for (const neighbour of neighbours) {
                    if (!visited.some(node => node.equals(neighbour)) && !openSet.some(node => node.equals(neighbour))) {
                        openSet.push(neighbour);
                    }
                    // If we found a faster route to a neighbour node update the path.
                    else if (current.hopsFromStart + 1 < neighbour.hopsFromStart) {
                        neighbour.previous = current;
                        neighbour.hopsFromStart = current.hopsFromStart + 1;
                        neighbour.totalCost = neighbour.hopsFromStart + neighbour.estimatedHopsToGoal;

                        // The node might got interesting again, hence remove it from the visited list and include
                        // it to the nodes worth visiting.
                        if (visited.includes(neighbour)) {
                            visited.splice(visited.indexOf(neighbour), 1);
                            openSet.push(neighbour);
                        }
                    }
                }
            }
            // Remove the current node from the nodes worth visiting and add it to the visited array.
            openSet.splice(openSet.indexOf(current), 1);
            visited.push(current);
            // Sort the openSet to make sure we fetch the most promising node in the next iteration
            openSet.sort((a, b) => a.totalCost - b.totalCost);
        }
        // At this point we were not able to find a path.
        return undefined;
    }

    /**
     * Collects all valid neighbour nodes.
     * @param current the current node from which we want to infer neighbouring nodes.
     * @param goal the target node used for calculating an estimated distance.
     * @param resolution defines how big our hops from node to node are.
     * @param player the player sprite used to calculate the safety distance.
     * @param obstacleColors checks if the safety distance intersects with an obstacle represented by a colour.
     * @param obstacleSprites checks if the safety distance intersects with an obstacle represented by a sprite.
     * @returns AStarNode[] holding all valid neighbour nodes.
     */
    private static getNeighbours(current: AStarNode, goal: ScratchPosition, resolution: number, player: RenderedTarget,
                                 obstacleColors: string[] = [], obstacleSprites: ScratchPosition[] = []): AStarNode[] {
        const neighbours: AStarNode[] = [];
        // For each neighbour we check within a given safety range if we do not touch any obstacles.
        const safetyRange = Math.ceil(ScratchInterface.getSafetyDistanceFromTarget(player, 0) / 4);
        // Moving directions.
        const directions = ["NORTH", "EAST", "SOUTH", "WEST"];
        for (const direction of directions) {
            let neighbourPosition: ScratchPosition;
            switch (direction) {
                case "NORTH":
                    neighbourPosition = new ScratchPosition(current.position.x, current.position.y + resolution);
                    break;
                case "EAST":
                    neighbourPosition = new ScratchPosition(current.position.x + resolution, current.position.y);
                    break;
                case "SOUTH":
                    neighbourPosition = new ScratchPosition(current.position.x, current.position.y - resolution);
                    break;
                case "WEST":
                    neighbourPosition = new ScratchPosition(current.position.x - resolution, current.position.y);
                    break;
            }

            // If we have a neighbour not contained within the Canvas or hit by an obstacle within the required
            // safety distance, do not include that neighbour.
            if (!ScratchInterface.isPointWithinCanvas(neighbourPosition) ||
                this.isTouchingObstacle(neighbourPosition, safetyRange, obstacleColors, obstacleSprites)) {
                continue;
            }
            const distanceFromStart = current.hopsFromStart + 1;
            const distanceToGoal = Math.round(goal.distanceTo(neighbourPosition));
            const neighbourNode = new AStarNode(neighbourPosition, current, distanceFromStart, distanceToGoal);
            neighbours.push(neighbourNode);
        }
        return neighbours;
    }

    private static isTouchingObstacle(position: ScratchPosition, safetyRange: number, obstacleColors: string[] = [],
                                      obstacleSprites: ScratchPosition[] = []): boolean {
        let isTouchingObstacleColor = false;
        for (const color of obstacleColors) {
            if (ScratchInterface.findColorWithinRadius(color, 1, safetyRange, position) !== undefined) {
                isTouchingObstacleColor = true;
                break;
            }
        }
        const isTouchingObstacleSprite = obstacleSprites.some(obstaclePosition => obstaclePosition.equals(position));
        return isTouchingObstacleColor || isTouchingObstacleSprite;
    }
}

class AStarNode {
    /**
     * Position of this node.
     */
    private readonly _position: ScratchPosition;

    /**
     * Previous node that lead to this rootNode.
     */
    private _previous: AStarNode;

    /**
     * Distance from starting position measured in number of nodes.
     */
    private _hopsFromStart: number;

    /**
     * Distance to goal position measured in number of nodes.
     */
    private readonly _estimatedHopsToGoal: number;

    /**
     * The cost of the whole path (hopsFromStart + estimatedHopsToGoal).
     */
    private _totalCost: number;

    constructor(position: ScratchPosition, previous: AStarNode, hopsFromStart: number, estimatedHopsToGoal: number) {
        this._position = position;
        this._previous = previous;
        this._hopsFromStart = hopsFromStart;
        this._estimatedHopsToGoal = Math.round(estimatedHopsToGoal);
        this._totalCost = hopsFromStart + estimatedHopsToGoal;
    }

    public equals(other: AStarNode): boolean {
        return this.position.equals(other.position);
    }

    get position(): ScratchPosition {
        return this._position;
    }

    get previous(): AStarNode {
        return this._previous;
    }

    set previous(value: AStarNode) {
        this._previous = value;
    }

    get hopsFromStart(): number {
        return this._hopsFromStart;
    }

    set hopsFromStart(value: number) {
        this._hopsFromStart = value;
    }

    get estimatedHopsToGoal(): number {
        return this._estimatedHopsToGoal;
    }

    get totalCost(): number {
        return this._totalCost;
    }

    set totalCost(value: number) {
        this._totalCost = value;
    }
}
