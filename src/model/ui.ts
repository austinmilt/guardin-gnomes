import { Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control } from "@babylonjs/gui";

class UIElementNotFoundError extends Error {
    constructor(key: string) {
        super(`Don't know of a UI control element named ${key}`);
    }
}


class DuplicateUIElementError extends Error {
    constructor(key: string) {
        super(`A UI control element with name ${key} already exists.`);
    }
}


class UI {
    private readonly texture: AdvancedDynamicTexture;
    private readonly scene: Scene;
    private readonly controls: Map<string, Control> = new Map<string, Control>();

    private constructor(texture: AdvancedDynamicTexture, scene: Scene) {
        this.texture = texture;
        this.scene = scene;
    }


    public static constructUI(scene: Scene): UI {
        const texture: AdvancedDynamicTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        return new UI(texture, scene);
    }


    public addControl<T extends Control>(key: string, control: T, showImmediately = false): void {
        if (this.controls.has(key)) {
            throw new DuplicateUIElementError(key);
        }
        this.texture.addControl(control);
        this.controls.set(key, control);
        if (showImmediately) {
            control.isVisible = true;
            control.isEnabled = true;

        } else {
            control.isVisible = false;
            control.isEnabled = false;
        }
    }


    public getControl<T extends Control>(key: string): T | undefined {
        return this.controls.get(key) as T;
    }


    public showControl(key: string, position?: Vector3 | TransformNode): void {
        const control: Control | undefined = this.controls.get(key);
        if (control === undefined) {
            throw new UIElementNotFoundError(key);
        }
        if (position instanceof Vector3) {
            control.moveToVector3(position, this.scene);

        } else if (position instanceof TransformNode) {
            control.linkWithMesh(position);
        }
        control.isVisible = true;
        control.isEnabled = true;
    }
    
    
    public hideControl(key: string): void {
        const control: Control | undefined = this.controls.get(key);
        if (control === undefined) {
            throw new UIElementNotFoundError(key);
        }
        control.isVisible = false;
        control.isEnabled = false;
    }
}

export {UI};