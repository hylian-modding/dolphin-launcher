import { Dolphin, Config, Core, Gui, AddressSpace } from 'dolphin-js';
import { ImGui } from "ml64tk";
import * as Common from './Common'
import { ImGuiApp } from './ImGuiApp';

Dolphin.loadLibrary({
    libraryPath: Common.getDolphinLibraryPath()
});

class ImGuiAppImpl extends ImGuiApp {
    private toggleImGuiAction!: Gui.Q.Action;
    private mem1View = new ImGui.MemoryEditor();

    constructor() {
        super('ImGui', true);
    }

    onInit() {
        ImGui.getIO().iniFilename = 'data/dolphin_imgui.ini';
    }

    onNewFrame() {
        const mem1 = AddressSpace.get(AddressSpace.Type.Mem1);
        this.mem1View.drawWindow('Mem1', mem1, mem1.byteLength);
    }

    onClose() {
        this.toggleImGuiAction.checked = false;
        return !Core.isRunningAndStarted();
    }

    setToggleImGuiAction(a: Gui.Q.Action) {
        this.toggleImGuiAction = a;
    }

    show() {
        this.appWindow.show();
    }

    hide() {
        this.appWindow.hide();
    }

    close() {
        this.appWindow.close();
    }
}

process.on('message', (startInfo: Common.DolphinStartInfo) => {
    let app: ImGuiAppImpl;
    if (!startInfo.isConfigure) {
        app = new ImGuiAppImpl();
        app.run();
    }

    let processUI: NodeJS.Timer;
    let processFrame: NodeJS.Timer;

    Dolphin.startup({
        applicationDisplayName: 'ModLoader64',
        userDirectoryPath: Common.getDolphinUserDirectoryPath()
    }, () => {
        Config.setBool('-MAIN_USE_PANIC_HANDLERS', false);
        Config.setBool('-Main,Interface.PlayMode', !startInfo.isConfigure);
        Config.setBool('-Main,Display.RenderToMain', !startInfo.isConfigure);
        Config.setBool('-Main,Interface.HideFPSInfo', !startInfo.isConfigure);
    });
    Gui.MainWindow.setIcon('assets/icon.png');

    processUI = setInterval(() => {
        Dolphin.processOne();
        if (Gui.Application.hasExited()) {
            if (!startInfo.isConfigure)
                clearInterval(processFrame);
            clearInterval(processUI);
            if (!startInfo.isConfigure)
                app.close();
            Dolphin.shutdown();
        }
    });

    Gui.MainWindow.show();
    Gui.Settings.setToolBarVisible(false);
    Gui.Settings.setDebugModeEnabled(false);

    if (!startInfo.isConfigure) {
        Gui.MainWindow.startGame(startInfo.gameFilePath!);

        processFrame = setInterval(() => {
            if (Core.isRunningAndStarted()) {
                Core.doFrameStep();
                // new frame
            }
        });
    }

    if (!startInfo.isConfigure) {
        let debugMenu = Gui.MainWindow.getMenuBar().addMenu('Debug');
        let toggleImGuiAction = debugMenu.addAction('ImGui');
        toggleImGuiAction.checkable = true;
        toggleImGuiAction.setToggledCallback((c) => {
            if (c) app.show();
            else app.hide();
        });
        toggleImGuiAction.checked = false;
        toggleImGuiAction.setShortcut('Ctrl+I');
        // @ts-ignore
        app.setToggleImGuiAction(toggleImGuiAction);
    }

    let helpMenu = Gui.MainWindow.findMenu('Help');
    if (helpMenu) {
        let aboutAction = helpMenu.addAction('About ModLoader64');
        aboutAction.setTriggeredCallback(() => {
            Gui.Q.CommonDialogs.about(Gui.MainWindow.asWidget(), 'About ModLoader64',
                'ModLoader64 is a network capable mod loading system for Nintendo 64 and GameCube games.<br/>' +
                'Its main purpose is creating online multiplayer mods for various games like Ocarina of Time.<br/>' +
                '<a href="https://modloader64.com/">Website</a> <a href="https://discord.gg/nHb4fXX">Discord</a>');
        });
    }

    process.removeAllListeners('message');
});
