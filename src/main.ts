import child_process from 'child_process';
import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import { $, Gfx, Gui, ImGui } from 'ml64tk';
import * as Common from './Common'
import { ImGuiApp } from './ImGuiApp';
import * as Util from './Util'

class LauncherImGuiApp extends ImGuiApp {
    busy = false;
    launched = false;
    lobbyInfo: Common.LobbyInfo = { playerName: "", name: "", password: "" };
    showLobbyPassword = [false];
    romDirPath: string | undefined;
    games: Common.GameInfo[] = [];
    banners = new Map<string, Gfx.Texture>();
    selectedGame: Common.GameInfo | undefined;
    shouldCalcGameListRowHeight = true;
    gameListRowHeight = 0;

    constructor() {
        super('dolphin-launcher');
    }

    startDolphin(isConfigure: boolean) {
        let env = process.env;
        env['_tkNoGtk'] = '';
        const child = child_process.fork(path.join(__dirname, 'Dolphin.js'), [], {
            env: env,
            silent: true,
            stdio: 'inherit'
        })
        child.send({
            lobbyInfo: this.lobbyInfo,
            isConfigure: isConfigure,
            gameFilePath: isConfigure ? undefined : this.selectedGame!.filePath
        });
        child.on('exit', () => {
            this.launched = false;
        });
        this.launched = true;
    }

    verifySelectedGame() {
        this.busy = true;
        Util.verifyDisc(this.selectedGame!.filePath).then(x => {
            if (!x.succeeded) {
                Gui.showMessageBox({
                    parent: ImGui.getMainViewport(),
                    title: 'Verify',
                    subtitle: 'Could not verify this game!',
                    type: Gui.MessageBoxType.Error
                });
            }
            else {
                let i = this.selectedGame!;
                Gui.showMessageBox({
                    parent: ImGui.getMainViewport(),
                    title: 'Verify',
                    subtitle: `This is ${!x.goodDump ? 'not ' : ''}a good dump.`,
                    content: `${i.filePath} (${i.volumeSize}) [${i.gameID}, ${i.region}]\nSHA-1:\n${Buffer.from(x.sha1).toString('hex')}`,
                    type: x.goodDump ? Gui.MessageBoxType.Information : Gui.MessageBoxType.Warning,
                    buttons: Gui.MessageBoxButtons.OK
                });
            }
            this.busy = false;
        })
    }

    extractSelectedGame() {
        this.busy = true;
        let res = Gui.getExistingDirectory({
            parent: ImGui.getMainViewport(),
            title: 'Select extract directory'
        });
        if (res) {
            if (fs.readdirSync(res).length > 0) {
                Gui.showMessageBox({
                    parent: ImGui.getMainViewport(),
                    title: 'Extract',
                    subtitle: 'Could not extract this game!',
                    content: 'Choose an empty directory!',
                    type: Gui.MessageBoxType.Error
                });
                this.busy = false;
                return;
            }

            Util.extractDisc(this.selectedGame!.filePath, res).then(x => {
                if (!x) {
                    Gui.showMessageBox({
                        parent: ImGui.getMainViewport(),
                        title: 'Extract',
                        subtitle: 'Could not extract this game!',
                        type: Gui.MessageBoxType.Error
                    });
                }
                else {
                    Gui.openUrl(res!);
                }
                this.busy = false;
            });
        }
        else {
            this.busy = false;
        }
    }

    onInit() {
        this.appWindow.setIconFromFile('assets/dolphin-emu.png');
        this.appWindow.show();

        ImGui.getIO().iniFilename = 'data/launcher_imgui.ini';
        ImGui.getIO().fonts.addFontFromFile('assets/Roboto-Regular.ttf', 20);
        ImGui.getStyle().frameRounding = 2;
    }

    onNewFrame() {
        if (ImGui.begin('  Dolphin      ##Dolphin_tab')) {
            this.drawLobbyInfo();
            ImGui.separator();
            this.drawLaunchMenu();
            ImGui.separator();
            this.drawGameList();
        }
        ImGui.end();
    }

    private drawLobbyInfo() {
        ImGui.pushItemWidth(203);

        let _playerName = [this.lobbyInfo.playerName];
        if (ImGui.inputTextWithHint('##Player name', 'Player', _playerName))
            this.lobbyInfo.playerName = _playerName[0];
        if (ImGui.isItemHovered()) ImGui.setTooltip('Player name');

        ImGui.sameLine();
        ImGui.text('|');
        ImGui.sameLine();

        let _lobbyName = [this.lobbyInfo.name];
        if (ImGui.inputTextWithHint('##Lobby name', 'Lobby', _lobbyName))
            this.lobbyInfo.name = _lobbyName[0];
        if (ImGui.isItemHovered()) ImGui.setTooltip('Lobby name');

        ImGui.sameLine();

        let _lobbyPassword = [this.lobbyInfo.password];
        if (ImGui.inputTextWithHint('##Lobby password', 'Password', _lobbyPassword,
            !this.showLobbyPassword[0] ? ImGui.InputTextFlags.Password : ImGui.InputTextFlags.None))
            this.lobbyInfo.password = _lobbyPassword[0];
        if (ImGui.isItemHovered()) ImGui.setTooltip('Lobby password');

        ImGui.sameLine();

        ImGui.checkbox('Show password', this.showLobbyPassword);

        ImGui.popItemWidth();
    }

