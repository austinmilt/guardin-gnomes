import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { CellDimensions, DirectionVectors } from "../config/constants";
import { Cube } from "../model/cube";
import { EntityManager } from "../model/entityManager";
import { Face } from "../model/face";
import { Tile } from "../model/tile";
import { TileIndex } from "../model/tileIndex";

class CubeBuilder {
    private readonly entities: EntityManager;
    private readonly rows: number;
    private readonly columns: number;
    private readonly depth: number;
    private readonly tiles: Map<Face, Map<number, Map<number, Tile>>> = new Map<Face, Map<number, Map<number, Tile>>>();
    private readonly pathIndices: Map<Face, Map<number, Set<number>>>;

    private constructor(rows: number, columns: number, depth: number, pathIndices: Map<Face, Map<number, Set<number>>>, entities: EntityManager) {
        this.entities = entities;
        this.rows = rows;
        this.columns = columns;
        this.depth = depth;
        this.pathIndices = pathIndices;
    }


    public static async buildCube(rows: number, columns: number, depth: number, pathIndices: {[pathName: string]: TileIndex[]}, entities: EntityManager, scene: Scene): Promise<Cube> {
        const builder: CubeBuilder = new CubeBuilder(rows, columns, depth, this.buildPathMap(pathIndices), entities);
        builder.buildFace(Face.FRONT, rows, columns);
        builder.buildFace(Face.BACK, rows, columns);
        builder.buildFace(Face.LEFT, rows, depth);
        builder.buildFace(Face.RIGHT, rows, depth);
        builder.buildFace(Face.TOP, depth, columns);
        builder.buildFace(Face.BOTTOM, depth, columns);
        this.buildSubsurface(rows, columns, depth, scene);
        return builder.build();
    }


    private static buildPathMap(pathIndices: {[pathName: string]: TileIndex[]}): Map<Face, Map<number, Set<number>>> {
        const result: Map<Face, Map<number, Set<number>>> = new Map<Face, Map<number, Set<number>>>();
        for (const pathName of Object.keys(pathIndices)) {
            for (const index of pathIndices[pathName]) {
                const face: Face = index.face;
                const row: number = index.row;
                const column: number = index.column;
                if (!result.has(face)) {
                    result.set(face, new Map<number, Set<number>>());
                }
    
                const faceIndices: Map<number, Set<number>> = result.get(face)!;
                if (!faceIndices.has(row)) {
                    faceIndices.set(row, new Set<number>());
                }
    
                faceIndices.get(row)!.add(column);
            }
            
        }
        return result;
    }


    private static buildSubsurface(rows: number, columns: number, depth: number, scene: Scene): void {
        const subsurface: Mesh = MeshBuilder.CreateBox('subsurface', {width: CellDimensions.WIDTH*rows, height: CellDimensions.WIDTH*columns, depth: CellDimensions.WIDTH*depth}, scene);
        const material: StandardMaterial = new StandardMaterial('subsurface-material', scene);
        material.diffuseColor = Color3.Black();
        subsurface.material = material;
    }


    private build(): Cube {
        return new Cube(this.tiles);
    }

    
    private buildFace(face: Face, faceRows: number, faceColumns: number): void {
        for (let row = 0; row < faceRows; row++) {
            for (let column = 0; column < faceColumns; column++) {
                const isPath: boolean = this.isPartOfPath(face, row, column);
                const tile: Tile = this.entities.addTile(face, row, column, isPath, m => this.processMeshBeforeTile(face, row, column, faceRows, faceColumns, m));
                this.putTile(face, row, column, tile);
            }
        }
    }


    private processMeshBeforeTile(face: Face, row: number, column: number, faceRows: number, faceColumns: number, mesh: Mesh): void {
        mesh.position = this.calculateWorldPosition(row, column, faceRows, faceColumns);
        this.adjustTileForFace(face, mesh);
    }


    private isPartOfPath(face: Face, row: number, column: number): boolean {
        return this.pathIndices.get(face)?.get(row)?.has(column) === true;
    }


    private calculateWorldPosition(row: number, column: number, rows: number, columns: number): Vector3 {
        const yOffset = -CellDimensions.HALF_HEIGHT * (1 - (rows % 2));
        const xOffset = CellDimensions.HALF_WIDTH * (1 - (columns % 2));
    
        const yStart = CellDimensions.HEIGHT * (rows / 2.0) + yOffset;
        const xStart = -CellDimensions.WIDTH * (columns / 2.0) + xOffset;
    
        const y = yStart - row * CellDimensions.HEIGHT;
        const x = xStart + column * CellDimensions.WIDTH;
        return new Vector3(x, y, 0);
    }


