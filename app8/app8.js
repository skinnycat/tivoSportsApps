/*******************************
 * SportsApp
 * @author Neil Cooper
 *
 * This is going to need a LOT of re-factoring :-)
 *
 *
 */
'use strict'

var SportsApp = function () {

    //Key Codes
    var INFOBUTTON = 457,
        REDBUTTON = 0,
        iKEY = 73,

        help = new HelpPopup(),
        ticker = new Ticker(),
        iMenu = new Imenu(),
        statsMenu = new StatsMenu(),
        alerts = new Alerts(),
        videoMenu = new VideoMenu(),
        rtu = new Rtu(),
        config = new Config(),
        urlQuery = new QueryString(),
        drawStats = new DrawStats(),
        genStats = new GenStats(),
        randNum = new RandomURLNum(); // new random number gen object


    var buildEvent = function () {

        sportsAppModel.setCurrentFocus("videoMenu");

        loadConfigs(); //load the configuration JSON files

        function loadConfigs() {

            /*
             * The configuration files are loaded synchronously because, without them, the application
             * is useless. There is nothing else to do while they are loading, other than display a splash
             * screen. Normally, I wouldn't do this because it freezes the browser but in this case there 
             * was no reason to go all Async.
             */

            // Load the initial app configuration data
            config.loadConfig();

            // Load the RTU configuration
            rtu.loadRtu(false);

            // Start RTU
            rtu.startRtu();

            // Load the videoMenu configuration
            videoMenu.loadVideoMenu();

            help.loadHelpText();
            help.buildHelpPopup();

            /* 
             * Load the statsMenu configuration.
             * We pass in "TAB_MENU" to check the data for the main
             * stats menu is available.
             */
            statsMenu.loadStatsMenu(false, "TAB_MENU");
            sportsAppModel.setCurrentFocus("videoMenu");

            videoMenu.init(0); //initialise video menu with video menu 0
            statsMenu.init(); //initialise the iMenu (if required)

            //check to see if iMenu is required. It's not worth going through all the bother
            //of setting one up if it's not even wanted, is it?
            var iMenuRequired = false;

            initialise_control(); //initialise remote control listener
            return;
        };

    }

    /*
     * Function: initialise_control
     * 
     * @desc Initialises the remote control button event listener
     */
    var initialise_control = function () {
        addEventListener("keydown",
            function () {

                if (event.keyCode == 48) {
                    if (statsMenuModel.getStatsMenuSectionsData()) {
                        statsMenu.closeStatsMenu();
                    }
                    //sportsAppModel.setLastFocus(sportsAppModel.getCurrentFocus());
                    sportsAppModel.setCurrentFocus("help");
                    help.showHelpPopup();

                } else if (event.keyCode == INFOBUTTON || event.keyCode == iKEY) {
                    if (statsMenuModel.getStatsMenuStatus()) {
                        var currentFocus = sportsAppModel.getCurrentFocus();
                        if (currentFocus != "help") {
                            //keyCode 457 : i (info) button
                            if (currentFocus != "statsMenu") {
                                //sportsAppModel.setLastFocus(currentFocus);
                                sportsAppModel.setCurrentFocus("statsMenu");
                            }


                            statsMenu.statsMenuController(event.keyCode);
                        }
                    }

                } else {
                    switch (sportsAppModel.getCurrentFocus()) {

                    case "statsMenu":
                        statsMenu.statsMenuController(event.keyCode);
                        break;
                    case "videoMenu":
                        videoMenu.videoMenuController(event.keyCode);
                        break;
                    case "fullscreen":
                        videoMenu.videoMenuController(event.keyCode);
                        break;
                    case "alerts":
                        alerts.alertController(event.keyCode);
                        break;
                    case "help":
                        help.helpController(event.keyCode);
                        break;
                    case "draw":
                        drawStats.drawController(event.keyCode);
                        break;
                    case "stats":
                        genStats.statsController(event.keyCode);
                        break;
                    }
                }

            }
        );
    };



    vmDtvLib.dax.init("Sky Sports Formula 1 (app8)", version);

    sportsAppModel.setIsHD(urlQuery.ishd);

    buildEvent();
}

/*************************************
 * RTU - Real Time Updates
 *
 * kl - Kill Application
 * vm - Video Menu
 * ad - Alert
 * im - iMenu
 * td - Ticker Data
 *
 */

var Rtu = function () {

    var RTU_URL = "rtu.json",
        randNum = new RandomURLNum(), // new random number gen object
        alerts = new Alerts(),
        videoMenu = new VideoMenu(),
        ticker = new Ticker(),
        self = this;

    self.rtuLoader = function () {
        self.jsonLoader();
    }

    var rtuProcessor = function () {

        var rtuData = rtuModel.getRtuData();

        if (rtuModel.isFirstTime()) {
            rtuModel.setVmDataVersion(rtuData.vm);
            rtuModel.setImenuDataVersion(rtuData.im);
            rtuModel.setAlertDataVersion(rtuData.ad);
            rtuModel.setTickerDataVersion(rtuData.td);
            rtuModel.isFirstTime(false);
        }


        //check for changes in data
        //Check to see if KILL APP has been set
        if (rtuData.kl === "1") {
            console.log("kl:1 KILL APP");
            var channelManager = new ChannelManager();
            channelManager.exit();
            /*splashLoader.show();
            var av = new Av();
            var chanID = channelManagerModel.getChannelID();
            vmDtvLib.chanMan.exitToTv(av.videoStreams[chanID]);
            av = null;*/
        }

        //Check for video menu update
        if (rtuModel.getVmDataVersion() != rtuData.vm) {
            var videoMenu = new VideoMenu();
            //load latest video menu data
            videoMenu.loadVideoMenu(true);
            //store the latest value
            rtuModel.setVmDataVersion(rtuData.vm);
            videoMenu = null;
        }

        //Check for iMenu update
        if (rtuModel.getImenuDataVersion() < rtuData.im) {
            var statsMenu = new StatsMenu(),
                iMenu = new Imenu();
            console.log("NEW STATS");
            //load latest iMenu data
            statsMenu.loadStatsMenu(true, "TAB_MENU");
            //store the latest value
            rtuModel.setImenuDataVersion(rtuData.im);
            iMenu = null;
        }

        //If alerts are required-the user has selected Alerts in the iMenu
        if (iMenuModel.getAlertStatus()) {
            var alerts = new Alerts();
            var currentVersion = rtuModel.getAlertDataVersion();

            if (currentVersion < rtuData.ad) {
                //load latest alert data
                alerts.loadAlert(true);
                //store the latest value
                rtuModel.setAlertDataVersion(rtuData.ad);
            }
            alerts = null;
        }

        if (rtuModel.getTickerDataVersion() < rtuData.td) {
            var ticker = new Ticker();
            //load latest ticker data
            ticker.loadTicker();
            //store the latest value data version
            rtuModel.setTickerDataVersion(rtuData.td);
            ticker = null;
        }
    }

    self.loadRtu = function (rtu) {
        //Only use AJAX if called by itself
        //console.log("Loading RTU");
        var jsLoad = rtu ? new AJAXjsonLoader() : new SJAXjsonLoader();
        var jsonFile = RTU_URL + "?" + randNum.giveMeARandomNum();
        jsLoad.loadJSON(jsonFile,
            function (data) {
                //store the rtu JSON Data
                rtuModel.setRtuData(data);
                var x = rtuModel.getRtuData();
                rtuProcessor();
                return;
            },
            function (jsonHR) {
                vmDtvLib.dax.trackError(jsonHR, "JSON Load error " + RTU_URL);
                console.error("JSON Load Error -> " + jsonHR);
            }
        );
    }

    this.startRtu = function () {
        console.log("Starting RTU");
        setInterval(function () {
            //console.log("interval set");
            self.loadRtu(true);
        }, configModel.getPollTime());
    }


}

