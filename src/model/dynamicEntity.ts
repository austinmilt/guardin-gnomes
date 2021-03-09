import { Engine, Nullable, Observer, Scene, Vector3 } from "@babylonjs/core";

abstract class DynamicEntity {
    protected readonly scene: Scene;
    protected readonly engine: Engine;
    protected markedForDestruction = false;

    private readonly updateObserver: Nullable<Observer<Scene>>;

    private paused = false;

    constructor(scene: Scene) {
        this.scene = scene;
        this.engine = scene.getEngine();
        this.updateObserver = scene.onBeforeRenderObservable.add(() => this.update());
    }

    abstract subclassUpdate(): void;

    private update(): void {
        if (!this.paused) {
            this.subclassUpdate();
        }
    }

    public setPause(pause: boolean): void {
        this.paused = pause;
    }

    public destroy(): void {
        this.subclassDestroy();
        this.scene.onBeforeRenderObservable.remove(this.updateObserver);
    }

    abstract subclassDestroy(): void;

    public abstract getPosition(): Vector3;

    public isMarkedForDestruction(): boolean {
        return this.markedForDestruction;
    }

}

export {DynamicEntity};