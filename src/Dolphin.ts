import path from 'path';
import worker_threads from 'worker_threads';
import { Dolphin, Core, AddressSpace } from 'dolphin-js';
import { ImGui } from "ml64tk";
import * as Common from './Common'
import { ImGuiApp } from './ImGuiApp';

class ImGuiAppImpl extends ImGuiApp {
    private hostWorker!: worker_threads.Worker;
    private mem1View = new ImGui.MemoryEditor();

    constructor() {
        super('ImGui', true);
    }

    onInit() {
        ImGui.getIO().iniFilename = 'data/dolphin_imgui.ini';
    }

    onNewFrame() {
        if (!Core.isRunningAndStarted() || !this.appWindow.isVisible())
            return;

        const mem1 = AddressSpace.get(AddressSpace.Type.Mem1);
        this.mem1View.drawWindow('Mem1', mem1, mem1.byteLength);

        // new imgui frame
    }

    onClose() {
        this.hostWorker.postMessage({ 'msg': 'notifyHideImGui' });
        return !Core.isRunningAndStarted();
    }

    setHostWorker(w: worker_threads.Worker) {
        this.hostWorker = w;
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
        const hostWorker = new worker_threads.Worker(path.join(__dirname, 'DolphinHostThread.js'), { workerData: startInfo });

        if (!startInfo.isConfigure) {
            const app = new ImGuiAppImpl();
            app.run();
            app.setHostWorker(hostWorker);

            let processFrame: NodeJS.Timer;

            hostWorker.on('message', value => {
                if (value.msg == 'hostReady') {
                    processFrame = setInterval(() => {
                        Dolphin.handleFrame(() => {
                            // new frame
                        });
                    }, 1);
                    Dolphin.enableFrameHandler(true);
                }
                else if (value.msg == 'toggleImGuiVisibility') {
                    const checked: boolean = value.data;
                    if (checked) app.show();
                    else app.hide();
                }
            });

            hostWorker.on('exit', () => {
                if (!startInfo.isConfigure)
                    clearInterval(processFrame);
                app.close();
            });
        }

        process.removeAllListeners('message');
    });
}
