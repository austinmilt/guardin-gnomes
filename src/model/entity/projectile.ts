import { Mesh, Scene, Vector3 } from "@babylonjs/core";
import { ProjectileConfigs } from "../../config/constants";
import { elapsedSinceLastFrameSeconds } from "../../util/timeUtil";
import { DynamicEntity } from "../dynamicEntity";
import { Attackee } from "./component/attackee";

interface ProjectileAttributes {
    readonly damage: number;
    readonly speedUnitsPerSecond: number;
}

class Projectile extends DynamicEntity {
    private readonly mesh: Mesh;
    private readonly target: Attackee;
    private readonly attributes: ProjectileAttributes;
    private readonly heading: Vector3 = new Vector3();

    private constructor(scene: Scene, mesh: Mesh, target: Attackee, attributes: ProjectileAttributes) {
        super(scene);
        this.mesh = mesh;
        this.target = target;
        this.attributes = attributes;
    }


    public static build(mesh: Mesh, startingPosition: Vector3, target: Attackee, attributes: ProjectileAttributes): Projectile {
        mesh.position = startingPosition;
        return new Projectile(mesh.getScene(), mesh, target, attributes);
    }


    subclassUpdate(): void {
        if (this.hasReachedDestination()) {
            this.markedForDestruction = true;
            this.target.receiveAttack(this.attributes.damage);

        } else {
            this.updatePosition();
        }
    }


    private hasReachedDestination(): boolean {
        return Vector3.DistanceSquared(this.mesh.position, this.target.getPosition()) < ProjectileConfigs.DESTINATION_EPSILON;
    }


    private updatePosition(): void {
        const distanceTraveledThisFrame = this.attributes.speedUnitsPerSecond * elapsedSinceLastFrameSeconds(this.engine);
        this.target.getPosition().subtractToRef(this.mesh.position, this.heading);
        this.heading.normalize().scaleInPlace(distanceTraveledThisFrame);
        this.mesh.position.addInPlace(this.heading);
    }


    subclassDestroy(): void {
        this.mesh.dispose(false, false);
    }


    public getPosition(): Vector3 {
        return this.mesh.position;
    }
}


export {Projectile, ProjectileAttributes}