import { Engine } from "@babylonjs/core";

function nowInEpochSeconds(): number {
    return Date.now() / 1000.0;
}


function elapsedInEpochSeconds(startEpochSeconds: number): number {
    return nowInEpochSeconds() - startEpochSeconds;
}


function elapsedSinceLastFrameSeconds(engine: Engine): number {
    return engine.getDeltaTime() / 1000.0;
}


export {nowInEpochSeconds, elapsedInEpochSeconds, elapsedSinceLastFrameSeconds};