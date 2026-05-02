//Imports
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
const schema = 'org.gnome.shell.extensions.netspeedsimplified',
    ButtonName = "ShowNetSpeedButton",
    rCConst = 4; //Right Click 4 times to toggle Vertical Alignment

let settings, timeout,
    lastCount = 0,
    lastSpeed = 0,
    lastCountUp = 0,
    resetNextCount = false,
    resetCount = 0,
    hideCount = 8,
    B_UNITS;

// Settings
var currentSettings; //Initialized in enable()

function fetchSettings() {
    currentSettings = {
        refreshTime: settings.get_double('refreshtime'),
        mode: settings.get_int('mode'),
        fontmode: settings.get_int('fontmode'),
        showTotalDwnld: settings.get_boolean('togglebool'),
        isVertical: settings.get_boolean('isvertical'),
        chooseIconSet: settings.get_int('chooseiconset'),
        limitunit: settings.get_int('limitunit'),
        revIndicator: settings.get_boolean('reverseindicators'),
        lckMuseAct: settings.get_boolean('lockmouseactions'),
        minWidth: settings.get_double('minwidth'),
        iconsToRight: settings.get_boolean('iconstoright'),
        textAlign: settings.get_int('textalign'),
        cusFont: settings.get_string('customfont'),
        hideInd: settings.get_boolean('hideindicator'),
        shortenUnits: settings.get_boolean('shortenunits'),
        nsPos: settings.get_int('wpos'),
        systemColr: settings.get_boolean('systemcolr'),
        nsPosAdv: settings.get_int('wposext'),
        usColor: settings.get_string('uscolor'),
        dsColor: settings.get_string('dscolor'),
        tsColor: settings.get_string('tscolor'),
        tdColor: settings.get_string('tdcolor')
    };

    B_UNITS = (currentSettings.shortenUnits) ? ['B', 'K', 'M', 'G', 'T', 'P', 'E', 'Z'] : [' B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB'];

    initNs();
}

function pushSettings() {
    settings.set_int('mode', currentSettings.mode);
    settings.set_int('fontmode', currentSettings.fontmode);
    settings.set_boolean('togglebool', currentSettings.showTotalDwnld);
    settings.set_boolean('isvertical', currentSettings.isVertical);

    initNs();
}

//Helper Functions
function DIcons(iNum) {
    return [
        ["⬇", "⬆"],
        ["🡳", "🡱"],
        ["↓", "↑"]
    ][currentSettings.chooseIconSet][iNum];
}

function nsPos() {
    return ["right", "left", "center"][currentSettings.nsPos];
}

function nsPosAdv() {
    return [3, 0][currentSettings.nsPosAdv];
}

function speedToString(amount, rMode = 0) {

    let speed_map = B_UNITS.map(
        (rMode == 1 && (currentSettings.mode == 1 || currentSettings.mode == 3 || currentSettings.mode == 4)) ? v => v : //KB
            (rMode == 1 && (currentSettings.mode == 0 || currentSettings.mode == 2)) ? v => v.toLowerCase() : //kb
                (currentSettings.mode == 0 || currentSettings.mode == 2) ? v => v.toLowerCase() + "/s" : //kb/s
                    (currentSettings.mode == 1 || currentSettings.mode == 3) ? v => v + "/s" : //KB/s
                        v => v); // Others

    if (amount === 0) return "  0.0 " + speed_map[0];
    if (currentSettings.mode == 0 || currentSettings.mode == 2) amount = amount * 8;

    let unit = 0;
    while (amount >= 1000) { // 1M=1024K, 1MB/s=1000MB/s
        if (currentSettings.limitunit != 0 && unit >= currentSettings.limitunit) {
            break;
        }
        amount /= 1000;
        unit++;
    }

    let digits = (currentSettings.mode == 4 || rMode != 0) ? 2 /* For floats like 21.11 and total speed mode */ : 1 //For floats like 21.2

    let spaceNum = 3 - Math.ceil(Math.log10(amount + 1));
    spaceNum < 0 ? spaceNum = 0 : null

    return " ".repeat(spaceNum) + amount.toFixed(digits) + " " + speed_map[unit];
}

