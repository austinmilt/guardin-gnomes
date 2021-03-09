import { Camera, Scene, UniversalCamera, Vector3 } from "@babylonjs/core"
import { CameraConfigs, DirectionVectors } from "../config/constants";
import { elapsedInEpochSeconds, nowInEpochSeconds } from "../util/timeUtil";


enum OrientationDirection {
    X_POSITIVE, X_NEGATIVE, Y_POSITIVE, Y_NEGATIVE, Z_POSITIVE, Z_NEGATIVE
}

const ORIENTATION_VECTORS: Map<OrientationDirection, Vector3> = new Map<OrientationDirection, Vector3>();
ORIENTATION_VECTORS.set(OrientationDirection.X_POSITIVE, DirectionVectors.RIGHT);
ORIENTATION_VECTORS.set(OrientationDirection.X_NEGATIVE, DirectionVectors.LEFT);
ORIENTATION_VECTORS.set(OrientationDirection.Y_POSITIVE, DirectionVectors.UP);
ORIENTATION_VECTORS.set(OrientationDirection.Y_NEGATIVE, DirectionVectors.DOWN);
ORIENTATION_VECTORS.set(OrientationDirection.Z_POSITIVE, DirectionVectors.FORWARD);
ORIENTATION_VECTORS.set(OrientationDirection.Z_NEGATIVE, DirectionVectors.BACKWARD);


class CubeCamera {
    private readonly camera: Camera;

    private lastPressedKey: string | null = null;
    private lastMoveUpdate: number = Number.MIN_VALUE;

    private up: OrientationDirection = OrientationDirection.Y_POSITIVE;
    private down: OrientationDirection = OrientationDirection.Y_NEGATIVE;
    private right: OrientationDirection = OrientationDirection.X_POSITIVE;
    private left: OrientationDirection = OrientationDirection.X_NEGATIVE;
    private forward: OrientationDirection = OrientationDirection.Z_POSITIVE;
    private backward: OrientationDirection = OrientationDirection.Z_NEGATIVE;
    private destination: Vector3 = new Vector3(0, 0, -CameraConfigs.DISTANCE_FROM_ZERO);


    private constructor(camera: Camera) {
        this.camera = camera;
    }


    public static buildCamera(scene: Scene, canvas: HTMLCanvasElement): CubeCamera {
        const babylonCamera = new UniversalCamera("player view", new Vector3(0, 0, -CameraConfigs.DISTANCE_FROM_ZERO), scene);
        babylonCamera.lockedTarget = Vector3.ZeroReadOnly;
        babylonCamera.setTarget(Vector3.ZeroReadOnly);
        scene.activeCamera = babylonCamera;
        babylonCamera.attachControl(canvas, true);
        babylonCamera.inputs.clear();
        
        const camera: CubeCamera = new CubeCamera(babylonCamera);

        canvas.addEventListener("keydown", e => camera.onKeyDown(e));
        canvas.addEventListener("keyup", e => camera.onKeyUp(e));
        scene.registerBeforeRender(() => camera.update());

        return camera;
    }


    private update(): void {
        if (Vector3.DistanceSquared(this.camera.position, this.destination) > CameraConfigs.DESTINATION_EPSILON) {
            const secondsElapsedSinceLastUpdate = elapsedInEpochSeconds(this.lastMoveUpdate);
            const lerpAmount: number = Math.min(1, secondsElapsedSinceLastUpdate / CameraConfigs.LERP_SPEED_SECONDS_TO_DESTINATION);
            Vector3.Lerp(this.camera.position, this.destination, lerpAmount).normalize().scaleToRef(CameraConfigs.DISTANCE_FROM_ZERO, this.camera.position);
        }
    }


    private onKeyUp(event: KeyboardEvent): void {
        if (!event.isComposing && (event.key === this.lastPressedKey)) {
            this.lastPressedKey = null;
        }
    }


    private onKeyDown(event: KeyboardEvent): void {
        if (!event.isComposing && (this.lastPressedKey === null)) {
            switch (event.key) {
                case 'w':
                    this.setDestination(this.up);
                    this.camera.upVector = ORIENTATION_VECTORS.get(this.forward)!;
                    this.updateOrientationParts(this.forward, this.backward, this.right, this.left, this.down, this.up);
                    this.lastPressedKey = 'w';
                    this.lastMoveUpdate = nowInEpochSeconds();
                    break;
    
                case 'a':
                    this.setDestination(this.left);
                    this.updateOrientationParts(this.up, this.down, this.backward, this.forward, this.right, this.left);
                    this.lastPressedKey = 'a';
                    this.lastMoveUpdate = nowInEpochSeconds();
                    break;
                    
                case 's':
                    this.setDestination(this.down);
                    this.camera.upVector = ORIENTATION_VECTORS.get(this.backward)!;
                    this.updateOrientationParts(this.backward, this.forward, this.right, this.left, this.up, this.down);
                    this.lastPressedKey = 's';
                    this.lastMoveUpdate = nowInEpochSeconds();
                    break;
    
                case 'd':
                    this.setDestination(this.right);
                    this.updateOrientationParts(this.up, this.down, this.forward, this.backward, this.left, this.right);
                    this.lastPressedKey = 'd';
                    this.lastMoveUpdate = nowInEpochSeconds();
                    break;
            }
        }
    }


    private setDestination(moveTo: OrientationDirection): void {
        ORIENTATION_VECTORS.get(moveTo)!.scaleToRef(CameraConfigs.DISTANCE_FROM_ZERO, this.destination);
    }


    private updateOrientationParts(up: OrientationDirection, 
        down: OrientationDirection, 
        right: OrientationDirection, 
        left: OrientationDirection, 
        forward: OrientationDirection, 
        backward: OrientationDirection): void {

            this.up = up;
            this.down = down;
            this.right = right;
            this.left = left;
            this.forward = forward;
            this.backward = backward;
    }
}


export {CubeCamera}