var VideoMenu = function () {

    var self = this,
        index = 0,
        newIndex = 0,
        oIndex = 0,
        TARGETBOXOFFSET = 4,
        //var SCREENRATIOX = 1; // 1.77777777;		        //Conversion between 720 pixels and 1280 pixels in screen width
        //var SCREENRATIOY = 1; // 1.25;					    //Conversion between 576 pixels and 720 pixels in screen height
        VIDEOMENU_URL = "videomenu.json",
        videoMenuTimer,
        BACKUP_TO_EXIT_VM_MESSAGE = "PRESS BACKUP TO EXIT TO VIDEO MENU",
        PRESS_LEFT_RIGHT_AUDIO_MESSAGE = "PRESS LEFT AND RIGHT ARROWS TO CHANGE AUDIO",
        randNum = new RandomURLNum(); // new random number gen object

    //get the JSON config file
    self.loadVideoMenu = function (rtu) {

        var jsLoad = rtu ? new AJAXjsonLoader() : new SJAXjsonLoader();

        jsLoad.loadJSON(VIDEOMENU_URL + "?" + randNum.giveMeARandomNum(),
            function (data) {
                videoMenuModel.setVideoMenuConfig(data);
                return;
            },
            function (jsonHR) {
                vmDtvLib.dax.trackError(jsonHR, "JSON Load error " + VIDEOMENU_URL);
                console.error("JSON loader error: " + jsonHR + " " + VIDEOMENU_URL);
            }
        );
    };

    /*
     * showTarget : draws and displays the video menu target box.
     */
    self.showTarget = function (x, y, w, h, borderColour) {
        console.log("show Target x:" + x + " y:" + y + " w:" + w + " h:" + h + " bordercolour:" + borderColour);
        var targetBox = document.getElementById('target');
        //set the target visibility flag
        videoMenuModel.targetVisible(true);
        //only draw the target box if it's needed - if the width and height are more than 0
        if (h > 0 && w > 0) {
            //set coords, width, height and colour
            targetBox.style.left = x + "px";
            targetBox.style.top = y + "px";
            targetBox.style.width = w + "px";
            targetBox.style.height = h + "px";
            targetBox.style.borderColor = borderColour;
            //display the target
            targetBox.style.visibility = "visible";
        } else {
            var iMenu = new Imenu();
            iMenu.hideAudioIcon(); //Hide the audio icon just to make sure
            iMenu.showMessageStrap(BACKUP_TO_EXIT_VM_MESSAGE, 10000, true); //make it known that you can exit by using backup

            //hide the target it height and width are 0
            return self.hideTarget();
        }

        return;

    };

    self.hideTarget = function () {
        var targetBox = document.getElementById('target');
        videoMenuModel.targetVisible(false);
        targetBox.style.visibility = "hidden";
        return;
    };

    var targetMove = function (index, newIndex, oIndex) {

        var videoMenuConfig = videoMenuModel.getVideoMenuConfig();

        //set the coordinates, heights and widths of current positions and new postions
        var x = (Number(videoMenuConfig.videoMenu[index].matrix.option[oIndex].x) - TARGETBOXOFFSET); //x position start
        var y = (Number(videoMenuConfig.videoMenu[index].matrix.option[oIndex].y) - TARGETBOXOFFSET); //y position start
        var nx = (Number(videoMenuConfig.videoMenu[index].matrix.option[newIndex].x) - TARGETBOXOFFSET); //x position new
        var ny = (Number(videoMenuConfig.videoMenu[index].matrix.option[newIndex].y) - TARGETBOXOFFSET); //y position new
        var h = (Number(videoMenuConfig.videoMenu[index].matrix.option[oIndex].h)); //current height
        var w = (Number(videoMenuConfig.videoMenu[index].matrix.option[oIndex].w)); //current width
        var nh = (Number(videoMenuConfig.videoMenu[index].matrix.option[newIndex].h)); //new height
        var nw = (Number(videoMenuConfig.videoMenu[index].matrix.option[newIndex].w)); //new width

        //multiplier for moving target direction
        var xDirection = x > nx ? -1 : 1;
        var yDirection = y > ny ? -1 : 1;

        //multiplier for target sizing
        var hDirection = h > nh ? -1 : 1; //if old height is larger than new height then height multiplier is -1, otherwise 1
        var wDirection = w > nw ? -1 : 1; //if old width is larger than new width then width multiplier is -1, otherwise 1

        //calculate difference between two values
        var difference = function (a, b) {
            return Math.abs(a - b) //always return a positive number
        };


        var xDistance = difference(x, nx); //difference between start x coordinate and end x coordinate
        var yDistance = difference(y, ny); //difference between start y coordinate and end y coordinate

        var heightDifference = difference(w, nw); //difference between start width and end width
        var widthDifference = difference(h, nh); //difference between start height and end height

        var stepMultiplier = iMenuModel.getTickerStatus() === "on" ? 2 : 1;

        //Declare the step variables for moving and resizing the target
        var xStep, yStep, wStep, hStep;

        //Calculate how many pixels the target moves and resizes by on each loop
        if (xDistance > yDistance) {

            yDistance === 0 ? xStep = 40 * stepMultiplier : xStep = ((xDistance / yDistance) * 20) * stepMultiplier;
            yStep = yDistance / Math.ceil(xDistance / xStep);

            hStep = widthDifference / Math.ceil((xDistance === 0 ? 1 : xDistance) / xStep);
            wStep = heightDifference / Math.ceil((xDistance === 0 ? 1 : xDistance) / xStep);

        } else {

            xDistance === 0 ? yStep = 40 * stepMultiplier : yStep = ((yDistance / xDistance) * 20) * stepMultiplier;
            xStep = xDistance / Math.ceil(yDistance / yStep);

            wStep = heightDifference / Math.ceil((yDistance === 0 ? 1 : yDistance) / yStep);
            hStep = widthDifference / Math.ceil((yDistance === 0 ? 1 : yDistance) / yStep);

        }


        //Store the target screen object
        var slidingDiv = document.getElementById("target");
        var count = 0;
        var stepper = setInterval(function () {

                var xDiff = Math.abs(nx - x); //distance left on x axis
                var yDiff = Math.abs(ny - y); //distance left on y axis
                var wDiff = Math.abs(nw - w); //width difference
                var hDiff = Math.abs(nh - h); //height difference

                //update the x coordinate of the target box
                if (x != nx) {
                    if (xDiff < xStep) {
                        x = x + xDiff * (Number(xDirection));
                    } else {
                        x = x + xStep * (Number(xDirection));
                    }
                }

                //update the y coordinate of the target box
                if (y != ny) {
                    if (yDiff < yStep) {
                        y = y + yDiff * (Number(yDirection));
                    } else {
                        y = y + yStep * (Number(yDirection));
                    }
                }

                //update the width of the target box
                if (w != nw) {
                    if (wDiff < wStep) {
                        w = w + wDiff * (Number(wDirection));
                    } else {
                        w = w + wStep * (Number(wDirection));
                    }
                }

                //update the height of the target box
                if (h != nh) {
                    if (hDiff < hStep) {
                        h = h + hDiff * (Number(hDirection));
                    } else {
                        h = h + hStep * (Number(hDirection));
                    }
                }

                //Apply the target box position and size
                slidingDiv.style.left = x + "px";
                slidingDiv.style.top = y + "px";
                slidingDiv.style.height = h + "px";
                slidingDiv.style.width = w + "px";

                count++;

                if (x == nx && y == ny && w == nw && h == nh) {
                    clearInterval(stepper);
                    sportsAppModel.setKeyPressEnabled(true);
                }
            },
            20);

    }


    self.videoMenuController = function () {

        oIndex = videoMenuModel.getOindex(); //added NDC 15/03/2016
        index = videoMenuModel.getVideoMenuIndex(); //added NDC 15/03/2016

        var direction,
            channelManager = new ChannelManager(),
            videoMenuConfig = videoMenuModel.getVideoMenuConfig();

        if (sportsAppModel.getKeyPressEnabled()) {
            var hrefProcessor = new Href();

            var debug = document.getElementById("debugArea");
            debug.innerHTML = "";

            clearTimeout(videoMenuTimer);

            switch (event.keyCode) {

            case 89: //Y instead of yellow for now
                /*  I have set up this variable
                    as 'self' so that I can get around a problem
                    with timeouts because otherwise it gets assigned to 
                    the window object and does wierd things while clearing and
                    restarting over and over again.
                */
                self.audioTextTimer; //timer for audio text display
                //self.audioTextMasterTimer; //timer for master audio text display
                //If multiple audio streams are available
                if (videoMenuModel.getMultiAudioFlag()) {
                    var audioText = document.getElementById("audioText");

                    //does the audioText element exist? If not, create one
                    if (!audioText) {
                        audioText = document.createElement("div");
                        audioText.setAttribute("id", "audioText");
                        var OSD = document.getElementById("OSD");
                        OSD.appendChild(audioText);
                    }
                    //toggle the audio
                    if (videoMenuModel.getMultiAudioToggle() === 0) {
                        console.log("Audio Tune to: " + videoMenuConfig.ma[0].aid);
                        channelManager.audioTune(videoMenuConfig.ma[0].aid, self.audCallBack()); //F1 Multi Audio index is 0
                        videoMenuModel.setMultiAudioToggle(1); //set the toggle value
                        audioText.innerHTML = "AUDIO: " + videoMenuConfig.ma[0].lab;
                        audioText.style.visibility = "visible";
                        clearTimeout(self.audioTextTimer);
                        self.audioTextTimer = setTimeout(function () {
                            audioText.style.visibility = "hidden";
                        }, 3000);

                    } else {
                        console.log("Audio Tune to: " + videoMenuModel.getCurrMenuAudio());
                        channelManager.audioTune(videoMenuModel.getCurrMenuAudio(), self.audCallBack()); //Set to the main menu audio
                        videoMenuModel.setMultiAudioToggle(0); //set the toggle value

                        audioText.innerHTML = "AUDIO: MASTER";
                        audioText.style.visibility = "visible";
                        clearTimeout(self.audioTextTimer);
                        self.audioTextTimer = setTimeout(function () {
                            audioText.style.visibility = "hidden";
                        }, 3000);
                    }
                }

                break;

            case 405: //YELLOW BUTTON AUDIO TOGGLE
                //If multiple audio streams are available
                if (videoMenuModel.getMultiAudioFlag()) {
                    //toggle the audio
                    if (videoMenuModel.getMultiAudioToggle() === 0) {
                        console.log("Audio Tune to: " + videoMenuConfig.ma[0].aid);
                        channelManager.audioTune(videoMenuConfig.ma[0].aid, self.audCallBack()); //F1 Multi Audio index is 0
                        videoMenuModel.setMultiAudioToggle(1); //set the toggle value
                    } else {
                        console.log("Audio Tune to: " + videoMenuModel.getCurrMenuAudio());
                        channelManager.audioTune(videoMenuModel.getCurrMenuAudio(), self.audCallBack()); //Set to the main menu audio
                        videoMenuModel.setMultiAudioToggle(0); //set the toggle value
                    }
                }

                break;
            case 38:
                if (sportsAppModel.getCurrentFocus() !== "fullscreen") {
                    sportsAppModel.setKeyPressEnabled(false);
                    direction = "UP";
                    newIndex = videoMenuModel.getVideoMenuOptionNav(index, oIndex, direction);
                    //debug.innerHTML = "Video Href: " + videoMenuConfig.videoMenu[index].matrix.option[newIndex].href + " MA: " + videoMenuConfig.videoMenu[index].matrix.option[newIndex].menuAudio;
                    targetMove(index, newIndex, oIndex);
                    videoMenuModel.setOindex(newIndex);
                    videoMenuTimer = setTimeout(function () {
                        channelManager.audioTune(Number(videoMenuConfig.videoMenu[index].matrix.option[newIndex].menuAudio), self.audCallBack());
                    }, 1000);
                }
                break;
            case 40:
                if (sportsAppModel.getCurrentFocus() !== "fullscreen") {
                    sportsAppModel.setKeyPressEnabled(false);
                    direction = "DOWN";
                    newIndex = videoMenuModel.getVideoMenuOptionNav(index, oIndex, direction);
                    //debug.innerHTML = "Video Href: " + videoMenuConfig.videoMenu[index].matrix.option[newIndex].href + " MA: " + videoMenuConfig.videoMenu[index].matrix.option[newIndex].menuAudio;
                    targetMove(index, newIndex, oIndex);
                    //oIndex = newIndex;
                    videoMenuModel.setOindex(newIndex);
                    videoMenuTimer = setTimeout(function () {
                        channelManager.audioTune(Number(videoMenuConfig.videoMenu[index].matrix.option[newIndex].menuAudio), self.audCallBack());
                    }, 1000);
                }
                break;
            case 39:
                if (sportsAppModel.getCurrentFocus() !== "fullscreen") {

                    sportsAppModel.setKeyPressEnabled(false);
                    direction = "RIGHT";
                    newIndex = videoMenuModel.getVideoMenuOptionNav(index, oIndex, direction);
                    //debug.innerHTML = "Video Href: " + videoMenuConfig.videoMenu[index].matrix.option[newIndex].href + " MA: " + videoMenuConfig.videoMenu[index].matrix.option[newIndex].menuAudio;
                    targetMove(index, newIndex, oIndex);
                    //oIndex = newIndex;
                    videoMenuModel.setOindex(newIndex);
                    videoMenuTimer = setTimeout(function () {
                        channelManager.audioTune(Number(videoMenuConfig.videoMenu[index].matrix.option[newIndex].menuAudio), self.audCallBack());
                    }, 1000);
                }
                break;
            case 37:
                if (sportsAppModel.getCurrentFocus() !== "fullscreen") {

                    sportsAppModel.setKeyPressEnabled(false);
                    direction = "LEFT";
                    newIndex = videoMenuModel.getVideoMenuOptionNav(index, oIndex, direction);
                    //debug.innerHTML = "Video Href: " + videoMenuConfig.videoMenu[index].matrix.option[newIndex].href + " MA: " + videoMenuConfig.videoMenu[index].matrix.option[newIndex].menuAudio;
                    targetMove(index, newIndex, oIndex);
                    //oIndex = newIndex;
                    videoMenuModel.setOindex(newIndex);
                    videoMenuTimer = setTimeout(function () {
                        channelManager.audioTune(Number(videoMenuConfig.videoMenu[index].matrix.option[oIndex].menuAudio), self.audCallBack());
                    }, 1000);
                }
                break;
            case 13:
                //enter-return key
                //Check to see if the video selection contains multi-audio
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[oIndex].href);
                break;
            case 49:
                //1
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                videoMenuModel.setOindex(0);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[0].href);
                break;
            case 50:
                //2
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                videoMenuModel.setOindex(1);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[1].href);
                break;
            case 51:
                //3
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                videoMenuModel.setOindex(2);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[2].href);
                break;
            case 52:
                //4
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                videoMenuModel.setOindex(3);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[3].href);
                break;
            case 53:
                //5
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                videoMenuModel.setOindex(4);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[4].href);
                break;
            case 54:
                //6
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                videoMenuModel.setOindex(5);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[5].href);
                break;
            case 55:
                //7
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                videoMenuModel.setOindex(6);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[6].href);
                break;
            case 56:
                //8
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                videoMenuModel.setOindex(7);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[7].href);
                break;
            case 57:
                //9
                videoMenuConfig.videoMenu[index].matrix.option[oIndex].ma === "true" ? videoMenuModel.setMultiAudioFlag(true) : videoMenuModel.setMultiAudioFlag(false);
                videoMenuModel.setOindex(8);
                hrefProcessor.hrefHandler(videoMenuConfig.videoMenu[index].matrix.option[8].href);
                break;
            case 66:
                //backup
                console.log("You have pressed BACKUP");
                var av = new Av();
                var chanID = channelManagerModel.getChannelID();
                if (iMenuModel.getImenuStatus()) {
                    var imenu = new Imenu();
                    imenu.hideMessageStrap();
                }
                var debug = document.getElementById("debugArea");
                debug.innerHTML = debug.innerHTML + "channel ID: " + chanID + "    vchanId: " + av.videoStreams[chanID];

                sportsAppModel.getCurrentFocus() === "fullscreen" ? self.init(0) : function () {
                    console.log("Is the video menu index > 0?");
                    if (videoMenuModel.getVideoMenuIndex() > 0) {
                        console.log("Video Menu Index: " + videoMenuModel.getVideoMenuIndex());
                        videoMenuModel.setOindex(0);
                        self.init(0);
                    } else {
                        console.log("Video Menu Index: " + videoMenuModel.getVideoMenuIndex());
                        console.log("Show the splash because we are about exit the application");
                        splashLoader.show();
                        //vmDtvLib.chanMan.exitToTv(av.videoStreams[chanID]);
                        console.log("Calling tivo.core.exit();");
                        //vmDtvLib.chanMan.exitToTv(); //added by Neil Cooper 04/04/2016 so that application just exits to the current channel.
                        tivo.core.exit();
                    }
                }();
                av = null;
                break;
            case 27:
                //backup
                console.log("You have pressed BACKUP");
                var av = new Av();
                var chanID = channelManagerModel.getChannelID();
                if (iMenuModel.getImenuStatus()) {
                    var imenu = new Imenu();
                    imenu.hideMessageStrap();
                }
                var debug = document.getElementById("debugArea");
                debug.innerHTML = debug.innerHTML + "channel ID: " + chanID + "    vchanId: " + av.videoStreams[chanID];

                sportsAppModel.getCurrentFocus() === "fullscreen" ? self.init(0) : function () {
                    console.log("Is the video menu index > 0?");
                    if (videoMenuModel.getVideoMenuIndex() > 0) {
                        console.log("Video Menu Index: " + videoMenuModel.getVideoMenuIndex());
                        videoMenuModel.setOindex(0);
                        self.init(0);
                    } else {
                        console.log("Video Menu Index: " + videoMenuModel.getVideoMenuIndex());
                        console.log("Show the splash because we are about exit the application");
                        splashLoader.show();
                        //vmDtvLib.chanMan.exitToTv(av.videoStreams[chanID]);
                        console.log("Calling tivo.core.exit();");
                        //vmDtvLib.chanMan.exitToTv(); //added by Neil Cooper 04/04/2016 so that application just exits to the current channel.
                        tivo.core.exit();
                    }
                }();
                av = null;
                break;
            default:
                break;
            }
        }
    };

    //Full Screen Video Option config
    self.fullScreen = function (encoder, audio) {
        console.log("Fullscreen");
        self.hideTarget(); //Hide the target box
        console.log("IMENU STATUS IN FULLSCREEN: " + iMenuModel.getImenuStatus());
        var iMenu = new Imenu();
        if (iMenuModel.getImenuStatus()) {
            console.log("IMENU SHOW AUDIO " + videoMenuModel.getMultiAudioFlag());
            if (videoMenuModel.getMultiAudioFlag()) {
                iMenu.showAudioIcon();
                iMenu.showMessageStrap(PRESS_LEFT_RIGHT_AUDIO_MESSAGE, 5000, false);
            } else {
                iMenu.showMessageStrap(BACKUP_TO_EXIT_VM_MESSAGE, 5000, true);
            }
        } else {
            iMenu.showMessageStrap(BACKUP_TO_EXIT_VM_MESSAGE, 5000, false);
        }
        sportsAppModel.setCurrentFocus("fullscreen");
        channelManagerModel.setCurrentChannel(encoder);
        channelManagerModel.setCurrentAudio(audio);
        channelManager.channelTune(encoder, self.vidCallBack);
        iMenu = null;
    };

    self.vidCallBack = function () {
        console.log("calling hide loading animation");
        hideLoadingAnim();
        var debug = document.getElementById("debugArea");
        debug.innerHTML = debug.innerHTML + "VIDEO TUNED ";
        //now tune the audio
        channelManager.audioTune(Number(channelManagerModel.getCurrentAudio()), self.audCallBack);
        splashLoader.hide(); //hide the splash screen (Hopefully everything is ready by now!

    };

    self.audCallBack = function () {
        var debug = document.getElementById("debugArea");
        //debug.innerHTML = debug.innerHTML + "AUDIO TUNED ";
        debug.innerHTML += "  ... TUNED";
    }

    //initialise video menu[i]
    self.init = function (i) {
        var debug = document.getElementById("debugArea");
        debug.innerHTML = "INIT";
        if ((i !== NaN) && (i !== undefined)) {
            index = i;
        } else {
            index = 0;
        }
        videoMenuModel.setVideoMenuIndex(index);
        oIndex = videoMenuModel.getOindex();
        //oIndex = 0;

        var videoMenuConfig = videoMenuModel.getVideoMenuConfig();

        /*
         * Initial Tune
         */

        var vidBroadcast = document.getElementById("vidBroadcast");
        vidBroadcast.style.visibility = "visible";

        //Retrieve the intial video to tune to 
        var videoChan = videoMenuConfig.videoMenu[index].matrix.video;
        var audioChan = videoMenuConfig.videoMenu[index].matrix.option[oIndex].menuAudio; //The audio for the initial target option in the video menu
        channelManagerModel.setCurrentChannel(videoChan);
        channelManagerModel.setCurrentAudio(audioChan);

        //Tune to video channel 'videoChan'
        var debug = document.getElementById("debugArea");
        channelManager.channelTune(videoChan, self.vidCallBack);

        var borderColor = "#" + (videoMenuConfig.videoMenu[index].matrix.rgb).slice(2, 8);
        var targetBox = document.getElementById('target');
        var OSD = document.getElementById('OSD');

        //If there is no target box, create one
        if (!targetBox) {
            targetBox = document.createElement("div");
            targetBox.setAttribute("id", "target");
            targetBox.style.zIndex = "1"; //layer Z-index 1
            OSD.appendChild(targetBox); //append the target box to the OSD layer
        }

        if (iMenuModel.getImenuStatus()) {
            var iMenu = new Imenu();
            iMenu.hideAudioIcon();
            iMenu = null;
            console.log("SET AUDIO FLAG TO FALSE");
            videoMenuModel.setMultiAudioFlag(false);
            videoMenuModel.setCurrMultiAudio(0);
        }

        var x = videoMenuConfig.videoMenu[index].matrix.option[oIndex].x,
            y = videoMenuConfig.videoMenu[index].matrix.option[oIndex].y,
            w = (videoMenuConfig.videoMenu[index].matrix.option[oIndex].w - TARGETBOXOFFSET),
            h = (videoMenuConfig.videoMenu[index].matrix.option[oIndex].h - TARGETBOXOFFSET);

        self.showTarget(x, y, w, h, borderColor);

        //set the key focus to videoMenu so that button control
        console.log("Setting the current focus to videoMenu");
        sportsAppModel.setCurrentFocus("videoMenu");
        console.log("INIT current Focus: " + sportsAppModel.getCurrentFocus());
    }
}


