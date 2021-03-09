import { Face } from "./face";

class TileNotFoundError extends Error {
    constructor(msg: string) {
        super(msg);
    }

    public static forPath(length: number, i: number): TileNotFoundError {
        return new TileNotFoundError(`Path of length ${length} doesn't contain a tile at ${i}.`);
    }

    public static forCube(rows: number, columns: number, depth: number, face: Face, row: number, column: number): TileNotFoundError {
        return new TileNotFoundError(`Cube of size ${rows}x${columns}x${depth}) doesn't contain a tile at (${Face[face]}, ${row}, ${column})`);
    }
}

export {TileNotFoundError}