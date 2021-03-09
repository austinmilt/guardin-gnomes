import { ActionEvent, ActionManager, Color3, ExecuteCodeAction, Mesh, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
import { CellDimensions, DirectionVectors } from "../config/constants";
import { Direction } from "./direction";
import { Face } from "./face";
import { Store } from "./store";


class Tile {
    private readonly face: Face;
    private readonly row: number;
    private readonly column: number;
    private readonly isPartOfPathFlag: boolean;
    private readonly mesh: Mesh;
    private readonly scene: Scene;
    private readonly normal: Vector3;
    private readonly surfaceCenter: Vector3;
    private readonly edgeCenters: Map<Direction, Vector3>;
    private readonly store: Store;

    public constructor(face: Face, row: number, column: number, isPartOfPathFlag: boolean, mesh: Mesh, store: Store) {
        this.face = face;
        this.row = row;
        this.column = column;
        this.isPartOfPathFlag = isPartOfPathFlag;
        this.mesh = mesh;
        this.store = store;
        this.scene = mesh.getScene();
        this.normal = Tile.getFaceNormal(face);
        this.surfaceCenter = Tile.calculateSurfaceCenter(face, mesh.position);
        this.edgeCenters = Tile.calculateEdgeCenters(face, this.surfaceCenter);
        this.initialize();
    }


    private static calculateSurfaceCenter(face: Face, centroid: Vector3): Vector3 {
        const surfaceNormal: Vector3 = Tile.getFaceNormal(face);
        return new Vector3(centroid.x + surfaceNormal.x*CellDimensions.DEPTH, centroid.y + surfaceNormal.y*CellDimensions.DEPTH, centroid.z + surfaceNormal.z*CellDimensions.DEPTH);
    }


    private static getFaceNormal(face: Face): Vector3 {
        switch (face) {
            case Face.FRONT:
                return DirectionVectors.BACKWARD;

            case Face.TOP:
                return DirectionVectors.UP;

            case Face.LEFT:
                return DirectionVectors.LEFT;

            case Face.BACK:
                return DirectionVectors.FORWARD

            case Face.RIGHT:
                return DirectionVectors.RIGHT

            case Face.BOTTOM:
                return DirectionVectors.DOWN;
        }
    }


    private static calculateEdgeCenters(face: Face, surfaceCenter: Vector3): Map<Direction, Vector3> {
        const result: Map<Direction, Vector3> = new Map<Direction, Vector3>();
        switch (face) {
            case Face.FRONT:
                result.set(Direction.LEFT, new Vector3(surfaceCenter.x - CellDimensions.HALF_WIDTH, surfaceCenter.y, surfaceCenter.z));
                result.set(Direction.UP, new Vector3(surfaceCenter.x, surfaceCenter.y + CellDimensions.HALF_HEIGHT, surfaceCenter.z));
                result.set(Direction.RIGHT, new Vector3(surfaceCenter.x + CellDimensions.HALF_WIDTH, surfaceCenter.y, surfaceCenter.z));
                result.set(Direction.DOWN, new Vector3(surfaceCenter.x, surfaceCenter.y - CellDimensions.HALF_HEIGHT, surfaceCenter.z));
                break;

            case Face.LEFT:
                result.set(Direction.LEFT, new Vector3(surfaceCenter.x, surfaceCenter.y, surfaceCenter.z - CellDimensions.HALF_WIDTH));
                result.set(Direction.UP, new Vector3(surfaceCenter.x, surfaceCenter.y + CellDimensions.HALF_HEIGHT, surfaceCenter.z));
                result.set(Direction.RIGHT, new Vector3(surfaceCenter.x, surfaceCenter.y, surfaceCenter.z + CellDimensions.HALF_WIDTH));
                result.set(Direction.DOWN, new Vector3(surfaceCenter.x, surfaceCenter.y - CellDimensions.HALF_HEIGHT, surfaceCenter.z));
                break;

            case Face.BACK:
                result.set(Direction.LEFT, new Vector3(surfaceCenter.x + CellDimensions.HALF_WIDTH, surfaceCenter.y, surfaceCenter.z));
                result.set(Direction.UP, new Vector3(surfaceCenter.x, surfaceCenter.y + CellDimensions.HALF_HEIGHT, surfaceCenter.z));
                result.set(Direction.RIGHT, new Vector3(surfaceCenter.x - CellDimensions.HALF_WIDTH, surfaceCenter.y, surfaceCenter.z));
                result.set(Direction.DOWN, new Vector3(surfaceCenter.x, surfaceCenter.y - CellDimensions.HALF_HEIGHT, surfaceCenter.z));
                break;

            case Face.RIGHT:
                result.set(Direction.LEFT, new Vector3(surfaceCenter.x, surfaceCenter.y, surfaceCenter.z - CellDimensions.HALF_WIDTH));
                result.set(Direction.UP, new Vector3(surfaceCenter.x, surfaceCenter.y + CellDimensions.HEIGHT, surfaceCenter.z));
                result.set(Direction.RIGHT, new Vector3(surfaceCenter.x, surfaceCenter.y, surfaceCenter.z + CellDimensions.HALF_WIDTH));
                result.set(Direction.DOWN, new Vector3(surfaceCenter.x, surfaceCenter.y - CellDimensions.HALF_HEIGHT, surfaceCenter.z));
                break;

            case Face.TOP:
                result.set(Direction.LEFT, new Vector3(surfaceCenter.x - CellDimensions.HALF_WIDTH, surfaceCenter.y, surfaceCenter.z));
                result.set(Direction.UP, new Vector3(surfaceCenter.x, surfaceCenter.y, surfaceCenter.z + CellDimensions.HALF_HEIGHT));
                result.set(Direction.RIGHT, new Vector3(surfaceCenter.x + CellDimensions.HALF_WIDTH, surfaceCenter.y, surfaceCenter.z));
                result.set(Direction.DOWN, new Vector3(surfaceCenter.x, surfaceCenter.y, surfaceCenter.z - CellDimensions.HALF_HEIGHT));
                break;
                
            case Face.BOTTOM:
                result.set(Direction.LEFT, new Vector3(surfaceCenter.x - CellDimensions.HALF_WIDTH, surfaceCenter.y, surfaceCenter.z));
                result.set(Direction.UP, new Vector3(surfaceCenter.x, surfaceCenter.y, surfaceCenter.z - CellDimensions.HALF_HEIGHT));
                result.set(Direction.RIGHT, new Vector3(surfaceCenter.x + CellDimensions.HALF_WIDTH, surfaceCenter.y, surfaceCenter.z));
                result.set(Direction.DOWN, new Vector3(surfaceCenter.x, surfaceCenter.y, surfaceCenter.z + CellDimensions.HALF_HEIGHT));
                break;
        }
        return result;
    }


    private initialize(): void {
        this.mesh.isPickable = !this.isPartOfPathFlag;
        this.mesh.actionManager = new ActionManager(this.scene);
        
        const material = new StandardMaterial('tile mat', this.scene);
        this.mesh.material = material;
        this.setDefaultColor();

        this.mesh.material = material;
        this.mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, e => this.onPick(e)));
        this.mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, e => this.onPointerOver(e)));
        this.mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, e => this.onPointerOut(e)));
    }


    private setDefaultColor(): void {
        const material = (this.mesh.material as StandardMaterial);
        if (this.isPartOfPathFlag) {
            material.diffuseColor = Color3.Gray();
            return;
        }
        switch (this.face) {
            case Face.FRONT:
                material.diffuseColor = Color3.White();
                break;
    
            case Face.LEFT:
                material.diffuseColor = Color3.Teal();
                break;
    
            case Face.BACK:
                material.diffuseColor = Color3.Yellow();
                break;
    
            case Face.RIGHT:
                material.diffuseColor = Color3.Purple();
                break;
    
            case Face.TOP:
                material.diffuseColor = Color3.Blue();
                break;
    
            case Face.BOTTOM:
                material.diffuseColor = Color3.Green();
                break;
        }
    }


    private onPick(event: ActionEvent): void {
        this.store.openStore(this);
    }
    
    
    private onPointerOver(event: ActionEvent): void {
        (this.mesh.material as StandardMaterial).diffuseColor = Color3.Red();
    }


    private onPointerOut(event: ActionEvent): void {
        this.setDefaultColor();
    }


    public getFace(): Face {
        return this.face;
    }


    public getRow(): number {
        return this.row;
    }


    public getColumn(): number {
        return this.column;
    }


    public isPartOfPath(): boolean {
        return this.isPartOfPathFlag;
    }


    public getCentroid(): Vector3 {
        return this.mesh.position;
    }


    public getSurfaceCenter(): Vector3 {
        return this.surfaceCenter;
    }


    public getCoincidentEdgeCenter(other: Tile): Vector3 {
        const towardOther: Vector3 = other.surfaceCenter.subtract(this.surfaceCenter);
        let edge: Direction;
        switch (this.face) {
            case Face.FRONT:
                if (Math.abs(towardOther.x) > Math.abs(towardOther.y)) {
                    edge = towardOther.x < 0 ? Direction.LEFT : Direction.RIGHT;

                } else {
                    edge = towardOther.y < 0 ? Direction.DOWN : Direction.UP;
                }
                break;

            case Face.LEFT:
                if (Math.abs(towardOther.z) > Math.abs(towardOther.y)) {
                    edge = towardOther.z < 0 ? Direction.LEFT : Direction.RIGHT;

                } else {
                    edge = towardOther.y < 0 ? Direction.DOWN : Direction.UP;
                }
                break;

            case Face.BACK:
                if (Math.abs(towardOther.x) > Math.abs(towardOther.y)) {
                    edge = towardOther.x < 0 ? Direction.RIGHT : Direction.LEFT;

                } else {
                    edge = towardOther.y < 0 ? Direction.DOWN : Direction.UP;
                }
                break;

            case Face.RIGHT:
                if (Math.abs(towardOther.z) > Math.abs(towardOther.y)) {
                    edge = towardOther.z < 0 ? Direction.RIGHT : Direction.LEFT;

                } else {
                    edge = towardOther.y < 0 ? Direction.DOWN : Direction.UP;
                }
                break;

            case Face.TOP:
                if (Math.abs(towardOther.x) > Math.abs(towardOther.z)) {
                    edge = towardOther.x < 0 ? Direction.LEFT : Direction.RIGHT;

                } else {
                    edge = towardOther.z < 0 ? Direction.DOWN : Direction.UP;
                }
                break;

            case Face.BOTTOM:
                if (Math.abs(towardOther.x) > Math.abs(towardOther.z)) {
                    edge = towardOther.x < 0 ? Direction.LEFT : Direction.RIGHT;

                } else {
                    edge = towardOther.z < 0 ? Direction.UP : Direction.DOWN;
                }
                break;
        }
        return this.edgeCenters.get(edge)!;
    }


    public getSurfaceNormal(): Vector3 {
        return this.normal;
    }


    public getMesh(): TransformNode {
        return this.mesh;
    }
}

export {Tile}