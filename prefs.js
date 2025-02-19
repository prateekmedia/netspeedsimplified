import Gtk from 'gi://Gtk'
import Gdk from 'gi://Gdk'
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'
// import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js'
// const ShellVersion = parseFloat(Config.PACKAGE_VERSION)

const schema = "org.gnome.shell.extensions.netspeedsimplified"

let settings, currentSettings, vbox

function fetchSettings() {
    currentSettings = {
        refreshtime: settings.get_double('refreshtime'),
        mode: settings.get_int('mode'),
        fontmode: settings.get_int('fontmode'),
        togglebool: settings.get_boolean('togglebool'),
        isvertical: settings.get_boolean('isvertical'),
        chooseiconset: settings.get_int('chooseiconset'),
        limitunit: settings.get_int('limitunit'),
        reverseindicators: settings.get_boolean('reverseindicators'),
        lockmouseactions: settings.get_boolean('lockmouseactions'),
        minwidth: settings.get_double('minwidth'),
        iconstoright: settings.get_boolean('iconstoright'),
        textalign: settings.get_int('textalign'),
        customfont: settings.get_string('customfont'),
        hideindicator: settings.get_boolean('hideindicator'),
        shortenunits: settings.get_boolean('shortenunits'),
        wpos: settings.get_int('wpos'),
        systemcolr: settings.get_boolean('systemcolr'),
        wposext: settings.get_int('wposext'),
        uscolor: settings.get_string('uscolor'),
        dscolor: settings.get_string('dscolor'),
        tscolor: settings.get_string('tscolor'),
        tdcolor: settings.get_string('tdcolor')
    }
}

function addIt(element, child) {
    element.append(child)
}

function newGtkBox() {
    return new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        margin_top: 10,
        margin_bottom: 10
    })
}

class NssSpinBtn {
    constructor(name, whichHbox, getLbl = "", getTooTip = "", lwer, uper, stpInc = 1, digs = 0, nume = true, pgeInc = 1, pgeSiz = 0, clmrate = 1) {
        let boolComp = (currentSettings[name] === settings.get_default_value(name).unpack())
        getLbl = boolComp ? getLbl :
            `<i>${getLbl}</i>`
        let whichLbl = new Gtk.Label({
            label: getLbl,
            use_markup: true,
            xalign: 0,
            tooltip_text: getTooTip
        })
        let whichSpinBtn = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: lwer,
                upper: uper,
                step_increment: stpInc,
                page_increment: pgeInc,
                page_size: pgeSiz
            }),
            climb_rate: clmrate,
            digits: digs,
            numeric: nume,
        })
        whichSpinBtn.set_value(currentSettings[name])
        whichSpinBtn.connect('value-changed', () => {
            this.rTValue = parseFloat(whichSpinBtn.get_value().toFixed(1))
            if (currentSettings[name] !== this.rTValue) {
                settings.set_double(name, this.rTValue)
                settings.set_boolean('restartextension', true)
            }

            currentSettings[name] = this.rTValue
        })
        whichLbl.set_hexpand(true)
        addIt(whichHbox, whichLbl)
        addIt(whichHbox, whichSpinBtn)

        addIt(vbox, whichHbox)
    }
}

class NssComboBox {
    constructor(name, whichHbox, getLbl, aRray = [], getTooTip = "") {
        let boolComp = (currentSettings[name] == settings.get_default_value(name).unpack())
        getLbl = boolComp ? getLbl :
            `<i>${getLbl}</i>`
        let tootext = boolComp ? "" : "The Value is Changed"

        let whichLbl = new Gtk.Label({
            label: getLbl,
            use_markup: true,
            xalign: 0,
            tooltip_text: getTooTip
        })
        let whichVlue = new Gtk.ComboBoxText({
            halign: Gtk.Align.END,
            tooltip_text: tootext
        })

        aRray.forEach((val, _, __) => whichVlue.append_text(val))


        whichVlue.set_active(currentSettings[name])
        whichVlue.connect('changed', (widget) => {
            let valueMode = widget.get_active()
            settings.set_int(name, valueMode)
            settings.set_boolean('restartextension', true)

            currentSettings[name] = valueMode
        })
        whichLbl.set_hexpand(true)
        addIt(whichHbox, whichLbl)
        addIt(whichHbox, whichVlue)

        addIt(vbox, whichHbox)
    }
}