    private drawLaunchMenu() {
        ImGui.beginDisabled(this.busy || this.launched);
        if (ImGui.button('Configure', $.xy(120, 0)))
            this.startDolphin(true);
        ImGui.endDisabled();

        ImGui.sameLine();

        ImGui.beginDisabled(this.busy || this.launched || !this.selectedGame);
        if (ImGui.button('Start', $.xy(120, 0)))
            this.startDolphin(false);
        ImGui.endDisabled();

        ImGui.sameLine();

        ImGui.beginDisabled(this.busy || !this.selectedGame);
        if (ImGui.button('Verify', $.xy(120, 0)))
            this.verifySelectedGame();
        ImGui.endDisabled();

        ImGui.sameLine();

        ImGui.beginDisabled(this.busy || !this.selectedGame);
        if (ImGui.button('Extract', $.xy(120, 0)))
            this.extractSelectedGame();
        ImGui.endDisabled();

        ImGui.sameLine();
        ImGui.text('|');
        ImGui.sameLine();

        ImGui.beginDisabled(this.busy);
        if (ImGui.button('Set ROMs directory', $.xy(175, 0))) {
            let res = Gui.getExistingDirectory({
                parent: ImGui.getMainViewport(),
                title: 'Open ROMs directory',
                currentFolder: this.romDirPath
            });
            if (res) {
                this.romDirPath = res;
                this.refreshGameList();
            }
        }
        ImGui.endDisabled();

        ImGui.sameLine();

        ImGui.beginDisabled(!this.romDirPath);
        if (ImGui.button('Open ROMs directory', $.xy(175, 0)))
            Gui.openUrl(this.romDirPath!);
        ImGui.endDisabled();
    }

    private drawGameList() {
        ImGui.bulletText('Game List');

        if (ImGui.beginTable('gameList_tbl', 3, ImGui.TableFlags.Resizable
            | ImGui.TableFlags.Borders | ImGui.TableFlags.RowBg)) {
            ImGui.tableSetupColumn('Name');
            ImGui.tableSetupColumn('Description');
            ImGui.tableSetupColumn('Banner');
            ImGui.tableHeadersRow();

            let maxRowHeight = 0;
            let j = 0;
            for (let i of this.games) {
                const startY = ImGui.getCursorPosY();

                ImGui.tableNextRow();

                ImGui.tableNextColumn();

                const name = `${i.name}\n(${i.internalName})##GameList_Row_${j}`;
                if (this.shouldCalcGameListRowHeight)
                    ImGui.text(name);
                else if (ImGui.selectable(name, i == this.selectedGame, ImGui.SelectableFlags.SpanAllColumns
                    | ImGui.SelectableFlags.AllowDoubleClick, $.xy(0, this.gameListRowHeight))) {
                    this.selectedGame = i;
                }

                if (ImGui.isItemHovered() && ImGui.isMouseDoubleClicked(ImGui.MouseButton.Left)
                    && !(this.busy || this.launched || !this.selectedGame)) {
                    this.startDolphin(false);
                }
                if (ImGui.isItemHovered())
                    ImGui.setTooltip(`${i.filePath} (${i.volumeSize}) [${i.gameID}, ${i.region}]`);

                ImGui.tableNextColumn();

                ImGui.text(i.description);

                ImGui.tableNextColumn();

                const banner = this.banners.get(i.gameID);
                if (banner) ImGui.image(banner.id, $.xy(96, 32));
                else ImGui.text('');

                const endY = ImGui.getCursorPosY();
                const height = endY - startY;
                maxRowHeight = Math.max(maxRowHeight, height);

                ++j;
            }
            ImGui.endTable();

            if (this.shouldCalcGameListRowHeight) {
                this.gameListRowHeight = maxRowHeight;
                this.shouldCalcGameListRowHeight = false;
            }
        }
    }

    private refreshGameList() {
        this.games.length = 0;
        this.banners.clear();

        glob(path.join(this.romDirPath!, '/**/*.{elf,dol,gcm,iso,tgc,wbfs,ciso,gcz,wia,rvz,wad}').replace(/\\/g, '/'), {
            realpath: true,
            absolute: true
        }, (err, matches) => {
            Util.getGameInfo(matches).then(result => {
                for (let i of result) {
                    if (i.isValid) {
                        this.games.push(i);
                        const bannerTex = new Gfx.Texture();
                        bannerTex.loadFromBGRA32(i.bannerWidth, i.bannerHeight, Buffer.from(i.bannerBuffer));
                        this.banners.set(i.gameID, bannerTex);
                    }
                }
                this.shouldCalcGameListRowHeight = true;
            });
        });
    }
}

const app = new LauncherImGuiApp();
app.run();
