import path from 'path';

export function getDolphinLibraryPath() {
    return path.join(process.cwd(), 'node_modules', 'dolphin-plugin')
}

export function getDolphinUserDirectoryPath() {
    return path.resolve(process.cwd(), './data/dolphin');
}

export interface GameInfo {
    isValid: boolean;
    filePath: string;
    name: string;
    internalName: string;
    description: string;
    volumeSize: string;
    gameID: string;
    region: string;
    bannerBuffer: Uint8Array;
    bannerWidth: number;
    bannerHeight: number;
}

export interface VerifyDiscResult {
    succeeded: boolean;
    sha1: Uint8Array;
    goodDump: boolean;
}

export type ExtractDiscResult = boolean;

export interface LobbyInfo {
    playerName: string;
    name: string;
    password: string;
}

export interface DolphinStartInfo {
    lobbyInfo: LobbyInfo;
    isConfigure: boolean;
    gameFilePath?: string;
}
