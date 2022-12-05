import path from 'path';
import child_process from 'child_process';
import * as Common from './Common';

export function getGameInfo(gameFilePaths: string[]): Promise<Common.GameInfo[]> {
    return new Promise((resolve) => {
        const child = child_process.fork(path.join(__dirname, 'proc', 'GetGameInfo.js'))
        child.on('message', (data: Common.GameInfo[]) => {
            resolve(data);
            child.removeAllListeners('message');
        });
        child.send(gameFilePaths);
    });
}

export function verifyDisc(gameFilePath: string): Promise<Common.VerifyDiscResult> {
    return new Promise((resolve) => {
        const child = child_process.fork(path.join(__dirname, 'proc', 'VerifyDisc.js'))
        child.on('message', (data: Common.VerifyDiscResult) => {
            resolve(data);
            child.removeAllListeners('message');
        });
        child.send(gameFilePath);
    });
}

export function extractDisc(gameFilePath: string, extractDirPath: string): Promise<Common.ExtractDiscResult> {
    return new Promise((resolve) => {
        const child = child_process.fork(path.join(__dirname, 'proc', 'ExtractDisc.js'))
        child.on('message', (data: Common.ExtractDiscResult) => {
            resolve(data);
            child.removeAllListeners('message');
        });
        child.send([gameFilePath, extractDirPath]);
    });
}