// NetSpeed Components
var usLabel, dsLabel, tsLabel, tdLabel, usIcon, dsIcon, tsIcon, tdIcon;

function getStyle(isIcon = false) {
    return (isIcon) ? 'size-' + (String(currentSettings.fontmode)) : ('forall size-' + String(currentSettings.fontmode))
}

function byteArrayToString(bytes) {
    return new TextDecoder().decode(bytes);
}

function initNsLabels() {
    let extraInfo = currentSettings.cusFont ? "font-family: " + currentSettings.cusFont + "; " : "";
    let extraLabelInfo = extraInfo + "min-width: " + currentSettings.minWidth + "em; ";
    extraLabelInfo += "text-align: " + ["left", "right", "center"][currentSettings.textAlign] + "; ";


    usLabel = new St.Label({
        text: '--',
        y_align: Clutter.ActorAlign.CENTER,
        style_class: getStyle(),
        style: extraLabelInfo + (currentSettings.systemColr ? "" : "color: " + currentSettings.usColor)
    });

    dsLabel = new St.Label({
        text: '--',
        y_align: Clutter.ActorAlign.CENTER,
        style_class: getStyle(),
        style: extraLabelInfo + (currentSettings.systemColr ? "" : "color: " + currentSettings.dsColor)
    });

    tsLabel = new St.Label({
        text: '--',
        y_align: Clutter.ActorAlign.CENTER,
        style_class: getStyle(),
        style: extraLabelInfo + (currentSettings.systemColr ? "" : "color: " + currentSettings.tsColor)
    });

    tdLabel = new St.Label({
        text: '--',
        y_align: Clutter.ActorAlign.CENTER,
        style_class: getStyle(),
        style: extraLabelInfo + (currentSettings.systemColr ? "" : "color: " + currentSettings.tdColor)
    });
    usIcon = new St.Label({
        text: DIcons(1),
        y_align: Clutter.ActorAlign.CENTER,
        style_class: getStyle(true),
        style: extraInfo + (currentSettings.systemColr ? "" : "color: " + currentSettings.usColor)
    });

    dsIcon = new St.Label({
        text: DIcons(0),
        y_align: Clutter.ActorAlign.CENTER,
        style_class: getStyle(true),
        style: extraInfo + (currentSettings.systemColr ? "" : "color: " + currentSettings.dsColor)
    });

    tsIcon = new St.Label({
        text: "⇅",
        y_align: Clutter.ActorAlign.CENTER,
        style_class: getStyle(true),
        style: extraInfo + (currentSettings.systemColr ? "" : "color: " + currentSettings.tsColor)
    });

    tdIcon = new St.Label({
        text: "Σ",
        y_align: Clutter.ActorAlign.CENTER,
        style_class: getStyle(true),
        style: extraInfo + (currentSettings.systemColr ? "" : "color: " + currentSettings.tdColor)
    });
}

function updateNsLabels(up, down, up_down, total) {
    usLabel.set_text(up);
    dsLabel.set_text(down);
    tsLabel.set_text(up_down);
    tdLabel.set_text(total);
}

// Initalize NetSpeed
var nsButton = null,
    nsActor = null,
    nsLayout = null;

