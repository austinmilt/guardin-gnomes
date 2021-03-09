import { Face } from "./face";
import { Tile } from "./tile";
import { TileNotFoundError } from "./tileNotFoundError";

interface CubeSpec {
    rows: number;
    columns: number;
    depth: number;
}


class Cube {
    private readonly tiles: Map<Face, Map<number, Map<number, Tile>>>;
    private readonly rows: number;
    private readonly columns: number;
    private readonly depth: number;

    public constructor(tiles: Map<Face, Map<number, Map<number, Tile>>>) {
        this.tiles = tiles;
        this.rows = tiles.get(Face.FRONT)!.size;
        this.columns = tiles.get(Face.FRONT)!.get(0)!.size;
        this.depth = tiles.get(Face.TOP)!.size;
    }


    public getTile(face: Face, row: number, column: number): Tile {
        const result: Tile | undefined = this.tiles.get(face)?.get(row)?.get(column);

        if (result === undefined) {
            throw TileNotFoundError.forCube(this.rows, this.columns, this.depth, face, row, column);
        }

        return result;
    }
}

export {Cube, CubeSpec}