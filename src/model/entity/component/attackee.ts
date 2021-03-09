import { Vector3 } from "@babylonjs/core";

interface Attackee {
    receiveAttack(damage: number): void;
    
    getPosition(): Vector3;
}

export {Attackee}