var StatsMenu = function () {

    var self = this,
        STATSMENU_URL = "stats/sections.json",
        randNum = new RandomURLNum(); // new random number gen object

    self.buildMenu = function (tab) {

        var OSD = document.getElementById("OSD"),
            statsMenuContainer = document.getElementById("statsMenuContainer"),
            statsContainer = document.createElement("div"),
            statsHeader = document.createElement("div"),
            statsFooter = document.createElement("div"),
            statsHeader_Text = document.createElement("div"),
            statsHeader_Title = document.createElement("div"),
            statsHeader_Title_LeftArrow = document.createElement("div"),
            statsHeader_Title_RightArrow = document.createElement("div"),
            statsHeader_Title_Text = document.createElement("div"),
            statsFooter_Text = document.createElement("div"),
            menuConfig = statsMenuModel.getStatsMenuConfig(tab),
            HEADER_TEXT = "PRESS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TO CLOSE",
            FOOTER_TEXT = "SKY RACE CONTROL";

        //reset the current list item
        statsMenuModel.setItemIndex(0);
        statsMenuModel.setCurrentStatsMenu(tab);

        //get the relevant stats data for the tab
        var statsMenuData = statsMenuModel.getStatsMenuData(tab);
        console.log("TAB: " + tab);
        console.log("STATS MENU DATA TO BUILD : " + statsMenuData);

        /*
         * If the stats menu container doesn't exist, create it.
         * If the stats menu container does exist, clear and rebuild
         */
        if (!statsMenuContainer) {
            statsMenuContainer = document.createElement("div");
            statsMenuContainer.id = "statsMenuContainer";
            statsMenuContainer.className = "closed";
        } else {
            while (statsMenuContainer.firstChild) {
                statsMenuContainer.removeChild(statsMenuContainer.firstChild);
            }
        }

        statsHeader.id = "statsHeader";
        statsHeader_Text.id = "statsHeader_Text";
        statsHeader_Text.innerHTML = HEADER_TEXT;
        statsHeader.appendChild(statsHeader_Text);
        statsHeader_Title.id = "statsHeader_Title";
        statsHeader_Title_Text.id = "statsHeader_Title_Text";
        statsHeader_Title_Text.appendChild(document.createTextNode(menuConfig.name));
        statsHeader_Title.appendChild(statsHeader_Title_Text);
        statsHeader.appendChild(statsHeader_Title);
        statsMenuContainer.appendChild(statsHeader);
        statsContainer.id = "statsContainer";
        statsMenuContainer.appendChild(statsContainer);
        statsFooter.id = "statsFooter";
        statsFooter_Text.id = "statsFooter_Text";
        statsFooter_Text.appendChild(document.createTextNode(FOOTER_TEXT));
        statsFooter.appendChild(statsFooter_Text);
        statsMenuContainer.appendChild(statsFooter);
        OSD.appendChild(statsMenuContainer);

        populateStatsArea(tab);
    }


    var populateStatsArea = function (tab) {

        var statsMenuContainer = document.getElementById("statsMenuContainer"),
            statsContainer = document.getElementById("statsContainer"),
            extraTitle = document.getElementById("extraTitle"),
            menuData = statsMenuModel.getStatsMenuData(tab),
            optionSelected = statsMenuModel.getStatsOptionSelected();

        console.log("Menu Data: " + menuData);

        //store the name of the current menu
        statsMenuModel.setCurrentStatsMenu(tab);

        if (extraTitle) {
            extraTitle.parentNode.removeChild(extraTitle);
        }

        //clear the statsContainer
        while (statsContainer.firstChild) {
            statsContainer.removeChild(statsContainer.firstChild);
        }

        switch (tab) {

        case "TAB_MENU":
            // If there is help tab info in the data, we want to adjust for that because
            // as far as I know there is no data for it.
            var rowCount = 0;

            var ulElement = document.createElement("UL");
            //loop through the data and create a menu (or something that look similar)

            for (var i = 0; i < (menuData["sections"].length); i++) {

                var menuType = menuData["sections"][i]["type"];

                if (statsMenuModel.menuTypeAllowed(menuType)) {

                    var liElement = document.createElement("li");
                    liElement.className = (i === statsMenuModel.getItemIndex() ? "statsMainMenu listItem selected" : "statsMainMenu listItem");
                    liElement.appendChild(document.createTextNode(menuData["sections"][i]["name"]));
                    ulElement.appendChild(liElement);
                    rowCount++
                }
            }
            statsMenuModel.setNumOfListItems(rowCount);
            statsContainer.appendChild(ulElement);
            break;

        case "TAB_NEWS":

            if (!optionSelected) {
                var rowCount = 0;
                var ulElement = document.createElement("ul");
                //loop through the data and create a menu (or something that look similar)
                statsContainer.className = "";
                document.getElementById("statsHeader_Title").innerHTML = menuData["title"];
                for (var i = 0; i < (menuData["items"].length); i++) {
                    var liElement = document.createElement("li");
                    liElement.className = (i === statsMenuModel.getItemIndex() ? "statsNewsMenu listItem selected" : "statsNewsMenu listItem");
                    liElement.appendChild(document.createTextNode(menuData["items"][i]["shorttitle"]));
                    ulElement.appendChild(liElement);
                    rowCount++

                }
                statsMenuModel.setNumOfListItems(rowCount);
                statsContainer.appendChild(ulElement);
            } else {
                //Build the news story
                var newsTitle = document.getElementById("extraTitle"),
                    statsContainer = document.getElementById("statsContainer"),
                    statsHeaderText = document.getElementById("statsHeader_Text"),
                    statsHeaderTitle = document.getElementById("statsHeader_Title"),
                    menuIndex = statsMenuModel.getMenuIndex(),
                    currItem = statsMenuModel.getItemIndex();

                if (!newsTitle) {
                    newsTitle = document.createElement("div");
                    newsTitle.id = "extraTitle";
                    newsTitle.innerHTML = "NEWS";
                    insertAfter(statsHeaderText, newsTitle);
                }

                statsHeaderTitle.innerHTML = menuData["items"][currItem]["headline"];

                statsContainer.className = "statsScroller";
                statsContainer.innerHTML = n2br(menuData["items"][currItem]["body"]);

            }
            break;

        case "TAB_GRID":
            var statsHeader = document.getElementById("statsHeader"),
                gridTopRow = document.getElementById("gridTopRow"),
                posColumn, nameColumn, teamColumn,
                currItem = statsMenuModel.getItemIndex(),
                pageIndex = statsMenuModel.getPageIndex(),
                maximumNoOfRows = statsMenuModel.getMaxRows(),
                gridLength = menuData["grid"].length,
                startIndex = pageIndex * maximumNoOfRows,
                rowsLeft = gridLength - startIndex,
                rowsThisPage = (rowsLeft > maximumNoOfRows) ? maximumNoOfRows : rowsLeft;

            //console.log("NO OF PAGES: " + numOfPages);
            statsMenuModel.setNumberOfPages(Math.floor((gridLength + maximumNoOfRows - 1) / maximumNoOfRows));
            statsMenuModel.setNumOfListItems(gridLength, rowsThisPage);


            if (!gridTopRow) {
                gridTopRow = document.createElement("div");
                posColumn = document.createElement("div");
                nameColumn = document.createElement("div");
                teamColumn = document.createElement("div");
                gridTopRow.id = "gridTopRow";
                posColumn.className = "posColumn";
                nameColumn.className = "nameColumn";
                teamColumn.className = "teamColumn";

                nameColumn.innerHTML = "NAME";
                teamColumn.innerHTML = "TEAM";
                gridTopRow.appendChild(posColumn);
                gridTopRow.appendChild(nameColumn);
                gridTopRow.appendChild(teamColumn);

                insertAfter(statsHeader, gridTopRow);
            }
            var ulElement = document.createElement("ul");
            for (var i = 0; i < statsMenuModel.getNumOfListItems(); i++) {
                var liElement = document.createElement("li");
                liElement.className = "gridRow";
                posColumn = document.createElement("div");
                nameColumn = document.createElement("div");
                teamColumn = document.createElement("div");
                posColumn.className = "posColumn";
                nameColumn.className = "nameColumn";
                teamColumn.className = "teamColumn";
                posColumn.innerHTML = menuData["grid"][i + startIndex]["position"];
                nameColumn.innerHTML = menuData["grid"][i + startIndex]["name"];
                teamColumn.innerHTML = menuData["grid"][i + startIndex]["team"];
                liElement.appendChild(posColumn);
                liElement.appendChild(nameColumn);
                liElement.appendChild(teamColumn);
                statsContainer.appendChild(liElement);
            }
            break;

        case "TAB_QUALIFYING":
            console.log("TAB_QUALIFYING: optionSelected: " + optionSelected);
            if (!optionSelected) {
                var rowCount = 0,
                    ulElement = document.createElement("ul"),
                    qualiTopRow = document.getElementById("qualiTopRow");

                qualiTopRow && qualiTopRow.parentNode.removeChild(qualiTopRow);

                //loop through the data and create a menu (or something that look similar)
                document.getElementById("statsHeader_Title").innerHTML = menuData["title"];
                for (var i = 0; i < (menuData["menu"].length); i++) {
                    var liElement = document.createElement("li");
                    liElement.className = (i === statsMenuModel.getItemIndex() ? "statsQualifyingMenu listItem selected" : "statsQualifyingMenu listItem");
                    liElement.appendChild(document.createTextNode(menuData["menu"][i]["title"]));
                    ulElement.appendChild(liElement);
                    rowCount++

                }
                statsMenuModel.setNumOfListItems(rowCount);
                statsContainer.appendChild(ulElement);
            } else {
                //Build the Qualifying times list
                var qualiTitle = document.getElementById("extraTitle"),
                    statsContainer = document.getElementById("statsContainer"),
                    statsHeader = document.getElementById("statsHeader"),
                    statsHeaderText = document.getElementById("statsHeader_Text"),
                    statsHeaderTitle = document.getElementById("statsHeader_Title"),
                    menuIndex = statsMenuModel.getMenuIndex(),
                    currItem = statsMenuModel.getItemIndex(),
                    pageIndex = statsMenuModel.getPageIndex(),
                    qualiTopRow = document.getElementById("qualiTopRow"),
                    posColumn, nameColumn, teamColumn, timeColumn,
                    maximumNoOfRows = statsMenuModel.getMaxRows(),
                    timesLength = menuData["sessions"][currItem]["times"].length,
                    startIndex = pageIndex * maximumNoOfRows,
                    rowsLeft = timesLength - startIndex,
                    rowsThisPage = (rowsLeft > maximumNoOfRows) ? maximumNoOfRows : rowsLeft;

                if (!qualiTitle) {
                    qualiTitle = document.createElement("div");
                    qualiTitle.id = "extraTitle";
                    qualiTitle.innerHTML = menuData["title"];
                    insertAfter(statsHeaderText, qualiTitle);
                }

                console.log("+++CurrItem: " + currItem);

                statsHeaderTitle.innerHTML = menuData["menu"][currItem]["title"];

                //console.log("NO OF PAGES: " + numOfPages);
                statsMenuModel.setNumberOfPages(Math.floor((timesLength + maximumNoOfRows - 1) / maximumNoOfRows));
                statsMenuModel.setNumOfListItems(timesLength, rowsThisPage);


                if (!qualiTopRow) {
                    qualiTopRow = document.createElement("div");
                    posColumn = document.createElement("div");
                    nameColumn = document.createElement("div");
                    teamColumn = document.createElement("div");
                    timeColumn = document.createElement("div");
                    qualiTopRow.id = "qualiTopRow";
                    posColumn.className = "posColumn";
                    nameColumn.className = "nameColumn";
                    teamColumn.className = "teamColumn";
                    timeColumn.className = "timeColumn";

                    nameColumn.innerHTML = "NAME";
                    teamColumn.innerHTML = "TEAM";
                    timeColumn.innerHTML = "TIME";
                    qualiTopRow.appendChild(posColumn);
                    qualiTopRow.appendChild(nameColumn);
                    qualiTopRow.appendChild(teamColumn);
                    qualiTopRow.appendChild(timeColumn);

                    insertAfter(statsHeader, qualiTopRow);
                }
                var ulElement = document.createElement("ul");
                for (var i = 0; i < statsMenuModel.getNumOfListItems(); i++) {
                    var liElement = document.createElement("li");
                    liElement.className = "qualiRow";
                    posColumn = document.createElement("div");
                    nameColumn = document.createElement("div");
                    teamColumn = document.createElement("div");
                    timeColumn = document.createElement("div");
                    posColumn.className = "posColumn";
                    nameColumn.className = "nameColumn";
                    teamColumn.className = "teamColumn";
                    timeColumn.className = "timeColumn";
                    posColumn.innerHTML = menuData["sessions"][currItem]["times"][i + startIndex]["pos"];
                    nameColumn.innerHTML = menuData["sessions"][currItem]["times"][i + startIndex]["name"];
                    teamColumn.innerHTML = menuData["sessions"][currItem]["times"][i + startIndex]["team"];
                    timeColumn.innerHTML = menuData["sessions"][currItem]["times"][i + startIndex]["time"];
                    liElement.appendChild(posColumn);
                    liElement.appendChild(nameColumn);
                    liElement.appendChild(teamColumn);
                    liElement.appendChild(timeColumn);
                    statsContainer.appendChild(liElement);
                    if (menuData["sessions"][currItem]["dz"] == i + 1 + startIndex) {
                        liElement.style.borderBottom = "medium solid #fff"
                    }

                }


            }
            break;

        case "TAB_PRACTICE":
            console.log("TAB_PRACTICE optionSelected: " + optionSelected);
            if (!optionSelected) {
                var rowCount = 0,
                    ulElement = document.createElement("ul"),
                    practiceTopRow = document.getElementById("practiceTopRow");
                //loop through the data and create a menu (or something that look similar)

                if (practiceTopRow) {
                    practiceTopRow.parentNode.removeChild(practiceTopRow);
                }

                document.getElementById("statsHeader_Title").innerHTML = menuData["title"];

                for (var i = 0; i < (menuData["menu"].length); i++) {
                    var liElement = document.createElement("li");
                    liElement.className = (i === statsMenuModel.getItemIndex() ? "statsPracticeMenu listItem selected" : "statsPracticeMenu listItem");
                    liElement.appendChild(document.createTextNode(menuData["menu"][i]["title"]));
                    ulElement.appendChild(liElement);
                    rowCount++

                }
                statsMenuModel.setNumOfListItems(rowCount);
                statsContainer.appendChild(ulElement);
            } else {
                //Build the Practice times list
                var practiceTitle = document.getElementById("extraTitle"),
                    statsContainer = document.getElementById("statsContainer"),
                    statsHeader = document.getElementById("statsHeader"),
                    statsHeaderText = document.getElementById("statsHeader_Text"),
                    statsHeaderTitle = document.getElementById("statsHeader_Title"),
                    menuIndex = statsMenuModel.getMenuIndex(),
                    currItem = statsMenuModel.getItemIndex(),
                    pageIndex = statsMenuModel.getPageIndex(),
                    practiceTopRow = document.getElementById("practiceTopRow"),
                    posColumn, nameColumn, lapsColumn, timeColumn,
                    maximumNoOfRows = statsMenuModel.getMaxRows(),
                    timesLength = menuData["sessions"][currItem]["times"].length,
                    startIndex = pageIndex * maximumNoOfRows,
                    rowsLeft = timesLength - startIndex,
                    rowsThisPage = (rowsLeft > maximumNoOfRows) ? maximumNoOfRows : rowsLeft;

                if (!practiceTitle) {
                    practiceTitle = document.createElement("div");
                    practiceTitle.id = "extraTitle";
                    practiceTitle.innerHTML = menuData["title"];
                    insertAfter(statsHeaderText, practiceTitle);
                }

                statsHeaderTitle.innerHTML = menuData["menu"][currItem]["title"];

                //console.log("NO OF PAGES: " + numOfPages);
                statsMenuModel.setNumberOfPages(Math.floor((timesLength + maximumNoOfRows - 1) / maximumNoOfRows));
                statsMenuModel.setNumOfListItems(timesLength, rowsThisPage);


                if (!practiceTopRow) {
                    practiceTopRow = document.createElement("div");
                    posColumn = document.createElement("div");
                    nameColumn = document.createElement("div");
                    timeColumn = document.createElement("div");
                    lapsColumn = document.createElement("div");
                    practiceTopRow.id = "practiceTopRow";
                    posColumn.className = "posColumn";
                    nameColumn.className = "nameColumn";
                    timeColumn.className = "timeColumn";
                    lapsColumn.className = "lapsColumn";

                    nameColumn.innerHTML = "NAME";
                    timeColumn.innerHTML = "TIME";
                    lapsColumn.innerHTML = "LAPS";
                    practiceTopRow.appendChild(posColumn);
                    practiceTopRow.appendChild(nameColumn);
                    practiceTopRow.appendChild(timeColumn);
                    practiceTopRow.appendChild(lapsColumn);

                    insertAfter(statsHeader, practiceTopRow);
                }
                var ulElement = document.createElement("ul");
                for (var i = 0; i < statsMenuModel.getNumOfListItems(); i++) {
                    var liElement = document.createElement("li");
                    liElement.className = "practiceRow";
                    posColumn = document.createElement("div");
                    nameColumn = document.createElement("div");
                    timeColumn = document.createElement("div");
                    lapsColumn = document.createElement("div");
                    posColumn.className = "posColumn";
                    nameColumn.className = "nameColumn";
                    timeColumn.className = "timeColumn";
                    lapsColumn.className = "lapsColumn";
                    posColumn.innerHTML = menuData["sessions"][currItem]["times"][i + startIndex]["pos"];
                    nameColumn.innerHTML = menuData["sessions"][currItem]["times"][i + startIndex]["name"];
                    timeColumn.innerHTML = menuData["sessions"][currItem]["times"][i + startIndex]["time"];
                    lapsColumn.innerHTML = menuData["sessions"][currItem]["times"][i + startIndex]["laps"];
                    liElement.appendChild(posColumn);
                    liElement.appendChild(nameColumn);
                    liElement.appendChild(timeColumn);
                    liElement.appendChild(lapsColumn);
                    statsContainer.appendChild(liElement);
                }


            }
            break;

        case "TAB_DRIVERSTANDINGS":
            var statsHeader = document.getElementById("statsHeader"),
                standingsTopRow = document.getElementById("standingsTopRow"),
                rankColumn, nameColumn, teamColumn, pointsColumn,
                currItem = statsMenuModel.getItemIndex(),
                maximumNoOfRows = statsMenuModel.getMaxRows(),
                pageIndex = statsMenuModel.getPageIndex(),
                standingsLength = menuData["ds"].length,
                startIndex = pageIndex * maximumNoOfRows,
                rowsLeft = standingsLength - startIndex,
                rowsThisPage = (rowsLeft > maximumNoOfRows) ? maximumNoOfRows : rowsLeft;

            statsMenuModel.setNumberOfPages(Math.floor((standingsLength + maximumNoOfRows - 1) / maximumNoOfRows));
            statsMenuModel.setNumOfListItems(standingsLength, rowsThisPage);

            console.log("-----> STANDINGS LENGTH: " + standingsLength);
            if (!standingsTopRow) {
                standingsTopRow = document.createElement("div");
                rankColumn = document.createElement("div");
                nameColumn = document.createElement("div");
                teamColumn = document.createElement("div");
                pointsColumn = document.createElement("div");
                standingsTopRow.id = "standingsTopRow";
                rankColumn.className = "rankColumn";
                nameColumn.className = "nameColumn";
                teamColumn.className = "teamColumn";
                pointsColumn.className = "pointsColumn";

                nameColumn.innerHTML = "NAME";
                teamColumn.innerHTML = "TEAM";
                pointsColumn.innerHTML = "PTS";
                standingsTopRow.appendChild(rankColumn);
                standingsTopRow.appendChild(nameColumn);
                standingsTopRow.appendChild(teamColumn);
                standingsTopRow.appendChild(pointsColumn);

                insertAfter(statsHeader, standingsTopRow);
            }
            var ulElement = document.createElement("ul");
            for (var i = 0; i < statsMenuModel.getNumOfListItems(); i++) {
                var liElement = document.createElement("li");
                liElement.className = "standingsRow";
                rankColumn = document.createElement("div");
                nameColumn = document.createElement("div");
                teamColumn = document.createElement("div");
                pointsColumn = document.createElement("div");
                rankColumn.className = "rankColumn";
                nameColumn.className = "nameColumn";
                teamColumn.className = "teamColumn";
                pointsColumn.className = "pointsColumn";
                rankColumn.innerHTML = menuData["ds"][i + startIndex]["rank"];
                nameColumn.innerHTML = menuData["ds"][i + startIndex]["name"];
                teamColumn.innerHTML = menuData["ds"][i + startIndex]["team"];
                pointsColumn.innerHTML = menuData["ds"][i + startIndex]["pts"];
                liElement.appendChild(rankColumn);
                liElement.appendChild(nameColumn);
                liElement.appendChild(teamColumn);
                liElement.appendChild(pointsColumn);
                statsContainer.appendChild(liElement);
            }
            break;
        case "TAB_CONSTRUCTORSTANDINGS":
            var statsHeader = document.getElementById("statsHeader"),
                standingsTopRow = document.getElementById("standingsTopRow"),
                rankColumn, teamColumn, pointsColumn,
                currItem = statsMenuModel.getItemIndex(),
                pageIndex = statsMenuModel.getPageIndex(),
                maximumNoOfRows = statsMenuModel.getMaxRows(),
                standingsLength = menuData["cs"].length,
                startIndex = pageIndex * maximumNoOfRows,
                rowsLeft = standingsLength - startIndex,
                rowsThisPage = (rowsLeft > maximumNoOfRows) ? maximumNoOfRows : rowsLeft;

            statsMenuModel.setNumberOfPages(Math.floor((standingsLength + maximumNoOfRows - 1) / maximumNoOfRows));
            statsMenuModel.setNumOfListItems(standingsLength, rowsThisPage);

            if (!standingsTopRow) {
                standingsTopRow = document.createElement("div");
                rankColumn = document.createElement("div");
                teamColumn = document.createElement("div");
                pointsColumn = document.createElement("div");
                standingsTopRow.id = "standingsTopRow";
                rankColumn.className = "rankColumn";
                teamColumn.className = "constructorsTeamColumn";
                pointsColumn.className = "pointsColumn";

                teamColumn.innerHTML = "TEAM";
                pointsColumn.innerHTML = "PTS";
                standingsTopRow.appendChild(rankColumn);
                standingsTopRow.appendChild(teamColumn);
                standingsTopRow.appendChild(pointsColumn);

                insertAfter(statsHeader, standingsTopRow);
            }
            var ulElement = document.createElement("ul");
            for (var i = 0; i < statsMenuModel.getNumOfListItems(); i++) {
                var liElement = document.createElement("li");
                liElement.className = "standingsRow";
                rankColumn = document.createElement("div");
                teamColumn = document.createElement("div");
                pointsColumn = document.createElement("div");
                rankColumn.className = "rankColumn";
                teamColumn.className = "constructorsTeamColumn";
                pointsColumn.className = "pointsColumn";
                rankColumn.innerHTML = menuData["cs"][i + startIndex]["rank"];
                teamColumn.innerHTML = menuData["cs"][i + startIndex]["team"];
                pointsColumn.innerHTML = menuData["cs"][i + startIndex]["pts"];
                liElement.appendChild(rankColumn);
                liElement.appendChild(teamColumn);
                liElement.appendChild(pointsColumn);
                statsContainer.appendChild(liElement);
            }
            break;

        }
        return;
    }

    //statsMenuController is where the remote control button presses are detected
    self.statsMenuController = function (keyCode) {
        var currentStatsMenuName = statsMenuModel.getCurrentStatsMenu(),
            statsMenuData = statsMenuModel.getStatsMenuData(currentStatsMenuName),
            currItem = statsMenuModel.getItemIndex(),
            pageIndex = statsMenuModel.getPageIndex(),
            optionSelected = statsMenuModel.getStatsOptionSelected(),
            numOfListItems = statsMenuModel.getNumOfListItems() - 1;

        if (sportsAppModel.getKeyPressEnabled()) {

            switch (keyCode) {

            case 38:
                //up
                console.log("UP PRESSED " + currentStatsMenuName);
                //sportsApp.keyPressEnabled = false; //disable key presses
                if (!optionSelected) {
                    if (currentStatsMenuName === "TAB_MENU" || currentStatsMenuName === "TAB_NEWS" || currentStatsMenuName === "TAB_QUALIFYING" || currentStatsMenuName === "TAB_PRACTICE") {
                        if (currItem > 0) {
                            currItem--; //decrement the current item index to match the one above
                            console.log("CURRITEM: " + currItem + "   numOfListItems: " + numOfListItems);
                            statsMenuModel.setItemIndex(currItem); //Set the item index to the new value
                            //statsMenuModel.setMenuIndex(currItem); //Set the index for the current menu
                            var listItem = document.querySelectorAll('.listItem'); //get all the html objects with .listItem class
                            listItem[currItem + 1].classList.remove('selected'); //remove the 'selected' class from the old selected item
                            listItem[currItem].classList.add('selected'); //add the 'selected' class to the new selected item
                        }
                    } else if (currentStatsMenuName === "TAB_GRID" || currentStatsMenuName === "TAB_DRIVERSTANDINGS" || currentStatsMenuName === "TAB_CONSTRUCTORSTANDINGS") {
                        console.log("GRID MENU UP");
                        if (pageIndex > 0) {
                            pageIndex--;
                            console.log("CURRITEM: " + currItem + "   numOfListItems: " + numOfListItems);
                            statsMenuModel.setPageIndex(pageIndex);
                            populateStatsArea(currentStatsMenuName);
                        }
                    }
                } else {
                    if (currentStatsMenuName === "TAB_NEWS") {
                        var scrollArea = document.getElementById("statsContainer");
                        //scroll the text area by 50 pixels
                        scrollArea.scrollTop -= 50;
                        //check to see if arrow icons require displaying
                        break;
                    } else if (currentStatsMenuName === "TAB_QUALIFYING" || currentStatsMenuName === "TAB_PRACTICE") {
                        if (pageIndex > 0) {
                            pageIndex--;
                            console.log("CURRITEM: " + currItem + "   numOfListItems: " + numOfListItems);
                            statsMenuModel.setPageIndex(pageIndex);
                            populateStatsArea(currentStatsMenuName);
                        }
                    }
                }
                break;
            case 40:
                //down
                console.log("DOWN PRESSED " + currentStatsMenuName);
                if (!optionSelected) {
                    if (currentStatsMenuName === "TAB_MENU" || currentStatsMenuName === "TAB_NEWS" || currentStatsMenuName === "TAB_QUALIFYING" || currentStatsMenuName === "TAB_PRACTICE") {
                        if (currItem < numOfListItems) {
                            currItem++; //increment the current item index to match the one below
                            statsMenuModel.setItemIndex(currItem); //Set the item index to the new value
                            //statsMenuModel.setMenuIndex(currItem); //Set the index for the current menu
                            var listItem = document.querySelectorAll('.listItem'); //get all the html objects with .listItem class
                            listItem[currItem - 1].classList.remove('selected'); //remove the 'selected' class from the old selected item
                            listItem[currItem].classList.add('selected'); //add the 'selected' class to the new selected item
                            console.log("CURRITEM: " + currItem + "   numOfListItems: " + numOfListItems);
                        }

                    } else if (currentStatsMenuName === "TAB_GRID" || currentStatsMenuName === "TAB_DRIVERSTANDINGS" || currentStatsMenuName === "TAB_CONSTRUCTORSTANDINGS") {
                        console.log(currentStatsMenuName + " MENU DOWN");
                        console.log(pageIndex + " : " + (statsMenuModel.getNumberOfPages() - 1));
                        if (pageIndex < (statsMenuModel.getNumberOfPages() - 1)) {
                            pageIndex++;
                            console.log(currentStatsMenuName + "....CURRITEM: " + currItem + "   numOfListItems: " + numOfListItems);
                            statsMenuModel.setPageIndex(pageIndex);
                            populateStatsArea(currentStatsMenuName);
                        }
                    }
                } else {
                    if (currentStatsMenuName === "TAB_NEWS") {
                        var scrollArea = document.getElementById("statsContainer");
                        //scroll the text area by 50 pixels
                        scrollArea.scrollTop += 50;
                        //check to see if arrow icons require displaying
                        break;
                    } else if (currentStatsMenuName === "TAB_QUALIFYING" || currentStatsMenuName === "TAB_PRACTICE") {
                        if (pageIndex < statsMenuModel.getNumberOfPages() - 1) {
                            pageIndex++;
                            console.log("CURRITEM: " + currItem + "   numOfListItems: " + numOfListItems);
                            statsMenuModel.setPageIndex(pageIndex);
                            populateStatsArea(currentStatsMenuName);
                        }
                    }
                }
                break;
            case 39:
                console.log("RIGHT PRESSED ");
                statsMenuModel.setPageIndex(0);
                /*
                    If optionSelected is true, this means that the user has navigated onto a
                    sub-menu from the top level menu. For example, "practice times" contains 3 sub menus
                    for each practice session.
                */
                if (!optionSelected) {
                    var menuIndex = statsMenuModel.getMenuIndex(),
                        menuData = statsMenuModel.getStatsMenuSectionsData();
                    console.log("menuIndex: " + menuIndex);
                    console.log("menuData.length: " + menuData.length);
                    if (menuIndex < menuData.length - 1) {

                        currentStatsMenuName === "TAB_MENU" ? menuIndex = 0 : menuIndex++;
                        statsMenuModel.setMenuIndex(menuIndex);
                        self.buildMenu(menuData[menuIndex]["type"]);

                    } else {
                        if (menuData.length === 1 && currentStatsMenuName === "TAB_MENU") {
                            menuIndex = 0;
                            statsMenuModel.setMenuIndex(menuIndex);
                            self.buildMenu(menuData[menuIndex]["type"]);
                        } else {

                            menuIndex = 0;
                            statsMenuModel.setMenuIndex(menuIndex);
                            self.buildMenu("TAB_MENU");
                        }
                    }
                } else {
                    console.log("currItem: " + currItem + "  numOfListItems: " + numOfListItems);
                    if (currentStatsMenuName === "TAB_NEWS") {
                        currItem < numOfListItems ? currItem++ : currItem = 0;
                        statsMenuModel.setPageIndex(0);
                        statsMenuModel.setItemIndex(currItem);
                        populateStatsArea(currentStatsMenuName);
                    } else if (currentStatsMenuName === "TAB_PRACTICE" || currentStatsMenuName === "TAB_QUALIFYING") {
                        currItem < statsMenuModel.getNumOfParentListItems() ? currItem++ : currItem = 0;
                        statsMenuModel.setItemIndex(currItem);
                        populateStatsArea(currentStatsMenuName);
                    }
                }
                break;
            case 37:
                statsMenuModel.setPageIndex(0);
                console.log("LEFT PRESSED");
                /*
                    If optionSelected is true, this means that the user has navigated onto a
                    sub-menu from the top level menu. For example, "practice times" contains 3 sub menus
                    for each practice session.
                */
                if (!optionSelected) {
                    console.log("OPTION NOT SELECTED");
                    var menuIndex = statsMenuModel.getMenuIndex(),
                        menuData = statsMenuModel.getStatsMenuSectionsData();
                    console.log("MENU INDEX: " + menuIndex);
                    if (menuIndex > 0) {
                        menuIndex--;
                        statsMenuModel.setMenuIndex(menuIndex);
                        self.buildMenu(menuData[menuIndex]["type"]);
                    } else if (currentStatsMenuName === "TAB_MENU") {
                        menuIndex = menuData.length - 1;
                        statsMenuModel.setMenuIndex(menuIndex);

                        self.buildMenu(menuData[menuIndex]["type"]);

                    } else if (menuIndex === 0) {
                        console.log("if 3");
                        self.buildMenu("TAB_MENU");
                    }
                } else {
                    console.log("currItem: " + currItem + "  numOfListItems: " + numOfListItems);
                    if (currentStatsMenuName === "TAB_NEWS") {
                        currItem > 0 ? currItem-- : currItem = numOfListItems;
                        statsMenuModel.setPageIndex(0);
                        statsMenuModel.setItemIndex(currItem);
                        populateStatsArea(currentStatsMenuName);
                    } else if (currentStatsMenuName === "TAB_PRACTICE" || currentStatsMenuName === "TAB_QUALIFYING") {
                        currItem > 0 ? currItem-- : currItem = statsMenuModel.getNumOfParentListItems();
                        console.log("numOfListItems: " + numOfListItems + ">>>>>>>>>>>>>>>>>>> currItem: " + currItem);
                        statsMenuModel.setItemIndex(currItem);
                        populateStatsArea(currentStatsMenuName);
                    }
                }
                break;
            case 13:
                //enter-return key
                console.log("ENTER PRESSED");
                //retrieve the current menu name
                var destination,
                    statsData = statsMenuModel.getStatsMenuData(currentStatsMenuName);
                statsMenuModel.setPageIndex(0);
                switch (currentStatsMenuName) {
                case "TAB_MENU":
                    destination = statsData["sections"][currItem]["type"];
                    self.buildMenu(destination);
                    break;

                case "TAB_NEWS":
                case "TAB_QUALIFYING":
                case "TAB_PRACTICE":
                    if (!optionSelected) {
                        statsMenuModel.setNumOfParentListItems(numOfListItems);
                        statsMenuModel.setStatsOptionSelected(true);
                        statsMenuModel.setPageIndex(0);
                        populateStatsArea(currentStatsMenuName);
                    }


                    break;
                }

                break;
            case 73:
            case 457:
                //i
                self.openCloseStatsMenu();
                sportsAppModel.setKeyPressEnabled(true);
                break;
            case 66:
            case 27:
            case 8:
                //B for BACKUP/DELETE
                if (optionSelected) {
                    statsMenuModel.setStatsOptionSelected(false);
                    statsMenuModel.setItemIndex(0);
                    populateStatsArea(currentStatsMenuName);
                } else if (currentStatsMenuName === "TAB_MENU") {
                    self.openCloseStatsMenu();
                } else {
                    console.log("BUILD THE TAB MENU");
                    statsMenuModel.setItemIndex(0);
                    self.buildMenu("TAB_MENU");
                }
                break;
            case 403:
            case 82:
                var videoMenu = new VideoMenu();
                self.openCloseStatsMenu();
                videoMenu.init(0)

                break;
            default:
                break;
            }

        }

    }

    self.openCloseStatsMenu = function () {
        var statsMenuContainer = document.getElementById("statsMenuContainer");

        if (statsMenuContainer.classList.contains("open")) {
            statsMenuContainer.classList.remove("open");
            statsMenuContainer.classList.add("closed");
            sportsAppModel.setCurrentFocus(sportsAppModel.getLastFocus());
        } else {

            //reset the menu and list indexes
            statsMenuModel.setItemIndex(0);
            statsMenuModel.breadcrum = [];
            populateStatsArea("TAB_MENU");
            statsMenuContainer.classList.remove("closed");
            statsMenuContainer.classList.add("open");
        }

    }

    self.closeStatsMenu = function () {
        if (statsMenuContainer.classList.contains("open")) {
            statsMenuContainer.classList.remove("open");
            statsMenuContainer.classList.add("closed");
            sportsAppModel.setCurrentFocus(sportsAppModel.getLastFocus());
        }
    }


    self.loadStatsMenu = function (rtu, dataType) {
        //Only use AJAX if called by the Real Time Update module
        var jsLoad = rtu ? new AJAXjsonLoader() : new SJAXjsonLoader;
        var configData = statsMenuModel.getStatsMenuConfig(dataType);
        jsLoad.loadJSON(configData.statsURL + "?" + randNum.giveMeARandomNum(),
            function (data) {
                statsMenuModel.setStatsMenuData(data, dataType);

                //initialise the stats menu again if new one loaded via RTU
                if (rtu) {
                    self.init();
                }
                return;
            },
            function (jsonHR) {
                vmDtvLib.dax.trackError(jsonHR, "JSON Load error - Setting Stats Menu Status to False. Red button is now disabled");
                console.error("JSON Load error -> " + jsonHR + " Setting Stats Menu Status to False. Red button is now disabled");
                statsMenuModel.setStatsMenuStatus(false);
            }
        );
    }


    self.init = function () {

        //Get the stored stats menu data
        //var statsMenuData = statsMenuModel.getStatsMenuData();

        /*
         * If the initial data has been loaded and there is a stats menu available,
         * iterate through the menu data and load available stats files. 
         */
        if (statsMenuModel.menuAvailable()) {
            var statsMenuSectionsData = statsMenuModel.getStatsMenuSectionsData();
            //There is a menu system available
            //loop and load the stats data
            console.log("STATS MENU AVAILABLE");
            statsMenuModel.setStatsMenuStatus(true);
            for (var i = 0; i < statsMenuSectionsData.length; i++) {
                var statsType = statsMenuSectionsData[i]["type"];

                //I have never seen a file for the help tab
                if (statsMenuModel.menuTypeAllowed(statsType)) {
                    console.log("LOADING.. " + statsType);
                    self.loadStatsMenu(false, statsType);
                }

            }
            statsMenuModel.stripMenuData();
            //Build the first menu
            self.buildMenu("TAB_MENU");

        } else {
            //no menu available
            statsMenuModel.setStatsMenuStatus(false);
        }


    }

    //insert a DOM element after the reference Node
    var insertAfter = function (referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }


}

