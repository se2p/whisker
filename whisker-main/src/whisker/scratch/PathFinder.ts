import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import {ScratchPosition} from "./ScratchPosition";
import {ScratchHelperFunctions} from "./ScratchHelperFunctions";
import {WaitEvent} from "../testcase/events/WaitEvent";

export class PathFinder {

    /**
     * Use the A-Star algorithm to find a path between the player and a color on the canvas.
     * @param player the player which servers as the starting point of our search.
     * @param targetColor the color in hex representation serving as our goal.
     * @param resolution the resolution at which we look for adjacent nodes.
     * @param colorObstacles array of hex color values representing obstacles.
     * @param spriteObstacles array of sprites representing obstacles.
     */
    public static async aStarPlayerToColor(player: RenderedTarget, targetColor: string, resolution: number,
                                           colorObstacles: string[] = [], spriteObstacles: RenderedTarget[] = []): Promise<ScratchPosition[]> {

        // OpenSet contains all Nodes which we still plan to visit and is kept sorted with the most promising node
        // positioned at index 0.
        const openSet: AStarNode[] = [];
        // Visited contains all nodes which we have already visited and do not want to visit again
        const visited: AStarNode[] = [];

        // Convert targetColor in Uint8 representation
        const targetColorUint8 = ScratchHelperFunctions.getColorFromHex(targetColor);

        // Get comparable Arrays of our obstacles.
        const obstacleSprites = spriteObstacles.map(sprite => ScratchHelperFunctions.getPositionOfTarget(sprite));

        // Get starting Node
        const startingPosition = ScratchHelperFunctions.getPositionOfTarget(player);
        const targetPosition = ScratchHelperFunctions.findColorWithinRadius(targetColor);
        const startingDistance = startingPosition.distanceTo(targetPosition);
        const startNode = new AStarNode(startingPosition, null, 0, startingDistance);
        openSet.push(startNode);

        console.log(`Starting search for path from ${startingPosition} to ${targetPosition}`)
        // Loop of A-Star PathFinder; we keep searching for as long as we have nodes worth visiting.
        while (openSet.length > 0) {
            let current = openSet[0];
            player.setXY(current.position.x, current.position.y, true);
            await new WaitEvent().apply();
            const colorAtCurrentPosition = ScratchHelperFunctions.getColorAtPosition(current.position);
            visited.push(current);
            // If we found our goal reproduce the path taken.
            if (current.position.equals(targetPosition) ||
                ScratchHelperFunctions.isColorMatching(colorAtCurrentPosition, targetColorUint8)) {
                const path: ScratchPosition[] = [];
                path.push(current.position);
                // Trace back from our final node to our starting Node
                while (!current.position.equals(startNode.position)) {
                    current = current.previous;
                    path.push(current.position);
                }
                const test = path.reverse();
                for (const position of test) {
                    player.setXY(position.x, position.y, true);
                    await new WaitEvent().apply();
                }
                return path;
            }
            // Keep searching if we haven't found our target yet.
            else {
                const neighbours = this.getNeighbours(current, targetPosition, resolution, player, colorObstacles, obstacleSprites);
                for (const neighbour of neighbours) {
                    if (!visited.some(node => node.equals(neighbour)) && !openSet.some(node => node.equals(neighbour))) {
                        openSet.push(neighbour);
                    }
                    // If we found a faster route to the neighbourNode update it
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

    private static getNeighbours(current: AStarNode, goal: ScratchPosition, resolution: number, player: RenderedTarget,
                                 obstacleColors: string[] = [],
                                 obstacleSprites: ScratchPosition[] = []): AStarNode[] {
        const neighbours: AStarNode[] = [];
        // For each neighbour we check within a given safety range if we do not touch any obstacles.
        const safetyRange = Math.ceil(ScratchHelperFunctions.getSafetyDistanceFromTarget(player,0) / 4);
        // Moving directions.
        const directions = ["NORTH", "EAST", "SOUTH", "WEST"];
        for (const direction of directions) {
            let neighbourPosition: ScratchPosition
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
            if (!ScratchHelperFunctions.isPointWithinCanvas(neighbourPosition) ||
                this.isTouchingObstacle(neighbourPosition, safetyRange, obstacleColors, obstacleSprites)) {
                continue;
            }
            const distanceFromStart = current.hopsFromStart + 1;
            const distanceToGoal = Math.round(goal.distanceTo(neighbourPosition));
            const neighbourNode = new AStarNode(neighbourPosition, current, distanceFromStart, distanceToGoal);
            neighbours.push(neighbourNode)
        }
        return neighbours;
    }

    private static isTouchingObstacle(position: ScratchPosition, safetyRange: number, obstacleColors: string[] = [],
                                      obstacleSprites: ScratchPosition[] = []): boolean {
        let isTouchingObstacleColor = false;
        for(const color of obstacleColors){
         if(ScratchHelperFunctions.findColorWithinRadius(color, 1, safetyRange, position) !== undefined){
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
     * Position of this RootNode.
     */
    private readonly _position: ScratchPosition;

    /**
     * Previous routeNode leading to this rootNode.
     */
    private _previous: AStarNode;

    /**
     * Distance from starting position.
     */
    private _hopsFromStart: number;

    /**
     * Distance to goal position.
     */
    private readonly _estimatedHopsToGoal: number;

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
