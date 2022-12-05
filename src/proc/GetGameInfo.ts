import { Dolphin, Enums, UICommon } from 'dolphin-js';
import * as Common from '../Common';

Dolphin.loadLibrary({
    libraryPath: Common.getDolphinLibraryPath()
});
UICommon.createDirectories(Common.getDolphinUserDirectoryPath());

function regionToString(region: Enums.DiscIO.Region) {
    const a = ['NTSC-J', 'NTSC-U', 'PAL', 'Unknown', 'NTSC-K'];
    return a[region];
}

process.on('message', (gameFilePaths: string[]) => {
    let result: Common.GameInfo[] = [];
    for (let gameFilePath of gameFilePaths) {
        const gameFile = new UICommon.GameFile(gameFilePath);
        const banner = gameFile.bannerImage;
        const gameInfo: Common.GameInfo = {
            isValid: gameFile.isValid,
            filePath: gameFile.filePath,
            name: gameFile.name,
            description: gameFile.description,
            internalName: gameFile.internalName,
            gameID: gameFile.gameID,
            region: regionToString(gameFile.region),
            volumeSize: UICommon.formatSize(gameFile.volumeSize, 2),
            bannerBuffer: banner.buffer,
            bannerWidth: banner.width,
            bannerHeight: banner.height
        }
        result.push(gameInfo);
    }
    process.send?.(result);
    process.removeAllListeners('message');
});