var allowedStatsList = function (statsType) {
    return {
        "TAB_MENU": true,
        "TAB_NEWS": true,
        "TAB_GRID": true,
        "TAB_QUALIFYING": true,
        "TAB_PRACTICE": true,
        "TAB_DRIVERSTANDINGS": true
    }[statsType];
}

var StatsMenuModel = function () {

    var statsMenuData = {
            "menu": {}
        },
        dataConfig = {
            "types": {
                "TAB_MENU": {
                    name: "MENU",
                    "statsURL": "stats/sections.json"
                },
                "TAB_NEWS": {
                    name: "NEWS",
                    "statsURL": "stats/newslist.json"
                },
                "TAB_GRID": {
                    name: "GRID",
                    "statsURL": "stats/grid.json"
                },
                "TAB_QUALIFYING": {
                    name: "QUALIFYING TIMES",
                    "statsURL": "stats/qualifyingtimes.json"
                },
                "TAB_PRACTICE": {
                    name: "PRACTICE TIMES",
                    "statsURL": "stats/practicetimes.json"
                },
                "TAB_DRIVERSTANDINGS": {
                    name: "DRIVERS' STANDINGS",
                    "statsURL": "stats/driverstandings.json"
                },
                "TAB_CONSTRUCTORSTANDINGS": {
                    name: "CONSTRUCTORS' STANDINGS",
                    "statsURL": "stats/constructorstandings.json"
                },
                "TAB_HELP": {
                    name: "HELP",
                    "statsURL": ""
                },
            }

        },
        status = false,
        menuIndex = 0,
        currentStatsMenuName = "",
        menuId = null, //Id of the Menu to be displayed
        itemIndex = 0, //index of the current item in the menu
        numOfListItems,
        numOfParentListItems,
        MAX_ROWS = 10, //Maximum number of items in a menu
        numberOfPages,
        pageIndex,
        statsOptionSelected = false,
        statsMenuElement,
        required = false,
        alertOnDisplay = false,
        self = this;

    self.breadcrum = [];

    self.getData = function () {
        return statsMenuData;
    }

    self.setStatsMenuData = function (data, dataType) {
        statsMenuData["menu"][dataType] = data;
    };

    self.stripMenuData = function () {
        //iterate the TAB_MENU menu data and remove disallowed Stats types
        var i = 0;
        console.log(statsMenuData["menu"]["TAB_MENU"]["sections"].length);
        while (i < statsMenuData["menu"]["TAB_MENU"]["sections"].length) {
            console.log(i);
            console.log(statsMenuData["menu"]["TAB_MENU"]["sections"].length);
            if (!self.menuTypeAllowed(statsMenuData["menu"]["TAB_MENU"]["sections"][i]["type"])) {
                console.log("Before: " + statsMenuData["menu"]["TAB_MENU"]["sections"][i]["type"]);
                statsMenuData["menu"]["TAB_MENU"]["sections"].splice(i, 1);
                //console.log("After: " + statsMenuData["menu"]["TAB_MENU"]["sections"][i]["type"]);

            } else {
                i++;
            }
        }
    }

    self.getStatsMenuData = function (dataType) {
        return statsMenuData["menu"][dataType];
    };

    self.setCurrentStatsMenu = function (menuName) {
        currentStatsMenuName = menuName;
    }

    self.getCurrentStatsMenu = function () {
        return currentStatsMenuName;
    }

    self.menuAvailable = function () {
        return statsMenuData["menu"].hasOwnProperty('TAB_MENU');
    }

    self.getStatsMenuSectionsData = function () {
        return statsMenuData["menu"]["TAB_MENU"]["sections"];
    }

    self.getStatsMenuConfig = function (dataType) {
        return dataConfig.types[dataType];
    }

    self.getBreadcrumLength = function () {
        return breadcrum.length;
    };

    self.pushBreadcrum = function (menuName) {
        //add a menu to the breadcrum trail
        self.breadcrum.push(menuName);
    };

    self.popBreadcrum = function (menuName) {
        //pop() removes the last item in the array
        self.breadcrum.pop();
    };

    //Returns true if the statsMenu is required
    self.getStatsMenuStatus = function () {
        return required;
    };

    //status : boolean
    self.setStatsMenuStatus = function (status) {
        required = status;
    };

    self.setMenuIndex = function (i) {
        menuIndex = i;
    };

    self.setItemIndex = function (i) {
        itemIndex = i;
    };

    self.setNumOfListItems = function (numOfItems, maxNumOfItems) {
        //Crop the number of list item to the maximum allowed if there are too many
        if (maxNumOfItems == null) {
            numOfListItems = numOfItems;
        } else {
            console.log("maxNumOfItems: " + maxNumOfItems + " numOfItems: " + numOfItems);
            numOfListItems = numOfItems <= maxNumOfItems ? numOfItems : maxNumOfItems;
            console.log("numOfListItems: " + numOfListItems);
        }
    };

    self.setNumOfParentListItems = function (numOfItems) {
        numOfParentListItems = numOfItems;

    };

    self.getNumOfParentListItems = function () {
        return numOfParentListItems;

    };

    self.setNumberOfPages = function (pages) {
        numberOfPages = pages;
    }

    self.getNumberOfPages = function () {
        return numberOfPages;
    }
    self.setMenuIndex = function (index) {
        menuIndex = index;
    };

    self.getStatsMenuIndex = function () {
        return menuIndex;
    };

    self.getItemIndex = function () {
        return itemIndex;
    };

    self.getMenuIndex = function () {
        return menuIndex;
    };

    self.getNumOfListItems = function () {
        return numOfListItems;
    };

    self.getMaxRows = function () {
        return MAX_ROWS;
    };

    self.setStatsOptionSelected = function (status) {
        statsOptionSelected = status;
    }

    self.getStatsOptionSelected = function () {
        return statsOptionSelected;
    }

    self.setPageIndex = function (index) {
        pageIndex = index;
    }

    self.getPageIndex = function () {
        return pageIndex;
    }

    self.menuTypeAllowed = function (menuType) {
        //console.log("IN MENU TYPE ALLOWED FOR " + menuType);
        //console.log(dataConfig.types.hasOwnProperty(menuType) && menuType !== "TAB_HELP")
        return dataConfig.types.hasOwnProperty(menuType) && menuType !== "TAB_HELP";
    }


}