class NssToggleBtn {
    constructor(whichHbox, getLbl, name, getTooTip = "", func) {
        let boolComp = true
        if (func == undefined) {
            boolComp = (currentSettings[name] == settings.get_default_value(name).unpack())
            getLbl = boolComp ? getLbl :
                `<i>${getLbl}</i>`
        }
        let tootext = boolComp ? "" : "The Value is Changed"
        let whichLbl = new Gtk.Label({
            label: getLbl,
            use_markup: true,
            xalign: 0,
            tooltip_text: getTooTip
        })
        let whichVlue = new Gtk.Switch({
            active: name ? currentSettings[name] : false,
            tooltip_text: tootext
        })
        whichVlue.connect('notify::active', (widget) => {
            if (func != undefined)
                func(widget.active)
            else {
                settings.set_boolean(name, widget.active)
                settings.set_boolean('restartextension', true)
            }

            currentSettings[name] = widget.active
        })

        whichLbl.set_hexpand(true)
        addIt(whichHbox, whichLbl)
        addIt(whichHbox, whichVlue)

        addIt(vbox, whichHbox)
    }
}

class NssColorBtn {
    constructor(whichHbox, getLbl, name, getToolTip = "") {
        //Deterime whether the option value is changed from default value
        let boolComp = (currentSettings[name] == settings.get_default_value(name).unpack())
        getLbl = boolComp ? getLbl : `<i>${getLbl}</i>`
        let tootext = boolComp ? "" : "The Value is Changed"

        //Create the option name
        let whichLbl = new Gtk.Label({
            label: getLbl,
            use_markup: true,
            xalign: 0,
            tooltip_text: getToolTip
        })

        //Create RGBA
        let rgba = new Gdk.RGBA()
        rgba.parse(currentSettings[name])

        //Create ColorButton 
        let colorButton = new Gtk.ColorButton({
            tooltip_text: tootext
        })
        colorButton.set_rgba(rgba)
        colorButton.connect('color-set', (widget) => {
            rgba = widget.get_rgba()
            settings.set_string(name, rgba.to_string())
            settings.set_boolean('restartextension', true)

            currentSettings[name] = rgba.to_string()
        })

        whichLbl.set_hexpand(true)
        addIt(whichHbox, whichLbl)
        addIt(whichHbox, colorButton)

        addIt(vbox, whichHbox)
    }
}

class NssEntry {
    constructor(whichHbox, getLbl, name, getTooTip = "", func) {
        let boolComp = (currentSettings[name] == settings.get_default_value(name).unpack())
        getLbl = boolComp ? getLbl :
            `<i>${getLbl}</i>`
        let tootext = boolComp ? "" : "The Value is Changed"
        let whichLbl = new Gtk.Label({
            label: getLbl,
            use_markup: true,
            xalign: 0,
            tooltip_text: getTooTip
        })
        let whichVlue = new Gtk.Entry({
            text: currentSettings[name],
            tooltip_text: tootext,
            placeholder_text: "Press Enter to apply"
        })
        whichVlue.connect('activate', (widget) => {
            settings.set_string(name, widget.get_text())
            if (func != undefined) {
                func(widget.active)
            } else {
                settings.set_boolean('restartextension', true)
            }

            currentSettings[name] = widget.get_text()
        })

        whichLbl.set_hexpand(true)
        addIt(whichHbox, whichLbl)
        addIt(whichHbox, whichVlue)

        addIt(vbox, whichHbox)
    }
}