function initNs() {

    //Destroy the existing button.
    nsDestroy();

    //Initialize component Labels
    initNsLabels();

    //Allocate 3 * 3 grid (suited for all modes)
    nsLayout = new Clutter.GridLayout();
    nsLayout.insert_row(1);
    nsLayout.insert_row(2);
    nsLayout.insert_column(1);
    nsLayout.insert_column(2);

    nsActor = new Clutter.Actor({
        layout_manager: nsLayout,
        y_align: Clutter.ActorAlign.CENTER
    })

    let verticalConstant = (currentSettings.isVertical) ? 1 : 0;
    let heightConstant = 1 + verticalConstant;
    let widthConstant = 2 * (1 - verticalConstant);

    //Attach the components to the grid.
    if (currentSettings.mode == 0 || currentSettings.mode == 1) {
        nsLayout.attach(!currentSettings.iconsToRight ? tsIcon : tsLabel, 0, 1, 1, 1);
        nsLayout.attach(!currentSettings.iconsToRight ? tsLabel : tsIcon, 1, 1, 1, 1);

        if (currentSettings.showTotalDwnld) {
            nsLayout.attach(!currentSettings.iconsToRight ? tdIcon : tdLabel, widthConstant, heightConstant, 1, 1);
            nsLayout.attach(!currentSettings.iconsToRight ? tdLabel : tdIcon, 1 + widthConstant, heightConstant, 1, 1);
        }
    } else if (currentSettings.mode == 2 || currentSettings.mode == 3) {
        if (currentSettings.revIndicator) {
            nsLayout.attach(!currentSettings.iconsToRight ? usIcon : usLabel, 0, 1, 1, 1);
            nsLayout.attach(!currentSettings.iconsToRight ? usLabel : usIcon, 1, 1, 1, 1);
            nsLayout.attach(!currentSettings.iconsToRight ? dsIcon : dsLabel, widthConstant, heightConstant, 1, 1);
            nsLayout.attach(!currentSettings.iconsToRight ? dsLabel : dsIcon, 1 + widthConstant, heightConstant, 1, 1);
        } else {
            nsLayout.attach(!currentSettings.iconsToRight ? dsIcon : dsLabel, 0, 1, 1, 1);
            nsLayout.attach(!currentSettings.iconsToRight ? dsLabel : dsIcon, 1, 1, 1, 1);
            nsLayout.attach(!currentSettings.iconsToRight ? usIcon : usLabel, widthConstant, heightConstant, 1, 1);
            nsLayout.attach(!currentSettings.iconsToRight ? usLabel : usIcon, 1 + widthConstant, heightConstant, 1, 1);
        }

        if (currentSettings.showTotalDwnld) {
            nsLayout.attach(!currentSettings.iconsToRight ? tdIcon : tdLabel, 2 + widthConstant, heightConstant, 1, 1);
            nsLayout.attach(!currentSettings.iconsToRight ? tdLabel : tdIcon, 3 + widthConstant, heightConstant, 1, 1);
        }
    } else {
        nsLayout.attach(!currentSettings.iconsToRight ? tdIcon : tdLabel, 0, 1, 1, 1);
        nsLayout.attach(!currentSettings.iconsToRight ? tdLabel : tdIcon, 1, 1, 1, 1);
    }

    //Create the button and add to Main.panel
    nsButton = new PanelMenu.Button(0.0, ButtonName, true);

    (!currentSettings.lckMuseAct) ? nsButton.connect('button-press-event', mouseEventHandler) : null;
    nsButton.add_child(nsActor);

    Main.panel.addToStatusArea(ButtonName, nsButton, nsPosAdv(), nsPos());
}

function nsDestroy() {
    nsButton != null ? nsButton.destroy() : null
    nsButton = null;
}

// Mouse Event Handler
var startTime = null,
    rClickCount = 0;

function mouseEventHandler(widget, event) {
    if (event.get_button() == 3) {
        if (currentSettings.mode == 4)
            resetNextCount = true; // right click: reset downloaded sum
        else
            currentSettings.showTotalDwnld = !(currentSettings.showTotalDwnld); // right click on other modes brings total downloaded sum

        // Logic to toggle crStng.isVertical after rCConstant consequent right clicks.
        if (startTime == null) {
            startTime = new Date();
        }

        if (((new Date() - startTime) / 1000) <= currentSettings.refreshTime * 2) {
            if (rClickCount == rCConst - 1) {
                currentSettings.isVertical = !(currentSettings.isVertical);
                startTime = null;
                rClickCount = 0;
            } else rClickCount++;
        } else {
            startTime = new Date();
            rClickCount = 1;
        }
    } else if (event.get_button() == 2) { // change font
        currentSettings.fontmode++;
        if (currentSettings.fontmode > 4) currentSettings.fontmode = 0;
    } else if (event.get_button() == 1) {
        currentSettings.mode++;
        if (currentSettings.mode > 4) currentSettings.mode = 0;
    }

    pushSettings();
    parseStat();
}

