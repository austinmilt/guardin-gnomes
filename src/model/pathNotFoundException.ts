class PathNotFoundException extends Error {
    private constructor(message: string) {
        super(message);
    }

    public static forWave(waveId: string, subwaveIndex: number, pathName: string): PathNotFoundException {
        return new PathNotFoundException(`No path ${pathName} exists for wave ${waveId}, subwave ${subwaveIndex}`);
    }
}

export {PathNotFoundException}