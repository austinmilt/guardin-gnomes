import { Mesh, Quaternion, Vector3 } from "@babylonjs/core";
import { InvaderDefaultOptions, CellDimensions, DirectionVectors } from "../config/constants";
import { elapsedSinceLastFrameSeconds } from "../util/timeUtil";
import { Defender } from "./defender";
import { DynamicEntity } from "./dynamicEntity";
import { Attackee } from "./entity/component/attackee";
import { EntityManager } from "./entityManager";
import { Path } from "./path";
import { Store } from "./store";
import { Tile } from "./tile";


interface InvaderOptions {
    readonly speedTilesPerSecond?: number;
    readonly health?: number;
    readonly damagePerHit?: number;
    readonly attacksPerSecond?: number;
    readonly attackRangeTiles?: number;
    readonly coins?: number;
}


interface Attributes {
    speedTilesPerSecond: number;
    health: number;
    damagePerHit: number;
    attacksPerSecond: number;
    attackRangeTiles: number;
    coins: number;
}


class Invader extends DynamicEntity implements Attackee {
    private readonly entities: EntityManager;
    private readonly path: Path;
    private readonly options: InvaderOptions;
    private readonly attributes: Attributes;
    private readonly mesh: Mesh;
    private readonly store: Store;

    private lastAttackEpochMs = 0.0;
    private tileDistanceAlongPath = 0.0;
    
    constructor(entities: EntityManager, path: Path, mesh: Mesh, store: Store, options?: InvaderOptions) {
        super(mesh.getScene());
        this.path = path;
        this.options = Invader.buildOptions(options);
        this.attributes = Invader.buildAttributes(this.options);
        this.mesh = mesh;
        this.entities = entities;
        this.store = store;
        this.initialize();
    }


    private static buildOptions(givenOptions?: InvaderOptions): InvaderOptions {
        return {
            health: givenOptions?.health ? givenOptions.health : InvaderDefaultOptions.HEALTH,
            attacksPerSecond: givenOptions?.attacksPerSecond ? givenOptions.attacksPerSecond : InvaderDefaultOptions.ATTACKS_PER_SECOND,
            damagePerHit: givenOptions?.damagePerHit ? givenOptions.damagePerHit : InvaderDefaultOptions.DAMAGE_PER_HIT,
            speedTilesPerSecond: givenOptions?.speedTilesPerSecond ? givenOptions.speedTilesPerSecond : InvaderDefaultOptions.SPEED_TILES_PER_SECOND,
            attackRangeTiles: givenOptions?.attackRangeTiles ? givenOptions.attackRangeTiles : InvaderDefaultOptions.ATTACK_RANGE_TILES,
            coins: givenOptions?.coins ? givenOptions.coins : InvaderDefaultOptions.COINS,
        }
    }


    private static buildAttributes(options: InvaderOptions): Attributes {
        return {
            health: options.health!,
            attacksPerSecond: options.attacksPerSecond!,
            damagePerHit: options.damagePerHit!,
            speedTilesPerSecond: options.speedTilesPerSecond!,
            attackRangeTiles: options.attackRangeTiles!,
            coins: options.coins!
        }
    }


    private initialize(): void {
        this.mesh.rotationQuaternion = Quaternion.Identity();
    }


    subclassUpdate(): void {
        this.attack();
        this.updateInSpace();
        this.checkDeath();
    }


    public receiveAttack(damage: number): void {
        this.attributes.health -= damage;
        console.log(`Invader hurt! Health=${this.attributes.health}`);
    }


    private attack(): void {
        const nowEpochMs: number = Date.now();
        const secondsElapsedSinceLastAttack = (nowEpochMs - this.lastAttackEpochMs) / 1000.0;
        if (secondsElapsedSinceLastAttack > (1.0 / this.attributes.attacksPerSecond)) {
            const attackRange = CellDimensions.DIAGONAL_LENGTH*this.attributes.attackRangeTiles;
            const target: Defender | null = this.entities.getClosestDefender(this.mesh.position, attackRange);
            if (target != null) {
                this.entities.addProjectile(this.mesh.position.clone(), target, {speedUnitsPerSecond: 5.0, damage: this.attributes.damagePerHit});
                this.lastAttackEpochMs = nowEpochMs;
            }
        }
    }


    private updateInSpace(): void {
        const currentTileIndex: number = Math.floor(this.tileDistanceAlongPath);
        const previousTile: Tile = this.path.getPrevious(currentTileIndex);
        const currentTile: Tile = this.path.get(currentTileIndex);
        const nextTile: Tile = this.path.getNext(currentTileIndex);
        this.updatePosition(previousTile, currentTile, nextTile);
        this.updateRotation(currentTile);
        this.checkDeath();
    }


    private checkDeath(): void {
        if ((this.markedForDestruction != true) && (this.attributes.health <= 0)) {
            this.markedForDestruction = true;
            this.store.depositCoins(this.attributes.coins);
        }
    }
    
    
    private updatePosition(previousTile: Tile, currentTile: Tile, nextTile: Tile): void {
        const propDistanceAlongTile: number = this.tileDistanceAlongPath % 1.0;
        const myStartOnCurrentTile: Vector3 = currentTile.getCoincidentEdgeCenter(previousTile);
        const myEndOnCurrentTile: Vector3 = currentTile.getCoincidentEdgeCenter(nextTile);
        const direction: Vector3 = myEndOnCurrentTile.subtract(myStartOnCurrentTile).normalize();
        const distanceBetweenStartAndEnd: number = Vector3.Distance(myEndOnCurrentTile, myStartOnCurrentTile);
        const distanceAlongTrajectory: number = propDistanceAlongTile*distanceBetweenStartAndEnd;
        this.mesh.position = myStartOnCurrentTile.add(direction.multiplyByFloats(distanceAlongTrajectory, distanceAlongTrajectory, distanceAlongTrajectory));
        this.tileDistanceAlongPath = (this.tileDistanceAlongPath + elapsedSinceLastFrameSeconds(this.engine) * this.attributes.speedTilesPerSecond) % this.path.getLength();
    }


    private updateRotation(currentTile: Tile): void {
        const faceNormal: Vector3 = currentTile.getSurfaceNormal();
        // using Vector3.UpReadonly means we're assuming the mesh is initially oriented with its "up" as Vector3.Up
        Quaternion.FromUnitVectorsToRef(DirectionVectors.UP, faceNormal, this.mesh.rotationQuaternion!);
    }


    subclassDestroy(): void {
        this.mesh.dispose(false, false);
    }


    public getPosition(): Vector3 {
        return this.mesh.position;
    }
}


export {Invader, InvaderOptions};