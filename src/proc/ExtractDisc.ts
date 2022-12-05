import { Dolphin, UICommon, Util } from 'dolphin-js';
import * as Common from '../Common';

Dolphin.loadLibrary({
    libraryPath: Common.getDolphinLibraryPath()
});
UICommon.createDirectories(Common.getDolphinUserDirectoryPath());

process.on('message', (data: string[]) => {
    const gameFilePath: string = data[0];
    const extractDirPath: string = data[1];
    const gameFile = new UICommon.GameFile(gameFilePath);
    const result: Common.ExtractDiscResult = Util.extractDisc(gameFile, extractDirPath);
    process.send?.(result);
    process.removeAllListeners('message');
});
