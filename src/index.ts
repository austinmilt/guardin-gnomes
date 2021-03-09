import { Engine } from "@babylonjs/core/Engines/engine";
import { EntityType } from "./model/entityType";
import { Face } from "./model/face";
import { Level, LevelSpec } from "./model/level";

const TEST_LEVEL: LevelSpec = {
    cubeSpec: {
        rows: 10,
        columns: 10,
        depth: 10
    },

    waves: [
        {
            id: '1', 
            subWaves: [   
                {
                    invaders: [
                        {type: EntityType.invader, pathName: 'A', numberToSpawn: 2},
                        {type: EntityType.invader, pathName: 'B', numberToSpawn: 1}
                    ],
                    secondsToStartAfterLastSubWave: 0
                },
                {
                    invaders: [
                        {type: EntityType.invader, pathName: 'B', numberToSpawn: 1}
                    ],
                    secondsToStartAfterLastSubWave: 10
                } 
            ]
        },
        {
            id: '2', 
            subWaves: [   
                {
                    invaders: [
                        {type: EntityType.invader, pathName: 'A', numberToSpawn: 3},
                        {type: EntityType.invader, pathName: 'B', numberToSpawn: 2}
                    ],
                    secondsToStartAfterLastSubWave: 0
                },
                {
                    invaders: [
                        {type: EntityType.invader, pathName: 'A', numberToSpawn: 2}
                    ],
                    secondsToStartAfterLastSubWave: 10
                } 
            ]
        },
    ],

    paths: {
        'A': [
            {face: Face.FRONT, row: 0, column: 0},
            {face: Face.TOP, row: 9, column: 0},
            {face: Face.LEFT, row: 0, column: 9}
        ],
        'B': [
            {face: Face.FRONT, row: 0, column: 0},
            {face: Face.FRONT, row: 0, column: 1},
            {face: Face.FRONT, row: 0, column: 2},
            {face: Face.FRONT, row: 0, column: 3},
            {face: Face.FRONT, row: 0, column: 4},
            {face: Face.FRONT, row: 0, column: 5},
            {face: Face.FRONT, row: 0, column: 6},
            {face: Face.FRONT, row: 0, column: 7},
            {face: Face.FRONT, row: 0, column: 8},
            {face: Face.FRONT, row: 0, column: 9},
            {face: Face.FRONT, row: 1, column: 9},
            {face: Face.FRONT, row: 2, column: 9},
            {face: Face.FRONT, row: 2, column: 8},
            {face: Face.FRONT, row: 2, column: 7},
            {face: Face.FRONT, row: 2, column: 6},
            {face: Face.FRONT, row: 2, column: 5},
            {face: Face.FRONT, row: 2, column: 4},
            {face: Face.FRONT, row: 2, column: 3},
            {face: Face.FRONT, row: 2, column: 2},
            {face: Face.FRONT, row: 2, column: 1},
            {face: Face.FRONT, row: 2, column: 0},
            {face: Face.FRONT, row: 1, column: 0},
        ]
    }
}


export const babylonInit = async (): Promise<void>  => {
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; 
    const engine = new Engine(canvas, true); 
    const level: Level = await Level.buildLevel(engine, canvas, TEST_LEVEL);
    level.runRenderLoop(engine);
    window.addEventListener("resize", () => engine.resize());
}

babylonInit().then(() => {
    // scene started rendering, everything is initialized
});
