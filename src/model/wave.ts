import { Engine, Scene } from "@babylonjs/core";
import { elapsedSinceLastFrameSeconds } from "../util/timeUtil";
import { DynamicEntity } from "./dynamicEntity";
import { EntityManager } from "./entityManager";
import { EntityType } from "./entityType";
import { Path } from "./path";
import { PathNotFoundException } from "./pathNotFoundException";


interface SubWaveInvaderSpec {
    type: EntityType;
    pathName: string;
    numberToSpawn: number;
}


interface SubWaveSpec {
    secondsToStartAfterLastSubWave: number;
    invaders: SubWaveInvaderSpec[];
}


interface WaveSpec {
    id: string;
    subWaves: SubWaveSpec[];
}


class Wave {
    private readonly spec: WaveSpec;
    private readonly entities: EntityManager;
    private readonly paths: Map<string, Path>;
    private readonly invaders: Map<string, DynamicEntity> = new Map<string, DynamicEntity>();
    private readonly engine: Engine;
    
    private secondsElapsedSinceLastWaveReleased = 0.0;
    private started = false;
    private paused = false;
    private currentSubWaveIndex = 0;

    private constructor(spec: WaveSpec, entities: EntityManager, paths: Map<string, Path>, engine: Engine) {
        Wave.validateSpecs(spec, paths);
        this.spec = spec;
        this.entities = entities;
        this.paths = paths;
        this.engine = engine;
    }

    
    private static validateSpecs(spec: WaveSpec, paths: Map<string, Path>): void {
        let i = 0;
        for (const subWaveSpec of spec.subWaves) {
            for (const invaderSpec of subWaveSpec.invaders) {
                const pathName: string = invaderSpec.pathName;
                if (!paths.has(pathName)) {
                    throw PathNotFoundException.forWave(spec.id, i, invaderSpec.pathName);
                }
            }
            i += 1;
        }
    }


    public static buildWave(spec: WaveSpec, entities: EntityManager, paths: Map<string, Path>, scene: Scene): Wave {
        const wave: Wave = new Wave(spec, entities, paths, scene.getEngine());
        scene.onBeforeRenderObservable.add(() => wave.update());
        return wave;
    }


    public start(): void {
        this.secondsElapsedSinceLastWaveReleased = 0.0;
        this.started = true;
        this.paused = false;
    }


    public setPause(pause: boolean): void {
        this.paused = pause;
    }


    private update(): void {
        if (this.started && !this.paused) {
            const subWaveSpec: SubWaveSpec | null = this.getCurrentSubwave();
            if (subWaveSpec != null) {
                this.secondsElapsedSinceLastWaveReleased += elapsedSinceLastFrameSeconds(this.engine);
                if (this.secondsElapsedSinceLastWaveReleased > subWaveSpec.secondsToStartAfterLastSubWave) {
                    this.releaseSubWave();
                }
            }
        }
    }


    private releaseSubWave(): void {
        const subWaveSpec: SubWaveSpec | null = this.getCurrentSubwave();
        if (subWaveSpec != null) {
            for (const invaderSpec of subWaveSpec.invaders) {
                const type: EntityType = invaderSpec.type;
                const pathName: string = invaderSpec.pathName;
                // we will have checked on instantiation that every requested path exists
                const path: Path = this.paths.get(pathName)!;
                for (let i = 0; i < invaderSpec.numberToSpawn; i++) {
                    const name = `${this.spec.id}-${EntityType[invaderSpec.type]}-${i}`;
                    let invader: DynamicEntity;
                    switch (type) {
                        case EntityType.invader:
                            invader = this.entities.addInvader(name, path);
                            break;
                    }
                    this.invaders.set(name, invader!);
                }
            }
            this.currentSubWaveIndex += 1;
        }
    }


    private getCurrentSubwave(): SubWaveSpec | null {
        let result: SubWaveSpec | null = null;
        if (this.currentSubWaveIndex < this.spec.subWaves.length) {
            result = this.spec.subWaves[this.currentSubWaveIndex];
        }
        return result;
    }

    
    public isComplete(): boolean {
        // only need to call the invader cleanup here because this is the only dependency
        this.removeDestroyedInvaders();
        return (this.currentSubWaveIndex == this.spec.subWaves.length) && (this.invaders.size == 0);
    }


    private removeDestroyedInvaders(): void {
        for (const [name, entity] of this.invaders) {
            if (entity.isMarkedForDestruction()) {
                this.invaders.delete(name);
            }
        }
    }
}


export {Wave, WaveSpec, SubWaveSpec}