    private adjustTileForFace(face: Face, tile: Mesh): void {
        switch (face) {
            case Face.FRONT:
                this.adjustTileForFrontFace(tile);
                break;

            case Face.BACK:
                this.adjustTileForBackFace(tile);
                break;

            case Face.LEFT:
                this.adjustTileForLeftFace(tile);
                break;

            case Face.RIGHT:
                this.adjustTileForRightFace(tile);
                break;

            case Face.TOP:
                this.adjustTileForTopFace(tile);
                break;

            case Face.BOTTOM:
                this.adjustTileForBottomFace(tile);
                break;
        }
    }

    
    private adjustTileForFrontFace(mesh: Mesh): void {
        const zOffset = -this.depth * CellDimensions.HALF_WIDTH - CellDimensions.DEPTH;
        const position: Vector3 = mesh.position;
        const x: number = position.x + CellDimensions.HALF_WIDTH * (this.columns % 2);
        const y: number = position.y - CellDimensions.HALF_HEIGHT * (this.rows % 2);
        const z: number = position.z + zOffset;
        mesh.position = new Vector3(x, y, z);
    }


    private adjustTileForBackFace(mesh: Mesh): void {
        mesh.rotateAround(Vector3.ZeroReadOnly, DirectionVectors.UP, Math.PI);
        const zOffset = this.depth * CellDimensions.HALF_WIDTH + CellDimensions.DEPTH;
        const position: Vector3 = mesh.position;
        const x: number = position.x - CellDimensions.HALF_WIDTH * (this.columns % 2);
        const y: number = position.y - CellDimensions.HALF_HEIGHT * (this.rows % 2);
        const z: number = position.z + zOffset;
        mesh.position = new Vector3(x, y, z);
    }
    
    
    private adjustTileForLeftFace(mesh: Mesh): void {
        mesh.rotateAround(Vector3.ZeroReadOnly, DirectionVectors.UP, 0.5 * Math.PI);
        const xOffset = -CellDimensions.HALF_WIDTH * this.columns - CellDimensions.DEPTH;
        const position: Vector3 = mesh.position;
        const x: number = position.x + xOffset;
        const y: number = position.y - CellDimensions.HALF_HEIGHT * (this.rows % 2);
        const z: number = position.z - CellDimensions.HALF_WIDTH * (this.depth % 2);
        mesh.position = new Vector3(x, y, z);
    }
    
    
    private adjustTileForRightFace(mesh: Mesh): void {
        mesh.rotateAround(Vector3.ZeroReadOnly, DirectionVectors.UP, -0.5 * Math.PI);
        const xOffset = CellDimensions.HALF_WIDTH * this.columns + CellDimensions.DEPTH;
        const position: Vector3 = mesh.position;
        const x: number = position.x + xOffset;
        const y: number = position.y - CellDimensions.HALF_HEIGHT * (this.rows % 2);
        const z: number = position.z + CellDimensions.HALF_WIDTH * (this.depth % 2);
        mesh.position = new Vector3(x, y, z);
    }


    private adjustTileForTopFace(mesh: Mesh): void {
        mesh.rotateAround(Vector3.ZeroReadOnly, DirectionVectors.RIGHT, 0.5 * Math.PI);
        const position: Vector3 = mesh.position;
        const x: number = position.x + CellDimensions.HALF_WIDTH * (this.columns % 2);
        const yOffset = CellDimensions.HALF_WIDTH * this.rows + CellDimensions.DEPTH;
        const y: number = position.y + yOffset
        const z: number = position.z - CellDimensions.HALF_WIDTH * (this.depth % 2);
        mesh.position = new Vector3(x, y, z);
    }


    private adjustTileForBottomFace(mesh: Mesh): void {
        mesh.rotateAround(Vector3.ZeroReadOnly, DirectionVectors.RIGHT, -0.5 * Math.PI);
        const position: Vector3 = mesh.position;
        const x: number = position.x + CellDimensions.HALF_WIDTH * (this.columns % 2);
        const yOffset = -CellDimensions.HALF_WIDTH * this.rows - CellDimensions.DEPTH;
        const y: number = position.y + yOffset
        const z: number = position.z + CellDimensions.HALF_WIDTH * (this.depth % 2);
        mesh.position = new Vector3(x, y, z);
    }


    private putTile(face: Face, row: number, column: number, tile: Tile): void {
        if (!this.tiles.has(face)) {
            this.tiles.set(face, new Map<number, Map<number, Tile>>());
        }

        const faceTiles: Map<number, Map<number, Tile>> = this.tiles.get(face)!;
        if (!faceTiles.has(row)) {
            faceTiles.set(row, new Map<number, Tile>());
        }

        const rowTiles: Map<number, Tile> = faceTiles.get(row)!;
        rowTiles.set(column, tile);
    }
}


export {CubeBuilder};