function parseStat() {
    try {
        let input_file = Gio.file_new_for_path('/proc/net/dev');
        let [, contents, etag] = input_file.load_contents(null);
        contents = byteArrayToString(contents);
        let lines = contents.split('\n');

        let count = 0;
        let countUp = 0;
        let line;

        for (let i = 0; i < lines.length; i++) {
            line = lines[i];
            line = line.trim();
            let fields = line.split(/\W+/);
            if (fields.length <= 2) break;

            if (fields[0] != "lo" &&
                !fields[0].match(/^ifb[0-9]+/) &&
                !fields[0].match(/^lxdbr[0-9]+/) &&
                !fields[0].match(/^virbr[0-9]+/) &&
                !fields[0].match(/^br[0-9]+/) &&
                !fields[0].match(/^vnet[0-9]+/) &&
                !fields[0].match(/^veth[0-9a-zA-Z]+/) &&
                !fields[0].match(/^docker[0-9]+/) &&
                !fields[0].match(/^tun[0-9]+/) &&
                !fields[0].match(/^tap[0-9]+/) &&
                !fields[0].match(/^wg[0-9]+/) &&
                !fields[0].match(/^waydroid[0-9]+/) &&
                !isNaN(parseInt(fields[1]))) {
                count = count + parseInt(fields[1]) + parseInt(fields[9]);
                countUp = countUp + parseInt(fields[9]);
            }
        }

        if (lastCount === 0) lastCount = count;
        if (lastCountUp === 0) lastCountUp = countUp;

        let speed = (count - lastCount) / currentSettings.refreshTime,
            speedUp = (countUp - lastCountUp) / currentSettings.refreshTime;

        if (resetNextCount == true) {
            resetNextCount = false;
            resetCount = count;
        }

        (speed || speedUp) ? hideCount = 0 : hideCount <= 8 ? hideCount++ : null

        if (hideCount <= 8) {
            nsButton == null ? initNs() : null

            updateNsLabels(" " + speedToString(speedUp),
                " " + speedToString(speed - speedUp),
                " " + speedToString(speed),
                " " + speedToString(count - resetCount, 1));
        } else {
            if (currentSettings.hideInd) {
                nsDestroy();
            } else {
                nsButton == null ? initNs() : null
                updateNsLabels('--', '--', '--', speedToString(count - resetCount, 1));
            }
        }

        lastCount = count;
        lastCountUp = countUp;
        lastSpeed = speed;

    } catch (e) {
        usLabel.set_text(e.message);
        tsLabel.set_text(e.message);
        tdLabel.set_text(e.message);
    }
    return true;
}


export default class NetSpeedSimplifiedExtension extends Extension {
    _settingsChanged() {
        if (settings.get_boolean('restartextension')) {
            settings.set_boolean('restartextension', false);
            this.disable();
            this.enable();
            parseStat();
        }
    }

    enable() {
        settings = this.getSettings(schema);

        fetchSettings(); // Automatically creates the netSpeed Button.
        this._settingsChangedId = settings.connect('changed', () => this._settingsChanged());
        parseStat();

        //Run infinite loop.
        timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, currentSettings.refreshTime, parseStat);
    }

    disable() {
        currentSettings = null;
        settings = null;
        
        usLabel = null;
        dsLabel = null;
        tsLabel = null;
        tdLabel = null;
        usIcon = null;
        dsIcon = null;
        tsIcon = null;
        tdIcon = null;

        GLib.source_remove(timeout);
        nsDestroy();
    }
}
