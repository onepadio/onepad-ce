import { Window } from "./window";

export default class AppIcon{
    code: any;
    customUrl: any;
    icon: any;
    name: any;
    startUrl: any;
    window: any;
    constructor(name: any, startUrl: any, icon: any, code: any, window = new Window()){
        this.name = name;
        this.startUrl = startUrl;
        this.customUrl = "";
        this.icon = icon;
        this.code = code;
        this.window = window;
    }

    setCustomUrl(customUrl: any){
        this.customUrl = customUrl;
    }
}