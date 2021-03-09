import { Cube } from "./cube";
import { Tile } from "./tile";
import { TileIndex } from "./tileIndex";
import { TileNotFoundError } from "./tileNotFoundError";

class Path {
    private readonly cube: Cube;
    private readonly indices: TileIndex[];

    constructor(cube: Cube, tiles: TileIndex[]) {
        this.cube = cube;
        this.indices = tiles;
    }


    public get(i: number): Tile {
        this.validateIndex(i);
        const index: TileIndex = this.indices[i];
        return this.cube.getTile(index.face, index.row, index.column);
    }


    private validateIndex(i: number): void {
        if ((i < 0) || (i >= this.indices.length)) {
            throw TileNotFoundError.forPath(this.indices.length, i);
        }
    }


    public getPrevious(iCurrent: number): Tile {
        return this.get((iCurrent == 0) ? (this.indices.length - 1) : (iCurrent - 1));
    }


    public getNext(iCurrent: number): Tile {
        return this.get((iCurrent == this.indices.length - 1) ? 0 : (iCurrent + 1));
    }


    public getLength(): number {
        return this.indices.length;
    }
}

export {Path};