import { Dolphin, UICommon, Util } from 'dolphin-js';
import * as Common from '../Common';

Dolphin.loadLibrary({
    libraryPath: Common.getDolphinLibraryPath()
});
UICommon.createDirectories(Common.getDolphinUserDirectoryPath());

process.on('message', (gameFilePath: string) => {
    const gameFile = new UICommon.GameFile(gameFilePath);
    const verifyResult = Util.verifyDisc(gameFile);
    const result: Common.VerifyDiscResult = {
        succeeded: verifyResult[0],
        sha1: verifyResult[1].sha1,
        goodDump: verifyResult[1].goodDump
    };
    process.send?.(result);
    process.removeAllListeners('message');
});
