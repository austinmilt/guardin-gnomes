
import { Scene, SceneLoader, TransformNode } from "@babylonjs/core";


async function importMeshAsync(model: string, meshNames: string[], name: string, scene: Scene): Promise<TransformNode> {
    const importResult = await SceneLoader.ImportMeshAsync("", model, undefined, scene, undefined, ".glb");
    const result: TransformNode = new TransformNode(name, scene);
    importResult.meshes.forEach(mesh => {
        if (meshNames.includes(mesh.name)) {
            mesh.parent = result;
        }
    })
    return result;
}


export {importMeshAsync};