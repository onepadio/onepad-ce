export class Window{
    enableTabs: any;
    fullScreen: any;
    height: any;
    width: any;
    showNavbar: any;
    constructor(){
        this.fullScreen = false;
        this.enableTabs = false;
        this.width = 0;
        this.height = 0;
        this.showNavbar = false;
    }

    setFullScreen(fullScreen: any){
        this.fullScreen = fullScreen;
    }

    setEnableTabs(enableTabs: any){
        this.enableTabs = enableTabs;
    }

    setSize(width: any, height: any){
        this.width = width;
        this.height = height;
    }
    
    setShowNavbar(showNavbar: any){
        this.showNavbar = showNavbar;
    }
}