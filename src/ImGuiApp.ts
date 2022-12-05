import { $, AppWindow, Gui, ImGui, Vec4 } from 'ml64tk'

export abstract class ImGuiApp {
    protected appWindow: AppWindow;
    private colorScheme: Gui.ColorScheme | undefined;
    private colorSchemeName: string | undefined;

    constructor(title: string, viewports?: boolean) {
        this.appWindow = new AppWindow(false, viewports ? viewports : false);
        this.appWindow.on('init', this.init.bind(this));
        this.appWindow.on('new-frame', this.newFrame.bind(this));
        this.appWindow.on('close', this.onClose.bind(this));
        this.appWindow.title = title;
    }

    run(): void {
        const process = setInterval((() => {
            if (this.appWindow.doIteration()) {
                clearInterval(process);
                this.onClosed();
            }
        }).bind(this), 16);
    }

    private init(): void {
        this.onInit();
    }

    private newFrame(): void {
        this.updateColorScheme();
        this.createMainDockSpace();
        this.onNewFrame();
    }

    private updateColorScheme(): void {
        const colorScheme = Gui.getColorScheme();

        if (this.colorScheme != colorScheme) {
            if (colorScheme == Gui.ColorScheme.PreferDark) {
                ImGui.styleColorsDark();
                // @ts-ignore
                if (Gui.useImmersiveDarkMode) Gui.useImmersiveDarkMode(ImGui.getMainViewport(), true);
            }
            else {
                ImGui.styleColorsLight();
                // @ts-ignore
                if (Gui.useImmersiveDarkMode) Gui.useImmersiveDarkMode(ImGui.getMainViewport(), false);
            }

            this.colorScheme = colorScheme;
            this.applyCustomColorScheme();
            this.appWindow.clearColor = ImGui.getStyleColor(ImGui.Col.WindowBg);
        }
    }

    private applyCustomColorScheme(): void {
        // load color schemes from file...
        const colorScheme = ((name, pref) => {
            if (name == 'red') {
                if (pref == Gui.ColorScheme.PreferDark)
                    return new Map<ImGui.Col, Vec4>([
                        [ImGui.Col.Button, $.rgba(255, 0, 0, 100)],
                        [ImGui.Col.ButtonActive, $.rgba(255, 0, 0, 140)],
                        [ImGui.Col.ButtonHovered, $.rgba(255, 0, 0, 180)],
                        [ImGui.Col.WindowBg, $.rgba(60, 60, 60, 255)]
                    ]);
                else
                    return new Map<ImGui.Col, Vec4>([
                        [ImGui.Col.Button, $.rgba(255, 0, 0, 100)],
                        [ImGui.Col.ButtonActive, $.rgba(255, 0, 0, 140)],
                        [ImGui.Col.ButtonHovered, $.rgba(255, 0, 0, 180)],
                        [ImGui.Col.WindowBg, $.rgba(245, 245, 245, 255)]
                    ]);
            }
            else if (name == 'green') {
                if (pref == Gui.ColorScheme.PreferDark)
                    return new Map<ImGui.Col, Vec4>([
                        [ImGui.Col.Button, $.rgba(0, 255, 0, 100)],
                        [ImGui.Col.ButtonActive, $.rgba(0, 255, 0, 140)],
                        [ImGui.Col.ButtonHovered, $.rgba(0, 255, 0, 180)],
                        [ImGui.Col.WindowBg, $.rgba(60, 60, 60, 255)]
                    ]);
                else
                    return new Map<ImGui.Col, Vec4>([
                        [ImGui.Col.Button, $.rgba(0, 255, 0, 100)],
                        [ImGui.Col.ButtonActive, $.rgba(0, 255, 0, 140)],
                        [ImGui.Col.ButtonHovered, $.rgba(0, 255, 0, 180)],
                        [ImGui.Col.WindowBg, $.rgba(245, 245, 245, 255)]
                    ]);
            }
        })(this.colorSchemeName, this.colorScheme);

        if (colorScheme) {
            const style = ImGui.getStyle();
            for (const [key, val] of colorScheme)
                style.setColorAt(key, val);
        }
    }

    setColorSchemeName(name: string | undefined): void {
        this.colorSchemeName = name;
        this.colorScheme = undefined;
    }

    private createMainDockSpace(): void {
        const mainViewport = ImGui.getMainViewport();
        ImGui.setNextWindowViewport(mainViewport.id);
        ImGui.setNextWindowPos(mainViewport.workPos, ImGui.Cond.Always);
        ImGui.setNextWindowSize(mainViewport.workSize, ImGui.Cond.Always);
        ImGui.pushStyleVar(ImGui.StyleVar.WindowPadding, $.xy(0, 0));
        ImGui.pushStyleColor(ImGui.Col.DockingEmptyBg, $.rgbaf(0, 0, 0, 0));
        ImGui.begin("##MainWindowDockSpace", undefined,
            ImGui.WindowFlags.NoNav | ImGui.WindowFlags.NoDecoration
            | ImGui.WindowFlags.NoSavedSettings | ImGui.WindowFlags.NoBackground
            | ImGui.WindowFlags.NoBringToFrontOnFocus | ImGui.WindowFlags.NoFocusOnAppearing);
        ImGui.dockSpace(ImGui.getId("MainDockSpace"));
        ImGui.end();
        ImGui.popStyleColor();
        ImGui.popStyleVar();
    }

    onInit(): void {
    }

    onNewFrame(): void {
    }

    onClose(): boolean {
        return true;
    }

    onClosed(): void {
    }
}
