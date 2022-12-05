import worker_threads from 'worker_threads';
import { Dolphin, Config, Core, Gui, AddressSpace } from 'dolphin-js';
import { ImGui } from "ml64tk";
import * as Common from './Common'
import { ImGuiApp } from './ImGuiApp';

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

if (worker_threads.isMainThread) {
    Dolphin.loadLibrary({
        libraryPath: Common.getDolphinLibraryPath()
    });

    process.on('message', (startInfo: Common.DolphinStartInfo) => {
        let hostWorker = new worker_threads.Worker(__filename, { workerData: startInfo });
        let processFrame: NodeJS.Timer;

        hostWorker.on('message', value => {
            if (value == 'hostGameStarted' && !startInfo.isConfigure) {
                processFrame = setInterval(() => {
                    Dolphin.handleFrame(() => {
                        // new frame
                    });
                }, 1);
                Dolphin.enableFrameHandler(true);
            }
        });

        hostWorker.on('exit', () => {
            if (!startInfo.isConfigure)
                clearInterval(processFrame);
        });

        process.removeAllListeners('message');
    });
}
else {
    const startInfo: Common.DolphinStartInfo = worker_threads.workerData;

    let app: ImGuiAppImpl;
    if (!startInfo.isConfigure) {
        app = new ImGuiAppImpl();
        app.run();
    }

    Dolphin.startup({
        applicationDisplayName: 'ModLoader64',
        userDirectoryPath: Common.getDolphinUserDirectoryPath()
    }, () => {
        Config.setBool('-MAIN_USE_PANIC_HANDLERS', false);
        Config.setBool('-Main,Interface.PlayMode', !startInfo.isConfigure);
        Config.setBool('-Main,Display.RenderToMain', !startInfo.isConfigure);
        Config.setBool('-Main,Interface.HideFPSInfo', false);
    });

    const processUI = setInterval(() => {
        Dolphin.processOne();
        if (Gui.Application.hasExited()) {
            clearInterval(processUI);
            if (!startInfo.isConfigure) {
                app.close();
                Dolphin.enableFrameHandler(false);
            }
            Dolphin.shutdown();
            worker_threads.parentPort?.close();
        }
    }, 16);

    Gui.MainWindow.setIcon('assets/icon.png');
    Gui.MainWindow.show();
    Gui.Settings.setToolBarVisible(startInfo.isConfigure);
    Gui.Settings.setDebugModeEnabled(false);

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

    if (!startInfo.isConfigure)
        Gui.MainWindow.startGame(startInfo.gameFilePath!);

    worker_threads.parentPort?.postMessage('hostGameStarted');
}
