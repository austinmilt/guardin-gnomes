import { Button, Control } from "@babylonjs/gui";
import { DefenderCosts, PlayerDefaultOptions } from "../config/constants";
import { EntityManager } from "./entityManager";
import { Face } from "./face";
import { Tile } from "./tile";
import { UI } from "./ui";

class Store {
    private readonly entities: EntityManager;
    private readonly ui: UI;
    private coins = PlayerDefaultOptions.STARTING_COINS;
    private paused = false;

    private constructor(entities: EntityManager, ui: UI) {
        this.entities = entities;
        this.ui = ui;
    }


    public static buildStore(entities: EntityManager, ui: UI): Store {
        Store.buildStoreUi(ui);
        return new Store(entities, ui);
    }


    private static buildStoreUi(ui: UI): void {
        const buyButton: Button = Button.CreateSimpleButton("buy-tower-button", "Buy Tower");
        buyButton.width = 0.1;
        buyButton.height = 0.1;
        buyButton.color = "white";
        buyButton.fontSize = 50;
        buyButton.background = "green";
        ui.addControl("store", buyButton);
    }


    public openStore(tile: Tile): void {
        if (!this.paused) {
            this.ui.showControl("store", tile.getMesh())!;
            const storeUI: Control = this.ui.getControl("store")!;
            storeUI.onPointerClickObservable.addOnce(() => { this.buyDefender(tile); this.ui.hideControl("store");} );
        }
    }


    private buyDefender(tile: Tile): void {
        if (this.coins >= DefenderCosts.DEFENDER) {
            this.coins -= DefenderCosts.DEFENDER;
            this.entities.addDefender(`D-${tile.getFace()}-${tile.getRow()}-${tile.getColumn()}`, tile);
            console.log(`D-${Face[tile.getFace()]}-${tile.getRow()}-${tile.getColumn()}`);

        } else {
            alert("Not enough money to purchase this tower.");
        }
    }


    public depositCoins(coins: number): void {
        this.coins += coins;
        console.log(`Total coins: ${this.coins}`);
    }


    public getBalance(): number {
        return this.coins;
    }


    public setPause(pause: boolean): void {
        this.paused = pause;
    }
}


export {Store};