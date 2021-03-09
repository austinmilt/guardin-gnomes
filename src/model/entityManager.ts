import { AssetContainer, AssetsManager, Mesh, MeshAssetTask, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { ModelSpec, ModelSpecs } from "../config/constants";
import { Invader, InvaderOptions } from "./invader";
import { Defender, DefenderOptions } from "./defender";
import { DynamicEntity } from "./dynamicEntity";
import { EntityType } from "./entityType";
import { Face } from "./face";
import { Path } from "./path";
import { Store } from "./store";
import { Tile } from "./tile";
import { Projectile, ProjectileAttributes } from "./entity/projectile";
import { Attackee } from "./entity/component/attackee";


class EntityManager {
    private readonly meshOriginals: Map<EntityType, AssetContainer> = new Map<EntityType, AssetContainer>();
    private readonly invaders: Set<Invader> = new Set<Invader>();
    private readonly defenders: Set<Defender> = new Set<Defender>();
    private readonly tiles: Set<Tile> = new Set<Tile>();
    private readonly projectiles: Set<Projectile> = new Set<Projectile>();
    private readonly scene: Scene;
    private store: Store | undefined = undefined;

    constructor(scene: Scene) {
        this.scene = scene;
        this.scene.onAfterRenderObservable.add(() => this.update());
    }


    public static build(scene: Scene): EntityManager {
        return new EntityManager(scene);
    }


    public async initialize(store: Store, entityTypesToPrep: EntityType[]): Promise<void> {
        this.store = store;
        await this.loadOriginals(this.scene, entityTypesToPrep);
    }


    private async loadOriginals(scene: Scene, entityTypesToPrep: EntityType[]): Promise<void> {
        const assetsManager: AssetsManager = new AssetsManager(scene);
        for (const t of entityTypesToPrep) {
            let modelSpec: ModelSpec;
            const postProcessor: ((node: TransformNode) => void) | undefined = undefined;
            switch (t) {
                case EntityType.invader: 
                    modelSpec = ModelSpecs.GNOME;
                    break;
                    
                case EntityType.DEFENDER:
                    modelSpec = ModelSpecs.TOWER;
                    break;

                case EntityType.TILE:
                    modelSpec = ModelSpecs.TILE;
                    break;

                case EntityType.PROJECTILE:
                    modelSpec = ModelSpecs.PROJECTILE;
                    break;
            }
            this.addMeshOriginalLoadTask(assetsManager, t, modelSpec, postProcessor);
        }
        return assetsManager.loadAsync();
    }


    private addMeshOriginalLoadTask(assetsManager: AssetsManager, type: EntityType, spec: ModelSpec, postProcessor?: (node: TransformNode) => void): void {
        const scene = this.scene;
        const meshAssetTask: MeshAssetTask = assetsManager.addMeshTask(`${spec.name}-load-task`, spec.meshNames, spec.model, "");
        meshAssetTask.onSuccess = (task): void => {
            const node: TransformNode = new TransformNode(`${spec.name}`, scene);
            for (const mesh of task.loadedMeshes) {
                if (spec.meshNames.includes(mesh.name)) {
                    mesh.parent = node;
                    mesh.setEnabled(false);
                }
            }
            node.scaling.multiplyInPlace(new Vector3(spec.scale, spec.scale, spec.scale));
            node.setEnabled(false);
            if (postProcessor !== undefined) {
                postProcessor(node);
            }
            const container: AssetContainer = new AssetContainer(scene);
            container.transformNodes.push(node);
            this.meshOriginals.set(type, container);
        }
    }


    public addTile(face: Face, row: number, column: number, isPartOfPath: boolean, meshPreProcessor: (mesh: Mesh) => void): Tile {
        const mesh: Mesh = this.cloneOriginal(EntityType.TILE, `${Face[face]}-${row}-${column}`).getChildMeshes()[0] as Mesh;
        meshPreProcessor(mesh);
        const result: Tile = new Tile(face, row, column, isPartOfPath, mesh, this.store!);
        this.tiles.add(result);
        return result;
    }

    
    public addInvader(name: string, path: Path, options?: InvaderOptions): Invader {
        const result: Invader = new Invader(this, path, this.cloneOriginal(EntityType.invader, name), this.store!, options);
        this.invaders.add(result);
        return result;
    }

    
    public addDefender(name: string, tile: Tile, options?: DefenderOptions): Defender {
        const result: Defender = new Defender(this, tile, this.cloneOriginal(EntityType.DEFENDER, name), options);
        this.defenders.add(result);
        return result;
    }


    public addProjectile(emitFrom: Vector3, target: Attackee, attributes: ProjectileAttributes): Projectile {
        const mesh: Mesh = this.cloneOriginal(EntityType.PROJECTILE, 'projectile');
        const result: Projectile = Projectile.build(mesh, emitFrom, target, attributes);
        this.projectiles.add(result);
        return result;
    }


    private cloneOriginal(type: EntityType, name: string): Mesh {
        const result = this.meshOriginals.get(type)!.instantiateModelsToScene(() => name, true);
        const mesh: Mesh = result.rootNodes[0] as Mesh;
        EntityManager.enableNodeHierarchy(mesh);
        return mesh;
    }


    private static enableNodeHierarchy(mesh: Mesh): void {
        mesh.setEnabled(true);
        for (const child of mesh.getChildMeshes()) {
            EntityManager.enableNodeHierarchy(child as Mesh);
        }
    }
    

    public getClosestInvader(point: Vector3, maxDistance?: number): Invader | null {
        return EntityManager.getClosestEntity(point, this.invaders, maxDistance);
    }


    public getClosestDefender(point: Vector3, maxDistance?: number): Defender | null {
        return EntityManager.getClosestEntity(point, this.defenders, maxDistance);
    }


    private static getClosestEntity<T extends DynamicEntity>(point: Vector3, entitySubset: Set<T>, maxDistance?: number): T | null {
        let result: T | null = null;
        let minDistanceSquared = Number.MAX_VALUE;
        const maxDistanceSquared = maxDistance === undefined ? Number.MAX_VALUE : maxDistance*maxDistance;
        for (const entity of entitySubset) {
            const distanceSquared: number = Vector3.DistanceSquared(point, entity.getPosition());
            if ((distanceSquared < maxDistanceSquared) && (distanceSquared < minDistanceSquared)) {
                result = entity;
                minDistanceSquared = distanceSquared;
            }
        }
        return result;
    }


    private update(): void {
        this.projectiles.forEach(this.destroyProjectileIfNeeded, this);
        this.invaders.forEach(this.destroyInvaderIfNeeded, this);
        this.defenders.forEach(this.destroyDefenderIfNeeded, this);
    }
    
    
    public setPause(pause: boolean): void {
        this.invaders.forEach(e => e.setPause(pause));
        this.defenders.forEach(e => e.setPause(pause));
        this.projectiles.forEach(e => e.setPause(pause));
    }


    private destroyInvaderIfNeeded(invader: DynamicEntity): void {
        this.destroyEntityIfNeeded(invader, this.invaders);
    }


    private destroyDefenderIfNeeded(defender: DynamicEntity): void {
        this.destroyEntityIfNeeded(defender, this.defenders);
    }


    private destroyProjectileIfNeeded(projectile: DynamicEntity): void {
        this.destroyEntityIfNeeded(projectile, this.projectiles);
    }


    private destroyEntityIfNeeded(entity: DynamicEntity, collection: Set<DynamicEntity>): void {
        if (entity.isMarkedForDestruction()) {
            entity.destroy();
            collection.delete(entity);
        }
    }
}


export {EntityManager, EntityType};