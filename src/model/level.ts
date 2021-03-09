import { Engine, HemisphericLight, Scene, Vector3 } from "@babylonjs/core";
import { CubeBuilder } from "../util/cubeBuilder";
import { Cube, CubeSpec } from "./cube";
import { EntityManager, EntityType } from "./entityManager";
import { HUD } from "./hud";
import { Path } from "./path";
import { Store } from "./store";
import { TileIndex } from "./tileIndex";
import { UI } from "./ui";
import { Wave, WaveSpec } from "./wave";

// these imports are required to load/render assets. So even though there's
//  no explicit references, they gotta be here
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/core/Meshes/instancedMesh"
import { elapsedSinceLastFrameSeconds } from "../util/timeUtil";
import { CubeCamera } from "./camera";


interface LevelSpec {
    cubeSpec: CubeSpec;
    paths: {[pathName: string]: TileIndex[]};
    waves: WaveSpec[];
}


class Level {
    private readonly spec: LevelSpec;
    private readonly paths: Map<string, Path>;
    private readonly scene: Scene;
    private readonly hud: HUD;
    private readonly entities: EntityManager;
    private readonly store: Store;

    private started = false;
    private paused = false;
    private playTimeElapsedSeconds = 0.0;
    private waves: Array<Wave> = new Array<Wave>();
    
    constructor(spec: LevelSpec, paths: Map<string, Path>, scene: Scene, hud: HUD, entities: EntityManager, store: Store) {
        this.spec = spec;
        this.paths = paths;
        this.scene = scene;
        this.hud = hud;
        this.entities = entities;
        this.store = store;
    }
    
    
    static async buildLevel(engine: Engine, canvas: HTMLCanvasElement, spec: LevelSpec): Promise<Level> {
        const scene = new Scene(engine);

        CubeCamera.buildCamera(scene, canvas);

        // load the environment file
        //scene.environmentTexture = new CubeTexture(roomEnvironment, scene);

        // if not setting the envtext of the scene, we have to load the DDS module as well
        // new EnvironmentHelper( {
        //     skyboxTexture: roomEnvironment,
        //     createGround: false
        // }, scene)

        new HemisphericLight("light1", new Vector3(0, 1, 0), scene).intensity = 0.25;
        new HemisphericLight("light2", new Vector3(0, -1, 0), scene).intensity = 0.25;
        new HemisphericLight("light3", new Vector3(1, 0, 0), scene).intensity = 0.25;
        new HemisphericLight("light4", new Vector3(-1, 0, 0), scene).intensity = 0.25;
        new HemisphericLight("light5", new Vector3(0, 0, 1), scene).intensity = 0.25;
        new HemisphericLight("light6", new Vector3(0, 0, -1), scene).intensity = 0.25;
            
        const entities: EntityManager = EntityManager.build(scene);

        const ui: UI = UI.constructUI(scene);

        const store: Store = Store.buildStore(entities, ui);

        await entities.initialize(store, [EntityType.invader, EntityType.DEFENDER, EntityType.TILE, EntityType.PROJECTILE]);

        const cubeSpec: CubeSpec = spec.cubeSpec;
        const cube: Cube = await CubeBuilder.buildCube(cubeSpec.rows, cubeSpec.columns, cubeSpec.depth, spec.paths, entities, scene);

        const paths: Map<string, Path> = new Map<string, Path>();
        for (const pathName of Object.keys(spec.paths)) {
            const path: Path = new Path(cube, spec.paths[pathName]);
            paths.set(pathName, path);
        }

        const hud: HUD = HUD.buildHud(ui);
        hud.setDisplayCoinBalance(store.getBalance());
        hud.setDisplayTimer(0);
        
        const level: Level = new Level(spec, paths, scene, hud, entities, store);

        hud.setPlayButtonCallback(() => level.start());
        
        scene.onBeforeRenderObservable.add(() => level.update());

        return level;
    }


    private update(): void {
        if (this.started && !this.paused) {
            this.updateHud();
            if (this.checkForEndConditions()) {
                // do end-condition stuff
            }
        }
    }


    private updateHud(): void {
        this.updateDisplayTimer();
        this.updateDisplayCoinBalance();
    }


    private updateDisplayTimer(): void {
        this.playTimeElapsedSeconds += elapsedSinceLastFrameSeconds(this.scene.getEngine());
        this.hud.setDisplayTimer(this.playTimeElapsedSeconds);
    }


    private updateDisplayCoinBalance(): void {
        this.hud.setDisplayCoinBalance(this.store.getBalance());
    }


    private checkForEndConditions(): boolean {
        let result = false;
        if ((this.waves.length == this.spec.waves.length) && this.allActiveWavesComplete()) {
            console.log(this.waves.length);
            this.setPause(true);
            alert("You win!");
            result = true;
        }
        return result;
    }


    private allActiveWavesComplete(): boolean {
        // loop through waves in reverse because the last released is the least likely to be complete
        //  and we can stop checks early in that case
        for (let i = this.waves.length - 1; i >= 0; i--) {
            if (!this.waves[i].isComplete()) {
                return false;
            }
        }
        return true;
    }


    public start(): void {
        this.started = true;
        this.paused = false;
        this.releaseNextWave();
        this.hud.setPlayButtonText("Next Wave");
        this.hud.setPlayButtonCallback(() => this.releaseNextWave());
    }


    private releaseNextWave(): void {
        const waveIndex = this.waves.length;
        if (waveIndex < this.spec.waves.length) {
            const wave: Wave = Wave.buildWave(this.spec.waves[waveIndex], this.entities, this.paths, this.scene);
            this.waves.push(wave);
            wave.start();
        }
    }


    public setPause(pause: boolean): void {
        this.paused = pause;
        this.waves.forEach(w => w.setPause(pause));
        this.entities.setPause(pause);
    }


    public runRenderLoop(engine: Engine): void {
        const scene: Scene = this.scene;
        engine.runRenderLoop(() => scene.render());
        this.hud.show();
    }
}

export {Level, LevelSpec}