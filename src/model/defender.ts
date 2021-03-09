import { Mesh, Quaternion, Vector3 } from "@babylonjs/core";
import { CellDimensions, DefenderDefaultOptions, DirectionVectors } from "../config/constants";
import { Invader } from "./invader";
import { DynamicEntity } from "./dynamicEntity";
import { EntityManager } from "./entityManager";
import { Tile } from "./tile";
import { Attackee } from "./entity/component/attackee";

interface DefenderOptions {
    readonly health?: number;
    readonly attacksPerSecond?: number;
    readonly damagePerHit?: number;
    readonly attackRangeTiles?: number;
}

interface Attributes {
    health: number;
    attacksPerSecond: number;
    damagePerHit: number;
    attackRangeTiles: number;
}

class Defender extends DynamicEntity implements Attackee {
    private readonly entities: EntityManager;
    private readonly tile: Tile;
    private readonly mesh: Mesh;
    private readonly options: DefenderOptions;
    private readonly attributes: Attributes;

    private lastAttackEpochMs = 0.0;
    
    constructor(entities: EntityManager, tile: Tile, mesh: Mesh, options?: DefenderOptions) {
        super(mesh.getScene());
        this.entities = entities;
        this.tile = tile;
        this.mesh = mesh;
        this.options = Defender.buildOptions(options);
        this.attributes = Defender.buildAttributes(this.options);
        this.initialize();
    }


    private static buildOptions(givenOptions?: DefenderOptions): DefenderOptions {
        return {
            health: givenOptions?.health ? givenOptions.health : DefenderDefaultOptions.HEALTH,
            attacksPerSecond: givenOptions?.attacksPerSecond ? givenOptions.attacksPerSecond : DefenderDefaultOptions.ATTACKS_PER_SECOND,
            damagePerHit: givenOptions?.damagePerHit ? givenOptions.damagePerHit : DefenderDefaultOptions.DAMAGE_PER_HIT,
            attackRangeTiles: givenOptions?.attackRangeTiles ? givenOptions.attackRangeTiles : DefenderDefaultOptions.ATTACK_RANGE_TILES,
        }
    }

    
    private static buildAttributes(options: DefenderOptions): Attributes {
        return {
            health: options.health!,
            attacksPerSecond: options.attacksPerSecond!,
            damagePerHit: options.damagePerHit!,
            attackRangeTiles: options.attackRangeTiles!,
        }
    }


    private initialize(): void {
        this.mesh.position = this.tile.getSurfaceCenter();
        this.mesh.rotationQuaternion = Quaternion.Identity();
        const faceNormal: Vector3 = this.tile.getSurfaceNormal();
        // using Vector3.UpReadonly means we're assuming the mesh is initially oriented with its "up" as Vector3.Up
        Quaternion.FromUnitVectorsToRef(DirectionVectors.UP, faceNormal, this.mesh.rotationQuaternion!);
    }
    
    
    subclassUpdate(): void {
        this.attack();
        if (this.attributes.health <= 0) {
            this.markedForDestruction = true;
        }
    }


    private attack(): void {
        const nowEpochMs: number = Date.now();
        const secondsElapsedSinceLastAttack = (nowEpochMs - this.lastAttackEpochMs) / 1000.0;
        if (secondsElapsedSinceLastAttack > (1.0 / this.attributes.attacksPerSecond)) {
            const attackRange = CellDimensions.DIAGONAL_LENGTH*this.attributes.attackRangeTiles;
            const target: Invader | null = this.entities.getClosestInvader(this.mesh.position, attackRange);
            if (target != null) {
                this.entities.addProjectile(this.mesh.position.clone(), target, {speedUnitsPerSecond: 5.0, damage: this.attributes.damagePerHit});
                this.lastAttackEpochMs = nowEpochMs;
            }
        }
    }


    public receiveAttack(damage: number): void {
        this.attributes.health -= damage;
        console.log(`Defender hurt! Health=${this.attributes.health}`);
    }


    subclassDestroy(): void {
        this.mesh.dispose(false, false);
    }


    public getPosition(): Vector3 {
        return this.mesh.position;
    }
}

export {Defender, DefenderOptions};