export default class NetSpeedSimplifiedPreferences extends ExtensionPreferences {
    getPreferencesWidget() {
        settings = this.getSettings(schema)
        window._settings = settings

        fetchSettings()

        let frame = new Gtk.ScrolledWindow()
        let label = new Gtk.Label({
            label: "<b>General Settings</b>",
            use_markup: true,
            xalign: 0,
            margin_top: 15
        })
        vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_start: 25,
            margin_end: 25,
            vexpand: true,
        })
        let resetBtn = new Gtk.Button({
            label: "Restore Defaults",
            margin_bottom: 15
        })

        resetBtn.connect("clicked", async () => {
            let strArray = ["customfont", "uscolor", "dscolor", "tscolor", "tdcolor"]
            let intArray = ["wpos", "wposext", "mode", "fontmode", "chooseiconset", "textalign"]
            let doubleArray = ["refreshtime", "minwidth"]
            let boolArray = ["isvertical", "togglebool", "reverseindicators", "lockmouseactions", "hideindicator", "shortenunits", "iconstoright"]
            for (const i in strArray) {
                settings.set_string(strArray[i], settings.get_default_value(strArray[i]).unpack())
            }
            for (const j in intArray) {
                settings.set_int(intArray[j], settings.get_default_value(intArray[j]).unpack())
            }
            for (const k in doubleArray) {
                settings.set_double(doubleArray[k], settings.get_default_value(doubleArray[k]).unpack())
            }
            for (const l in boolArray) {
                settings.set_boolean(boolArray[l], settings.get_default_value(boolArray[l]).unpack())
            }
            settings.set_boolean('restartextension', true)
            fetchSettings()
        })

        addIt(vbox, label)
        // For Position
        let hboxWPos = newGtkBox()
        new NssComboBox("wpos", hboxWPos, "Position on the Panel", ["Right", "Left", "Center"], "Choose where to Place the extension on the Panel")

        // For Position Extras
        let hboxWPosExt = newGtkBox()
        new NssComboBox("wposext", hboxWPosExt, "Position(Advanced)", ["Prefer Right Side", "Prefer Left Side"], "Choose further where to Place the extension")

        // Refresh time
        let hboxRTime = newGtkBox()
        new NssSpinBtn("refreshtime", hboxRTime, "Refresh Time", "Change Refresh time value from anywhere b/w 1 to 10", 1.0, 10.0, .1, 1)

        // For Modes
        let hboxMode = newGtkBox()
        new NssComboBox("mode", hboxMode, "Mode", ["Mode 1", "Mode 2", "Mode 3", "Mode 4", "Mode 5"], "Choose which mode to load")

        // For FontModes
        let hboxFontMode = newGtkBox()
        new NssComboBox("fontmode", hboxFontMode, "Font Mode", ["Default", "Smallest", "Smaller", "Small", "Large"], "Choose which font to display")

        // For Vertical Alignment
        let hboxVertical = newGtkBox()
        new NssToggleBtn(hboxVertical, "Vertical Align", "isvertical", "Changing it will toggle Vertical Alignment")

        // For Default sigma View
        let hboxToggleBool = newGtkBox()
        new NssToggleBtn(hboxToggleBool, "Show Total Data Transfer", "togglebool", "Enabling it will always show the sigma")

        // For Toggling Old Icons
        let hboxIconset = newGtkBox()
        new NssComboBox("chooseiconset", hboxIconset, "Choose Icons Set", [" ⬇,  ⬆", " 🡳,  🡱", " ↓,  ↑"], "Choose which icon set to display")

        // Text align for net speed
        let hboxText = newGtkBox()
        new NssComboBox("textalign", hboxText, "Text Align", ["Left", "Right", "Center"], "Align Text of net speed")

        // Toggle icon to right
        let hboxIconsRight = newGtkBox()
        new NssToggleBtn(hboxIconsRight, "Move icons to the right", "iconstoright", "Move icons to the right")

        // For Limiting upper limit of speed
        let hboxLimitUnit = newGtkBox()
        new NssComboBox("limitunit", hboxLimitUnit, "Limit Unit", ["(None)", 'K', 'M', 'G', 'T', 'P', 'E', 'Z'], "Choose unit limitation set to display")

        // For Hide When Disconnected
        let hboxHideInd = newGtkBox()
        new NssToggleBtn(hboxHideInd, "Hide When Disconnected", "hideindicator", "Enabling it will Hide Indicator when disconnected")

        // For Shorten Units
        let hboxShUni = newGtkBox()
        new NssToggleBtn(hboxShUni, "Shorten Units", "shortenunits", "Enabling it will result in shorten units like K instead of KB")

        // For Reversing the download and upload indicators
        let hboxRevInd = newGtkBox()
        new NssToggleBtn(hboxRevInd, "Show Upload First", "reverseindicators", "Enabling it will reverse the upload and download speed indicators")

        // For Lock Mouse Actions
        let hboxLckMuseAct = newGtkBox()
        new NssToggleBtn(hboxLckMuseAct, "Lock Mouse Actions", "lockmouseactions", "Enabling it will Lock Mouse Actions")

        // Minimum Width
        let hboxMinWidth = newGtkBox()
        new NssSpinBtn("minwidth", hboxMinWidth, "Minimum Width", "Change Minimum Width value from anywhere b/w 3em to 10em", 3.0, 10.0, .5, 1)

        // For Custom Font name
        let hboxCustFont = newGtkBox()
        new NssEntry(hboxCustFont, "Custom Font Name", "customfont", "Enter the font name you want, you can also write style here for all elements except indicators")

        // For Custom Font name
        let hboxSysColr = newGtkBox()
        new NssToggleBtn(hboxSysColr, "Use System Color Scheme", "systemcolr", "Enabling it will allow changing font color dynamically based on panel color")

        // Upload Speed Color 
        let usColorButton = newGtkBox()
        new NssColorBtn(usColorButton, "Upload Speed Color", "uscolor", "Select the upload speed color")

        // Download Speed Color 
        let dsColorButton = newGtkBox()
        new NssColorBtn(dsColorButton, "Download Speed Color", "dscolor", "Select the download speed color")

        // Total Speed Color 
        let tsColorButton = newGtkBox()
        new NssColorBtn(tsColorButton, "Total Speed Color", "tscolor", "Select the total speed color")

        // Total Download Color 
        let tdColorButton = newGtkBox()
        new NssColorBtn(tdColorButton, "Total Download Color", "tdcolor", "Select the total download color")

        addIt(vbox, resetBtn)
        frame.child = vbox

        return frame
    }
}
