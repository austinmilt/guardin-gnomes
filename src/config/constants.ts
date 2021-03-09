import { Vector3 } from "@babylonjs/core";

import TILE_MODEL from "../../assets/Square Tile.glb";
import GNOME_MODEL from "../../assets/Enemy Gnome.glb";
import TOWER_MODEL from "../../assets/Tower.glb";
import PROJECTILE_MODEL from "../../assets/Projectile.glb";

class TileDimensions {
    public static readonly WIDTH = 2.0;
    public static readonly HEIGHT = 2.0;
    public static readonly DEPTH = 0.2;
}

class PlayerDefaultOptions {
    public static readonly STARTING_COINS = 200;
}

class InvaderDefaultOptions {
   public static readonly SPEED_TILES_PER_SECOND = 1.0;
   public static readonly DAMAGE_PER_HIT = 20.0;
   public static readonly ATTACKS_PER_SECOND = 1.0;
   public static readonly HEALTH = 100.0;
   public static readonly ATTACK_RANGE_TILES = 1.0;
   public static readonly COINS = 100;
}

class DefenderDefaultOptions {
    public static readonly HEALTH = 100.0;
    public static readonly DAMAGE_PER_HIT = 50.0;
    public static readonly ATTACKS_PER_SECOND = 1.0;
    public static readonly ATTACK_RANGE_TILES = 2.0;
}

class DefenderCosts {
    public static readonly DEFENDER = 200;
}

class CellDimensions {
    public static readonly DISTANCE_BETWEEN_TILES = 0.05;
    public static readonly WIDTH = TileDimensions.WIDTH + CellDimensions.DISTANCE_BETWEEN_TILES;
    public static readonly HEIGHT = TileDimensions.WIDTH + CellDimensions.DISTANCE_BETWEEN_TILES;
    public static readonly DEPTH = TileDimensions.DEPTH;
    public static readonly HALF_WIDTH = 0.5*CellDimensions.WIDTH;
    public static readonly HALF_HEIGHT = 0.5*CellDimensions.HEIGHT;
    public static readonly DIAGONAL_LENGTH = Math.sqrt(CellDimensions.WIDTH*CellDimensions.WIDTH + CellDimensions.HEIGHT*CellDimensions.HEIGHT);
}

class CameraConfigs {
    public static readonly DISTANCE_FROM_ZERO = 50;
    public static readonly LERP_SPEED_SECONDS_TO_DESTINATION = 0.5;

    /**
     * Distance (in world units) squared from destination vector at which camera should stop
     * lerp'ing toward the destination.
     */
    public static readonly DESTINATION_EPSILON = 0.01; 
}

class ProjectileConfigs {
    /**
     * Distance (in world units) squared from destination vector at which projectiles should
     * conclude they are "there" and do damage to the target.
     */
    public static readonly DESTINATION_EPSILON = 0.01; 
}

class DirectionVectors {
    public static readonly BACKWARD: Vector3 = Vector3.Backward();
    public static readonly FORWARD: Vector3 = Vector3.Forward();
    public static readonly LEFT: Vector3 = Vector3.Left();
    public static readonly RIGHT: Vector3 = Vector3.Right();
    public static readonly UP: Vector3 = Vector3.Up();
    public static readonly DOWN: Vector3 = Vector3.Down();
}

interface ModelSpec {
    readonly name: string;
    readonly model: string;
    readonly meshNames: string[];
    readonly scale: number;
}

class ModelSpecs {
    public static readonly TILE: ModelSpec = {name: "tile", model: TILE_MODEL, meshNames: ["Tile"], scale: 1};
    public static readonly TOWER: ModelSpec = {name: "tower", model: TOWER_MODEL, meshNames: ["Base", "Top"], scale: 1};
    public static readonly GNOME: ModelSpec = {name: "gnome", model: GNOME_MODEL, meshNames: ["Body", "Hat", "Left Arm", "Left Foot", "Right Arm", "Right Foot", "Nose"], scale: 0.25};
    public static readonly PROJECTILE: ModelSpec = {name: "projectile", model: PROJECTILE_MODEL, meshNames: ["Projectile"], scale: 0.1};
}

export {
    TileDimensions,
    CellDimensions,
    CameraConfigs,
    ProjectileConfigs,
    DirectionVectors,
    PlayerDefaultOptions,
    InvaderDefaultOptions,
    DefenderDefaultOptions,
    DefenderCosts,
    ModelSpecs,
    ModelSpec
};