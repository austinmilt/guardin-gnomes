import { Button, TextBlock } from "@babylonjs/gui";
import { UI } from "./ui";

const INTERACTIVE_Z_INDEX = 9999;
const NON_INTERACTIVE_Z_INDEX = -1;

function DEFAULT_CALLBACK(): void {
    throw new Error("Callback call before it was set!");
}

class HUD {
    private readonly ui: UI;

    private playButtonCallback: () => void = DEFAULT_CALLBACK;

    private constructor(ui: UI) {
        this.ui = ui;
    }


    public static buildHud(ui: UI): HUD {
        const result = new HUD(ui);
        
        const timerText: TextBlock = new TextBlock("timer-text-block", "TIMER");
        timerText.fontSize = 40;
        timerText.width = "200px";
        timerText.height = "50px";
        timerText.left = "-44%";
        timerText.top = "-40%";
        timerText.zIndex = NON_INTERACTIVE_Z_INDEX;
        ui.addControl("timer", timerText, true);
        
        const coinBalanceText: TextBlock = new TextBlock("coins-text-block", "COINS");
        coinBalanceText.fontSize = 40;
        coinBalanceText.width = "200px";
        coinBalanceText.height = "50px";
        coinBalanceText.left = "-45%";
        coinBalanceText.top = "-45%";
        timerText.zIndex = NON_INTERACTIVE_Z_INDEX;
        ui.addControl("coins", coinBalanceText, true);

        const playButton: Button = Button.CreateSimpleButton("start-level-button", "Play");
        playButton.width = "100px";
        playButton.height = "100px";
        playButton.color = "white";
        playButton.fontSize = 40;
        playButton.background = "green";
        playButton.left = "45%";
        playButton.top = "43%";
        playButton.zIndex = INTERACTIVE_Z_INDEX;
        playButton.onPointerClickObservable.add(() => result.executePlayButtonCallback());
        ui.addControl("start-level", playButton, true);
        
        return result;
    }


    public show(): void {
        this.ui.showControl("start-level");
        this.ui.showControl("timer");
        this.ui.showControl("coins");
    }


    public hide(): void {
        this.ui.hideControl("start-level");
        this.ui.hideControl("timer");
        this.ui.hideControl("coins");
    }


    public setPlayButtonCallback(callback: () => void): void {
        this.playButtonCallback = callback;
    }


    public setPlayButtonText(text: string): void {
        const button: Button | undefined = this.ui.getControl("start-level");
        if (button !== undefined) {
            const textBlock: TextBlock | null = button.textBlock;
            if (textBlock !== null) {
                textBlock.text = text;
            }
        }
    }


    private executePlayButtonCallback(): void {
        console.log("play button callback");
        this.playButtonCallback();
    }


    public setDisplayTimer(secondsPlayed: number): void {
        const timer: TextBlock | undefined = this.ui.getControl("timer");
        if (timer !== undefined) {
            const hoursEtc = secondsPlayed / 3600.0;
            const hours = Math.floor(hoursEtc);
            
            let remainder = hoursEtc - hours;
            const minutesEtc = remainder * 60.0;
            const minutes = Math.floor(minutesEtc);
            
            remainder = minutesEtc - minutes;
            const secondsEtc = remainder * 60.0;
            const seconds = Math.floor(secondsEtc);

            timer.text = `${hours.toFixed(0)}:${minutes.toFixed(0).padStart(2, '0')}:${seconds.toFixed(0).padStart(2, '0')}`;
        }
    }


    public setDisplayCoinBalance(coins: number): void {
        const timer: TextBlock | undefined = this.ui.getControl("coins");
        if (timer !== undefined) {
            timer.text = `$${coins}`;
        }
    }
}

export {HUD}