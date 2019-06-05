/**
 * @file common.js 
 * @desc This file contains all of the shared functionality
 * used by all the Sky Sports HTML5 applications
 *
 * @author Neil Cooper neil.cooper@sky.uk
 * @update
 */

// @global commonVersion
var commonVersion = "1.1.10";
//1.1.2 Added detection of blank player id's in draw stats (Neil Cooper)
//1.1.3 fixed issue with index position of drawstats extratext data node position (Neil Cooper)
//1.1.4 Added help popup access and functionality into iMenu (Neil Cooper)
//1.1.5 Fixed message strap no-show on single stream video menu (Neil Cooper)
//1.1.6 replaced 3 loops with one function (createPlayerAndScoreBoxes) in the draw section (Neil Cooper)
//1.1.7 removed old channel manager work arounds (Neil Cooper)
//1.1.8 console logging cleanup (Neil Cooper)
//1.1.9 Forced video layer sizing to full screen (Neil Cooper)
//1.1.10 Fixed Navigation issue when iMenu navigates screen away from Draw Stats (Neil Cooper)

/**
 * @function ChannelManager()
 * @desc Object for Initialising and controlling video and audio tuning
 */
var ChannelManager = function () {

    // Initialise Channel Manager variables
    var log = vmDtvLib.logger.getInstance("ChannelManager"),
        debug = document.getElementById("debugArea"),
        self = this;

    /**
     * @function onLibInit()
     * @desc Callback function called on Virgin/Tivo Library initialisation.
     * Initialises video playout screen area and initial tune.
     * @param {integer} status - 
     * @param {integer} appConfig - 
     * @param {string} tivoClient -
     */
    function onLibInit(status, appConfig, tivoClient) {
        log.debug("onLibInit, status.ok:", status.ok);
        if (status.ok) {

            var vidArea = document.getElementById("vidArea"),
                OSD = document.getElementById("OSD"), //Main On Screen Display area
                vidBroadcast = document.getElementById("vidBroadcast");

            //If the video area (DIV) doesn't exist, create a new one
            if (!vidArea) {
                vidArea = document.createElement("div");
                vidArea.id = "vidArea";
                vidBroadcast = document.createElement("object");
                vidBroadcast.id = "vidBroadcast";
                vidBroadcast.type = "video/broadcast";
                vidBroadcast.style.left = "0px";
                vidBroadcast.style.top = "0px";
                vidBroadcast.style.width = "1280px";
                vidBroadcast.style.height = "720px";
                document.body.appendChild(vidArea).appendChild(vidBroadcast);
            }

            //If the OSD layer (DIV) doesn't exist, create a new one
            if (!OSD) {
                OSD = document.createElement("div");
                OSD.id = "OSD";
                document.body.appendChild(OSD);
            }

            //Show the video broadcast area
            vidBroadcast.style.visibility = "visible";
            log.debug("VMDBTV STATUS OK: " + status.ok);
            debug.innerHTML = "VMDBTV STATUS OK: " + status.ok;
            //initialise the channel manager
            vmDtvLib.chanMan.init(document.getElementById("vidBroadcast"));

            //Now that the VM DTV Library has been fired up. Load the rest of the app
            loadModules();

            return;

        } else {
            vmDtvLib.dax.trackError(err, "*** VM Library not initalised");
            log.error("*** VM Library not initalised: " + status);
            console.error("*** VM Library not initalised " + status);
        }

    }

    /**
     * @desc showStatsVideo() builds and displays a video display for the stats screen.
     */
    self.showStatsVideo = function () {
        var vidArea = document.getElementById("vidArea");
        var vidBroadcast = document.getElementById("vidBroadcast");
        var subMenuArea = document.getElementById("genStatsSub");
        var OSD = document.getElementById("OSD");
        vidBroadcast.style.left = "435px";
        vidBroadcast.style.top = "170px";
        vidBroadcast.style.width = "800px";
        vidBroadcast.style.height = "430px";
        setTimeout(function () {
            vidArea.style.zIndex = 20;
            vidBroadcast.style.zIndex = 20;
            OSD.style.zIndex = 1;
            subMenuArea.style.zIndex = 25;
        }, 0);
    };

    /**
     * @desc showFullScreen() resizes the video display to full-screen 1280x720.
     */
    self.showFullScreen = function () {
        var vidArea = document.getElementById("vidArea");
        var vidBroadcast = document.getElementById("vidBroadcast");
        var OSD = document.getElementById("OSD");
        vidBroadcast.style.left = "0px";
        vidBroadcast.style.top = "0px";
        vidBroadcast.style.width = "1280px";
        vidBroadcast.style.height = "720px";
        setTimeout(function () {
            vidArea.style.zIndex = 0;
            vidBroadcast.style.zIndex = 0;
            OSD.style.zIndex = 1;
        }, 0);

    };

    //Channel Tune
    self.channelTune = function (chanId, callBack) {
        showLoadingAnim();
        var debug = document.getElementById("debugArea");
        //debug.innerHTML = debug.innerHTML + "AUDIO TUNE START ";
        var av = new Av();

        //convert the channel id from OTV to Virgin
        var channelId = Number(av.videoStreams[chanId]);

        //tune to video channel
        var urlQuery = new QueryString();
        urlQuery.test == "1" ? vmDtvLib.chanMan.tuneToChannel(channelId, callBack) : vmDtvLib.chanMan.tuneAndExitOnTunerLoss(channelId, callBack, function () {
            splashLoader.show();
        });

        return;

    };

    //Audio Tune
    self.audioTune = function (audId, callBack) {
        vmDtvLib.chanMan.selectAudioComponent(audId, "index", callBack);
        return;
    };

    self.hideVideo = function () {
        var vidToHide = document.getElementById("vidBroadcast");
        vidToHide.style.visibility = "hidden";
        return;
    };

    self.showVideo = function () {
        var vidToHide = document.getElementById("vidBroadcast");
        vidToHide.style.visibility = "visible";
        return;
    };

    self.exit = function () {
        console.log("EXIT APP");
        splashLoader.show();
        var av = new Av();
        var chanID = channelManagerModel.getChannelID();
        tivo.core.exit(); //added by Neil Cooper 07/04/2016 This is the exit to channel to use instead of exiTtoTv (if not a channel man conflict)
        av = null;
    };

    self.init = function () {
        log.debug("Initialise vmDtvLib");
        vmDtvLib.lib.init(onLibInit);
    };

};

var ChannelManagerModel = function () {

    var channelID,
        currentChannel, //curent video channel
        currentAudio, //current audio channel (numerical)
        self = this; //this object

    self.setCurrentChannel = function (chan) {
        currentChannel = chan;
    };

    self.getCurrentChannel = function () {
        return currentChannel;
    };

    self.setCurrentAudio = function (aud) {
        currentAudio = aud;
    };

    self.getCurrentAudio = function () {
        return currentAudio;
    };

    self.setChannelID = function (id) {
        channelID = id;
    };

    self.getChannelID = function () {
        return channelID;
    };
};

var SplashLoader = function (splash) {

    //splash URL
    var splashURL = splash;
    randNum = new RandomURLNum();

    this.show = function () {
        var splashContainer = document.getElementById("splashContainer");
        splashContainer.style.visibility = "visible";
        return true;
    };

    this.hide = function () {
        var splashContainer = document.getElementById("splashContainer");

        splashContainer.style.visibility = "hidden";

        return true;
    };

    (function () {
        //create new splash container object (if it doesn't exits)
        if (!document.getElementById("splashContainer")) {
            var OSD = document.getElementById('OSD');
            var debug = document.getElementById('debug');
            if (!OSD) {
                OSD = document.createElement("div");
                debug = document.createElement("div");
                OSD.id = "OSD";
                debug.id = "debugArea";
                document.body.appendChild(OSD).appendChild(debug);

            }
            var divNode = document.createElement('div');
            divNode.id = "splashContainer";
            divNode.style.background = "url('" + splashURL + '?' + randNum.giveMeARandomNum() + "') no-repeat";
            divNode.style.zIndex = "65535";
            OSD.appendChild(divNode);
        }

    }());

};

/*
 * Neil Cooper
 */
var Av = function () {

    var ishd = sportsAppModel.getIsHD();
    self = this;

    self.videoStreams = [];

    "1" === ishd ? (
            /* High Definition */

            // Channels
            self.videoStreams["SS1"] = '1520', // SS1 HD
            self.videoStreams["SS2"] = '1521', // SS2 HD
            self.videoStreams["SS3"] = '1769', // SS3 HD
            self.videoStreams["SS4"] = '1770', // SS4 HD
            self.videoStreams["SS5"] = '1787', // SS5 HD
            self.videoStreams["SF1"] = '1771', // SF1 HD


            // LO
            self.videoStreams["181"] = '1525', // SD encoder Lo 1
            self.videoStreams["182"] = '1526', // SD encoder Lo 2
            self.videoStreams["183"] = '1527', // SD encoder Lo 3
            self.videoStreams["184"] = '1528', // SD encoder Lo 4
            self.videoStreams["185"] = '1529', // SD encoder Lo 5
            self.videoStreams["186"] = '1530', // SD encoder Lo 6
            self.videoStreams["187"] = '1531', // SD encoder Lo 7
            self.videoStreams["188"] = '1532', // SD encoder Lo 8
            self.videoStreams["189"] = '1533') // SD encoder Lo 9

    :

    /* Standard Definition */

    // Channels
    (self.videoStreams["SS1"] = '319', // SS1 SD
        self.videoStreams["SS2"] = '320', // SS2 SD
        self.videoStreams["SS3"] = '321', // SS3 SD
        self.videoStreams["SS4"] = '322', // SS4 SD
        self.videoStreams["SS5"] = '1786', // SS5 SD
        self.videoStreams["SF1"] = '1595', // SF1 SD			

        // LO
        self.videoStreams["181"] = '1525', // SD encoder Lo 1
        self.videoStreams["182"] = '1526', // SD encoder Lo 2
        self.videoStreams["183"] = '1527', // SD encoder Lo 3
        self.videoStreams["184"] = '1528', // SD encoder Lo 4
        self.videoStreams["185"] = '1529', // SD encoder Lo 5
        self.videoStreams["186"] = '1530', // SD encoder Lo 6
        self.videoStreams["187"] = '1531', // SD encoder Lo 7
        self.videoStreams["188"] = '1532', // SD encoder Lo 8
        self.videoStreams["189"] = '1533' // SD encoder Lo 9

    );
};

//SJAXjsonLoader: loads JSON from given url (Synchronous)

SJAXjsonLoader = function () {
    this.loadJSON = function (url, loadSuccess, error) {
        var fileName = url;
        var jsonHR = new XMLHttpRequest();

        jsonHR.open('GET', fileName, false);
        jsonHR.send();

        if (jsonHR.status === 200) {
            if (loadSuccess) {

                var response = jsonHR.responseText;

                if (response.length === 0) {
                    response = "{}";
                }

                loadSuccess(JSON.parse(response));
            }
        } else {
            if (error)
                error(jsonHR);
        }
    };

};


//AJAXjsonLoader: loads JSON from given url (Asynchronous)
AJAXjsonLoader = function () {
    this.loadJSON = function (url, loadSuccess, error) {
        var jsonHR = new XMLHttpRequest();
        jsonHR.onreadystatechange = function () {
            if (jsonHR.readyState === XMLHttpRequest.DONE) {
                if (jsonHR.status === 200) {
                    if (loadSuccess) {
                        var response = jsonHR.responseText;

                        if (response.length === 0) {
                            response = "{}";
                        }

                        try {
                            loadSuccess(JSON.parse(response));
                        } catch (e) {
                            console.error("JSON PARSE ERROR!!: " + e);
                        }
                    }
                } else {
                    if (error)
                        error(jsonHR);
                }
            }
        };

        jsonHR.open("GET", url, true);

        jsonHR.send();
    };
};

/*
 * QueryString: extract names and values from a url
 */
QueryString = function () {
    "use strict";
    this.query_string = {};
    this.query = getQueryString();
    this.vars = this.query.split("&");
    for (var items in this.vars) {
        var i = Object.keys(this.vars).indexOf(items);
        var pair = this.vars[i].split("=");
        if (typeof this.query_string[pair[0]] === "undefined") {
            this.query_string[pair[0]] = decodeURIComponent(pair[1]);
        } else if (typeof this.query_string[pair[0]] === "string") {
            var arr = [this.query_string[pair[0]], decodeURIComponent(pair[1])];
            this.query_string[pair[0]] = arr;
        } else {
            this.query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return this.query_string;
};

getQueryString = function () {
    return window.location.search.substring(1);
}

/*
 *randomURLNum: creates a random number used to append to a url to bypass caching
 */
RandomURLNum = function () {
    this.baseNum = 1;
    this.ceilNum = 99999;
    this.rndResult = 0;

    this.giveMeARandomNum = function () {
        this.rndResult = Math.floor((Math.random() * this.ceilNum) + this.baseNum);
        return this.rndResult;
    };


};

/*
 * Alerts 
 *
 * This is how I think this is supposed to work:
 * 
 * Alert data is controlled and fed by the TD's in the studio
 * If alerts are switched on via the iMenu
 * The RTU polls the data and picks up any changed in rtu.json and 
 * then reads the new alertdata.json if there is new data available.
 * 
 * Neil Cooper
 */
var Alerts = function () {

    var ALERT_URL = "alertdata.json",
        HIDDEN = "hidden",
        VISIBLE = "visible",
        iMenu = new Imenu(),
        tuneBackTimer = null,
        self = this,
        randNum = new RandomURLNum(); // new random number gen object

    self.buildAlert = function () {
        var OSD = document.getElementById('OSD'),
            iMenuStrap = document.getElementById("iMenuStrap"),
            alertStrap = document.getElementById("alertStrap");

        if (!iMenuStrap) {
            // iMenu Strap doesn't exist
            // Build iMenu here ???
            // Investigate later
        }

        //The alert strap doesn't exist yet. We had better build it     
        if (!alertStrap) {

            //We need to know where this thing goes so
            //the best place to  look is where the iMenu strap sits.
            //They both share the same Y coordinate
            var alertYPos = iMenuModel.getiMenuYPos();

            alertStrap = document.createElement("div");
            alertStrap.id = "alertStrap";

            var alertSpan = document.createElement("span");
            alertSpan.id = "alertText";

            //set the css top attribute to the stored Y coordinate
            alertStrap.style.top = alertYPos + "px";

            //set the background image to the alert strap graphic
            alertStrap.style.backgroundImage = "url(" + alertsModel.getBackgroundURL() + ")";

            //add the alert strap and text span to the page
            OSD.appendChild(alertStrap).appendChild(alertSpan);
        }

        //Hide the alert strap
        self.setVisibility(HIDDEN);

    };

    //show the alert
    self.showAlert = function () {

        var alertData = alertsModel.getAlertData();

        //populate alert message from data
        var alertSpan = document.getElementById("alertText");
        alertSpan.innerHTML = alertData.alert;

        //set tuning link for red button
        redButtonChannel = alertData.stream;

        //if ticker is running, stop ticker
        if (iMenu.getTickerStatus === "on") {
            ticker.stopTicker();
            tickerModel.setTickerStopped(true);
        }

        //close the iMenu if available
        if (iMenuModel.getImenuStatus()) {
            iMenu.closeImenu();

            //hide the info icon
            iMenu.hideInfoIcon();
        }
        //set timeout for message and set visibility
        self.setVisibility(VISIBLE);

        iMenuModel.setAlertDisplayStatus(true);
        sportsAppModel.setCurrentFocus("alerts");

        setTimeout(function () {
            self.hideAlert();
        }, alertsModel.getAlertTimeout());

    };

    //Make the alert disappear and restart the ticker if previously stopped
    self.hideAlert = function () {
        var iMenu = new Imenu();
        var ticker = new Ticker();
        //Hide the alert strap
        self.setVisibility(HIDDEN);

        //Restart ticker if ticker was previously stopped otherwise
        //people will start complaining
        if (iMenu.getTickerStatus === "on") {
            if (tickerModel.getTickerStopped()) {
                ticker.startTicker(tickerModel.getTickerIndex());
                tickerModel.setTickerStopped(false);
            }
        }

        iMenu.showInfoIcon();
        iMenuModel.setAlertDisplayStatus(false);
        sportsAppModel.setCurrentFocus("videoMenu");

    };

    /*
     * SetVisibility
     *
     * @Params: visibility- "visible","hidden"
     */
    self.setVisibility = function (visibility) {
        var alertStrap = document.getElementById("alertStrap");
        alertStrap.style.visibility = visibility;
        return;
    };


    /*
     * Alert Loader
     * @PARAM rtu - true  : invoked by Real Time Updater so background AJAX load required
     *              false : SJAX load required
     */

    self.loadAlert = function (rtu) {
        jsLoad = rtu ? new AJAXjsonLoader() : new SJAXjsonLoader();

        jsLoad.loadJSON(ALERT_URL + "?" + randNum.giveMeARandomNum(),
            function (data) {
                alertsModel.setAlertData(data);
                //display the alert
                self.showAlert();
                return;
            },
            function (jsonHR) {
                vmDtvLib.dax.trackError(jsonHR, "JSON Load error " + ALERT_URL);
                console.error("JSON Load Error -> " + jsonHR + " " + ALERT_URL);
            }
        );
    };

    function redButtonTune() {
        //set the tune flag to true
        alertsModel.setRedButtonTune(true);
        //set current channel so that we can back up to that afterwards
        var av = new Av();
        var iMenu = new Imenu();
        var videoMenu = new VideoMenu();
        var tuneAwayTimeout = alertsModel.getTuneAwayTimeout();
        //Hide alert Strap
        self.hideAlert();
        //Hide video menu target
        videoMenu.hideTarget();
        //Shut down iMenu if open
        if (iMenuModel.getImenuStatus()) {
            iMenu.closeImenu();
            //Hide i icon
            iMenu.hideInfoIcon();
        }
        //Hide iMenu Strap if visible
        //if ticker is running, hide ticker
        if (iMenuModel.getTickerStatus() === "on") {
            var ticker = new Ticker();
            ticker.hideTicker();
            //actually hide the whole iMenu strap 
            iMenu.hideImenuStrap();
        }
        channelManager.channelTune(alertsModel.getRedButtonChannel(), vidCallBack());
    }

    function vidCallBack() {
        hideLoadingAnim();
        var currentChannel = channelManagerModel.getCurrentChannel();
        tuneBack = setTimeout(function () {
            channelManager.channelTune(currentChannel, redButtonCallBack());
        }, 10000);
    }

    /*
     *This gets called when video has tuned and returned
     *back to the main video menu
     */
    function redButtonCallBack() {
        //Tune to the required Audio
        channelManager.audioTune(alertsModel.getRedButtonAudio(), reloadVideoMenu());
        hideLoadingAnim();
    }

    function reloadVideoMenu() {
        //set the Red Button Flag to false
        alertsModel.setRedButtonTune(false);
        //Show video Menu
        var videoMenu = new VideoMenu();
        var iMenu = new Imenu();
        //Show i icon (if video menu available)
        iMenu.showInfoIcon();
        //Show iMenu Strap (if hidden)
        //Start Ticker again if previously stopped
        if (iMenuModel.getTickerStatus() === "on") {
            iMenu.showImenuStrap();
            var ticker = new Ticker();
            ticker.showTicker();
        }
        videoMenu.showTarget();
        //set the focus to the video menu
        sportsAppModel.setCurrentFocus("videoMenu");
    }

    self.alertController = function (keycode) {
        switch (keycode) {
        case 403:
            //If we haven't already tuned away on the red button
            if (!alertsModel.getRedButtonTune()) {
                vmDtvLib.dax.pageChange("Alert Full Screen Video", "red-button");
                redButtonTune();
            }
            break;
        case 82:
            //If we haven't already tuned away on the red button
            if (!alertsModel.getRedButtonTune()) {
                vmDtvLib.dax.pageChange("Alert Full Screen Video", "red-button");
                redButtonTune();
            }
            break;
        case 27: //BACKUP button on the controller
            if (alertsModel.getRedButtonTune()) {
                clearTimeout(tuneBack);
                vmDtvLib.dax.pageChange("Video Menu", "back-button");
                channelManager.channelTune(av[currentChannel], self.vidCallBack);
            } else {
                //hide alert bar and return to video menu
            }
            break;
        default:
            //You can still use the video menu when the alert strap is up (but not the iMenu)
            videoMenu.videoMenuController(event.keyCode);
            break;
        }

    };


};


/*
 * Config
 *
 * Neil Cooper
 * 
 * Sports App Configuration file
 * Loads 'config.json' and stores results.
 *
 */

var Config = function () {

    var CONFIG_URL = "config.json",
        randNum = new RandomURLNum(); // new random number gen object

    //get the JSON config file
    this.loadConfig = function (rtu) {
        //Only use AJAX if called by the Real Time Update module
        var jsLoad = rtu ? new AJAXjsonLoader() : new SJAXjsonLoader();

        jsLoad.loadJSON(CONFIG_URL + "?" + randNum.giveMeARandomNum(),
            function (data) {
                configModel.setConfigData(data);
                return;
            },
            function (err) {
                vmDtvLib.dax.trackError(err, "JSON Load error " + CONFIG_URL);
                console.error("JSON loader error: " + err + " " + CONFIG_URL);
            }
        );
    };

};

/*********************
 * DrawStats
 *
 * Neil Cooper
 *
 **********************/

var DrawStats = function () {

    var randNum = new RandomURLNum(),
        DRAW_URL = "draw_",
        self = this;

    self.buildDrawStats = function () {
        var drawContainer = document.getElementById("drawContainer");

        if (!drawContainer) {
            drawContainer = document.createElement("div");
            drawContainer.id = "drawContainer";
            document.getElementById("OSD").appendChild(drawContainer); //getElementById is much faster than using querySelector
        }

        //Build the competition title
        var drawCompTitle = document.createElement("div"),
            spanElement = document.createElement("span");
        drawCompTitle.id = "drawCompTitle";
        drawContainer.appendChild(drawCompTitle).appendChild(spanElement);
        drawCompTitle.firstChild.innerHTML = drawStatsModel.getCompTitle();
        drawCompTitle = null;
        spanElement = null;

        //Create the three column areas
        for (var i = 1; i < 4; i++) {
            var drawDataColumn = document.createElement("div"),
                drawColumnTitle = document.createElement("div");
            spanElement = document.createElement("span");
            drawColumnTitle.id = "drawColumnTitle" + i;

            drawColumnTitle.className = "drawColumnTitle";
            drawDataColumn.className = "drawRoundColumn drawColumn" + i;
            drawContainer.appendChild(drawDataColumn);
            drawContainer.appendChild(drawColumnTitle).appendChild(spanElement);
        }
        drawDataColumn = null;
        spanElement = null;

        //Create 'extra text' areas 1 - 8
        for (i = 1; i < 8; i++) {
            var drawExtraText = document.createElement("div");
            spanElement = document.createElement("span");
            drawExtraText.className = "drawExtraText drawExtraText" + i;
            drawContainer.appendChild(drawExtraText).appendChild(spanElement);
            drawExtraText = null;
        }

        //create (ROUNDS) text
        var roundsText = document.createElement("div");
        spanElement = document.createElement("span");
        roundsText.id = "roundsText";
        drawContainer.appendChild(roundsText).appendChild(spanElement);
        roundsText.childNodes[0].innerHTML = "(ROUNDS)";
        roundsText = null;
        spanElement = null;

        /*Create player name and score boxes
         * 16 score boxes for column 1
         * 8 score boxes for column 2
         * 4 score boxes for column 3
         */
        createPlayerAndScoreBoxes(16, "drawColumn1");
        createPlayerAndScoreBoxes(8, "drawColumn2");
        createPlayerAndScoreBoxes(4, "drawColumn3");

        //create left and right arrows < >
        var rightArrow = document.createElement("figure");
        var leftArrow = document.createElement("figure");
        rightArrow.id = "drawArrowRight";
        leftArrow.id = "drawArrowLeft";
        leftArrow.style.visibility = "hidden";
        rightArrow.style.visibility = "visible";
        drawContainer.appendChild(rightArrow);
        drawContainer.appendChild(leftArrow);

        //create up and down arrows ^ v
        var upArrow = document.createElement("figure");
        upArrow.id = "drawArrowUp";
        drawContainer.appendChild(upArrow);

        var downArrow = document.createElement("figure");
        downArrow.id = "drawArrowDown";
        drawContainer.appendChild(downArrow);
        checkUpDownArrows();
        checkLeftRightArrows();
        drawContainer.style.visibility = "visible";

    };

    var createPlayerAndScoreBoxes = function (noOfRows, columnName) {
        for (i = 0; i < noOfRows; i = i + 2) {
            var drawColumn = document.getElementsByClassName(columnName),
                drawGameBox = document.createElement("div"),
                drawPlayerName = document.createElement("div"),
                drawPlayerScore = document.createElement("div");

            drawGameBox.className = "drawGameBox";
            drawPlayerScore.className = "drawPlayerScore";
            drawPlayerName.className = "drawPlayerName";
            drawColumn[0].appendChild(drawGameBox);
            var spanElement = document.createElement("span");
            drawGameBox.appendChild(drawPlayerName).appendChild(spanElement);
            var spanElement = document.createElement("span");
            drawGameBox.appendChild(drawPlayerScore).appendChild(spanElement);
            drawColumn[0].appendChild(drawGameBox);
            drawGameBox = null;
            drawColumn = null;
            drawPlayerName = null;
            drawPlayerScore = null;
        }

    };

    self.populateStatsPage = function () {
        var currentRound = drawStatsModel.getCurrentRound(),
            currentPage = drawStatsModel.getCurrentPage(),
            p1Name, p2Name,
            p1Score, p2Score,
            columnDetails = {
                column1: {
                    name: "drawColumn1",
                    multiplier: 4,
                    offset: 1
                },
                column2: {
                    name: "drawColumn2",
                    multiplier: 2,
                    offset: 5
                },
                column3: {
                    name: "drawColumn3",
                    multiplier: 1,
                    offset: 7
                }
            },
            roundIndex = currentRound;

        for (var i = 1; i < 4; i++) {
            var columnTitle = document.getElementById("drawColumnTitle" + i);
            columnTitle.childNodes[0].innerHTML = drawStatsModel.getRoundTitle(roundIndex);
            roundIndex++;
        }

        displayDrawText(currentPage, currentRound, columnDetails.column1);
        displayDrawText(currentPage, currentRound + 1, columnDetails.column2);
        displayDrawText(currentPage, currentRound + 2, columnDetails.column3);

    };


    var displayDrawText = function (currentPage, currentRound, columnInfo) {

        var pageVal = currentPage * columnInfo.multiplier;
        var nodeIndex = 0;

        for (var i = 0; i < columnInfo.multiplier; i++) {

            p1Name = drawStatsModel.getPlayerName(drawStatsModel.getPlayer1Id(currentRound, pageVal, i));
            p2Name = drawStatsModel.getPlayerName(drawStatsModel.getPlayer2Id(currentRound, pageVal, i));
            var extraText = drawStatsModel.getExtraText(currentRound, pageVal, i);
            winner = drawStatsModel.getWinner(currentRound, pageVal, i);

            if (winner === -1) {
                p1Score = " ";
                p2Score = " ";
            } else {
                p1Score = drawStatsModel.getPlayer1Score(currentRound, pageVal, i);
                p2Score = drawStatsModel.getPlayer2Score(currentRound, pageVal, i);
            }
            var roundEl = document.getElementsByClassName(columnInfo.name);

            roundEl[0].childNodes[nodeIndex].childNodes[0].childNodes[0].innerHTML = p1Name;
            roundEl[0].childNodes[nodeIndex + 1].childNodes[0].childNodes[0].innerHTML = p2Name;
            roundEl[0].childNodes[nodeIndex].childNodes[1].childNodes[0].innerHTML = p1Score;
            roundEl[0].childNodes[nodeIndex + 1].childNodes[1].childNodes[0].innerHTML = p2Score;
            document.getElementsByClassName("drawExtraText" + (i + columnInfo.offset))[0].innerHTML = extraText
            nodeIndex = nodeIndex + 2;
        }

    };

    self.navRight = function () {
        var currRound = drawStatsModel.getCurrentRound();
        var noOfRounds = drawStatsModel.getNumberOfRounds();

        if (currRound < (noOfRounds - 3)) {
            drawStatsModel.setCurrentPage(0);
            currRound++;
            drawStatsModel.setCurrentRound(currRound);
            self.populateScrollBar();
            self.populateStatsPage();
        }
        checkUpDownArrows();
        checkLeftRightArrows();
        sportsAppModel.setKeyPressEnabled(true);

    };

    self.navLeft = function () {
        var currRound = drawStatsModel.getCurrentRound();
        var noOfRounds = drawStatsModel.getNumberOfRounds();

        if (currRound > 0) {
            drawStatsModel.setCurrentPage(0);
            currRound--;
            drawStatsModel.setCurrentRound(currRound);
            self.populateScrollBar();
            self.populateStatsPage();

        }
        checkUpDownArrows();
        checkLeftRightArrows();
        sportsAppModel.setKeyPressEnabled(true);
    };

    self.navUp = function () {
        var currRound = drawStatsModel.getCurrentRound();
        var currPage = drawStatsModel.getCurrentPage();
        if (currPage > 0) {
            currPage--;
            drawStatsModel.setCurrentPage(currPage);
            self.populateScrollBar();
            self.populateStatsPage();
        }
        checkUpDownArrows();
        checkLeftRightArrows();
        sportsAppModel.setKeyPressEnabled(true);
    };

    self.navDown = function () {
        var currRound = drawStatsModel.getCurrentRound(),
            currPage = drawStatsModel.getCurrentPage(),
            noOfPages = drawStatsModel.getNumberOfPages(currRound);
        if (currPage < noOfPages - 1) {
            currPage++;
            drawStatsModel.setCurrentPage(currPage);
            self.populateScrollBar();
            self.populateStatsPage();
        }

        checkUpDownArrows();
        checkLeftRightArrows();
        sportsAppModel.setKeyPressEnabled(true);
    };


    function checkUpDownArrows() {
        var currRound = drawStatsModel.getCurrentRound(),
            currPage = drawStatsModel.getCurrentPage(),
            noOfPages = drawStatsModel.getNumberOfPages(currRound),
            upArrow = document.getElementById("drawArrowUp"),
            downArrow = document.getElementById("drawArrowDown");
        currPage > 0 ? upArrow.style.visibility = "visible" : upArrow.style.visibility = "hidden";
        currPage < noOfPages - 1 ? downArrow.style.visibility = "visible" : downArrow.style.visibility = "hidden";
    }

    function checkLeftRightArrows() {
        var currRound = drawStatsModel.getCurrentRound(),
            noOfRounds = drawStatsModel.getNumberOfRounds(),
            leftArrow = document.getElementById("drawArrowLeft"),
            rightArrow = document.getElementById("drawArrowRight");
        currRound > 0 ? leftArrow.style.visibility = "visible" : leftArrow.style.visibility = "hidden";
        currRound < (noOfRounds - 3) ? rightArrow.style.visibility = "visible" : rightArrow.style.visibility = "hidden";
    }

    self.populateScrollBar = function () {
        var currentRound = drawStatsModel.getCurrentRound(),
            numberOfPages = drawStatsModel.getNumberOfPages(currentRound),
            currentPage = drawStatsModel.getCurrentPage(),
            drawContainer = document.getElementById("drawContainer"),
            scrollBarContainer = document.getElementById("scrollBarContainer");


        if (!scrollBarContainer) {
            scrollBarContainer = document.createElement("div");
            scrollBarContainer.id = "scrollBarContainer";
            drawContainer.appendChild(scrollBarContainer);
        }

        var scrollBarHeight = (scrollBarContainer.clientHeight / numberOfPages);
        //make sure the scroll bar container is empty;
        scrollBarContainer.innerHTML = "";

        for (i = 0; i < numberOfPages; i++) {
            var scrollBar = document.createElement("div");
            scrollBar.className = "drawScrollBar";
            scrollBar.style.height = scrollBarHeight + "px";
            scrollBarContainer.appendChild(scrollBar);
        }

        scrollBarContainer.childNodes[currentPage].style.background = "#ffffff";

    };

    this.drawController = function (keyCode) {
        if (sportsAppModel.getKeyPressEnabled()) {
            switch (keyCode) {

            case 38: //up
                sportsAppModel.setKeyPressEnabled(false);
                self.navUp();
                break;
            case 40: //down
                sportsAppModel.setKeyPressEnabled(false);
                self.navDown();
                break;
            case 39: //right;
                sportsAppModel.setKeyPressEnabled(false);
                self.navRight();
                break;
            case 37: //left
                sportsAppModel.setKeyPressEnabled(false);
                self.navLeft();
                break;
            case 66:
                //backup
                var videoMenu = new VideoMenu();
                var videoMenuIndex = videoMenuModel.getVideoMenuIndex();
                var OSD = document.getElementById("OSD");
                var drawContainer = document.getElementById("drawContainer");
                OSD.removeChild(drawContainer);
                drawStatsModel.setCurrentStatus(false);
                sportsAppModel.setCurrentFocus("videoMenu");
                videoMenu.loadVideoMenu();
                vmDtvLib.dax.pageChange("Video Menu " + videoMenuIndex, "back-button");
                videoMenu.init(videoMenuIndex);
                break;
            case 27:
                //backup
                var videoMenu = new VideoMenu();
                var videoMenuIndex = videoMenuModel.getVideoMenuIndex();
                var OSD = document.getElementById("OSD");
                var drawContainer = document.getElementById("drawContainer");
                OSD.removeChild(drawContainer);
                drawStatsModel.setCurrentStatus(false);
                sportsAppModel.setCurrentFocus("videoMenu");
                videoMenu.loadVideoMenu();
                vmDtvLib.dax.pageChange("Video Menu " + videoMenuIndex, "back-button");
                videoMenu.init(videoMenuIndex);
                break;
            default:
                break;
            }
        }

    };


    /*
     * loadDrawData
     *
     * @desc Loads the draw data JSON file data. 
     *
     * @PARAM rtu - true if request comes from the RTU. If true, AJAX is used
     */
    self.loadDrawData = function (drawNumber) {
        //Only use AJAX if called by rtu
        var jsLoad = new SJAXjsonLoader();
        //for (drawNumber = 0; drawNumber < 4; drawNumber++) {
        var jsonFile = DRAW_URL + drawNumber + ".json?" + randNum.giveMeARandomNum();

        jsLoad.loadJSON(jsonFile,
            function (data) {
                //store the help text JSON Data
                //drawStatsModel.setDrawData(drawNumber, data);
                drawStatsModel.setDrawData(data);
                return;
            },
            function (jsonHR) {
                vmDtvLib.dax.trackError(jsonHR, "JSON Load error " + DRAW_URL + drawNumber + ".json");
                console.error("UH OH!!! -> " + jsonHR);
            }
        );
        //}


    };

    self.init = function (drawNumber) {
        //sportsAppModel.setLastFocus(sportsAppModel.getCurrentFocus());
        sportsAppModel.setCurrentFocus("draw");
        drawStatsModel.setCurrentPage(0); //initialise page number to 0
        self.loadDrawData(drawNumber);
        drawStatsModel.setCurrentStatus(true);
        self.buildDrawStats();
        self.populateStatsPage();
        self.populateScrollBar();

    };
};

/************************
 *
 * GenStats
 *
 *
 *************************/


var GenStats = function () {

    var self = this;
    var GENSTATS_URL = "stats/statsmenu.json";
    var randNum = new RandomURLNum(); // new random number gen object

    /* n2br
     *
     * @desc This is a small function that converts \n newlines to <br/> in a string
     *
     */

    var n2br = function (string) {
        this.str = string;
        this.str = this.str.replace(/(?:\r\n|\r|\n)/g, '<br>'); //string conversion
        return this.str;
    };

    function clearElement(e) {
        while (e.firstChild) {
            e.removeChild(e.firstChild);
        }
    }

    //build the page layout and elements
    self.buildStatsPage = function (tabIndex) {
        var genStatsContainer = document.getElementById("genStatsContainer");
        //if the generic stats container doesn't exist
        if (genStatsContainer === 'undefined' || genStatsContainer === null) {
            //create the gen stats container
            genStatsContainer = document.createElement("div");
            genStatsContainer.id = "genStatsContainer";
        } else {
            clearElement(genStatsContainer);
        }
        var genStatsMain = document.createElement("div");
        var genStatsSub = document.createElement("div");

        genStatsMain.id = "genStatsMain";
        genStatsSub.id = "genStatsSub";
        genStatsContainer.appendChild(genStatsSub);
        genStatsContainer.appendChild(genStatsMain);
        document.getElementById("OSD").appendChild(genStatsContainer);
        genStatsContainer.style.visibility = "visible";

        //populate tabs (tabIndex first)
        var currentTab = tabIndex;
        var tabData = genStatsModel.getGenStatsData(0);
        var tabBar = document.getElementById("genStatsTabBar");
        if (tabBar === 'undefined' || tabBar === null) {

            tabBar = document.createElement("div");
            tabBar.id = "genStatsTabBar";

        }

        var noOfTabs = genStatsModel.getNoOfTabs();
        var tabRef = currentTab - 1;
        for (var i = 0; i < noOfTabs; i++) {
            var tab = document.createElement("div");
            tab.className = "genStatsTab";
            tab.appendChild(document.createTextNode(tabData["tabs"][tabRef].title));

            tabRef++;
            if (tabRef == (noOfTabs)) {
                tabRef = 0;
            }
            tabBar.appendChild(tab);
        }
        genStatsContainer.appendChild(tabBar);

        //resize/show video pane

        //get stats type [tabIndex]
        //var statsType = genStatsModel.getStatsType(tabIndex,)
        genStatsModel.setMenuIndex(0); // initialise the menu index to 0 (first item in list)
        populateTopLevelMenu(tabIndex);
        //populateGenStatsMain(tabIndex, "topLevel");
    };

    var populateTopLevelMenu = function (tabIndex) {
        genStatsModel.setCurrentMenuType("menu");
        genStatsModel.setMenuLevel("toplevel");
        var data = genStatsModel.getGenStatsData(tabIndex);
        var menuLength = data["toplevel"]["data"]["items"].length;
        genStatsModel.setNoOfMenuItems(menuLength);
        var genStatsMain = document.getElementById("genStatsMain");
        clearElement(genStatsMain);
        var menuUl = document.createElement("ul");
        genStatsMain.appendChild(menuUl);

        //for faster than forEach (ref https://jsperf.com/fast-array-foreach)
        for (var i = 0; i < menuLength; i++) {

            var menuItem = document.createElement("li");
            var menuBar = document.createElement("div");
            menuItem.className = "genStatsMenuItem";
            menuUl.appendChild(menuItem).appendChild(menuBar);
            var type = data["toplevel"]["data"]["items"][i]["type"];
            if (type === "blank") {
                menuBar.innerHTML = "";
                menuBar.className = "genStatsMenuBar blankItem";
            } else {
                if (genStatsModel.getMenuIndex() == i) {
                    menuBar.className = "genStatsMenuBar selected";
                    if (type === "submenu") {
                        menuBar.appendChild(document.createTextNode(data["toplevel"]["data"]["items"][i]["title"]));
                    } else {
                        menuBar.appendChild(document.createTextNode(data["toplevel"]["data"]["items"][i]["data"]["title"]));
                    }
                } else {
                    menuBar.className = "genStatsMenuBar";
                    if (type === "submenu") {
                        menuBar.appendChild(document.createTextNode(data["toplevel"]["data"]["items"][i]["title"]));
                    } else {
                        menuBar.appendChild(document.createTextNode(data["toplevel"]["data"]["items"][i]["data"]["title"]));
                    }
                }
            }
        }
        //Footer
        var footerArea = document.createElement("div");
        footerArea.id = "genStatsFooter";
        var backupText = document.createElement("div");
        backupText.id = "genStatsStoryBackupTxt";
        backupText.appendChild(document.createTextNode("PRESS 'BACK UP' TO RETURN"));
        var arrows = document.createElement("figure");
        arrows.id = "downUpArrow";
        genStatsMain.appendChild(footerArea).appendChild(backupText);
        footerArea.appendChild(arrows);
    }

    var populateSubMenuPage = function () {

        //add the menu to the breadcrum trail
        genStatsModel.setCurrentMenuType("submenu");
        var data = genStatsModel.getGenStatsData(genStatsModel.getCurrentTabIndex());
        var menuIndex = genStatsModel.getMenuIndex();
        var subMenuId = "submenu" + data["toplevel"]["data"]["items"][menuIndex]["data"];
        genStatsModel.setMenuLevel(subMenuId);
        var subMenuData = data[subMenuId];
        var menuLength = subMenuData["data"]["items"].length;
        genStatsModel.setNoOfMenuItems(menuLength);
        var genStatsMain = document.getElementById("genStatsMain");
        clearElement(genStatsMain);
        var menuUl = document.createElement("ul");
        genStatsMain.appendChild(menuUl);

        genStatsModel.setMenuIndex(0);

        for (var i = 0; i < menuLength; i++) {
            var menuItem = document.createElement("li");
            var menuBar = document.createElement("div");
            menuItem.className = "genStatsMenuItem";
            menuUl.appendChild(menuItem).appendChild(menuBar);
            var type = subMenuData["data"]["items"][i]["type"];
            if (type === "blank") {
                menuBar.innerHTML = "";
                menuBar.className = "genStatsMenuBar blankItem";
            } else {
                if (genStatsModel.getMenuIndex() == i) {
                    menuBar.className = "genStatsMenuBar selected";
                    menuBar.appendChild(document.createTextNode(subMenuData["data"]["items"][i]["data"]["title"]));
                } else {
                    menuBar.className = "genStatsMenuBar";
                    menuBar.appendChild(document.createTextNode(subMenuData["data"]["items"][i]["data"]["title"]));
                }
            }
        }
        //Footer
        var footerArea = document.createElement("div");
        footerArea.id = "genStatsFooter";
        var backupText = document.createElement("div");
        backupText.id = "genStatsStoryBackupTxt";
        backupText.appendChild(document.createTextNode("PRESS 'BACK UP' TO RETURN"));
        var arrows = document.createElement("figure");
        arrows.id = "downUpArrow";
        genStatsMain.appendChild(footerArea).appendChild(backupText);
        footerArea.appendChild(arrows);
    }

    var populateStoryPage = function () {
        var storyData = genStatsModel.getMenuItem(genStatsModel.getCurrentTabIndex(), genStatsModel.getMenuIndex());
        var genStatsMain = document.getElementById("genStatsMain");
        //clear the gen Stats Main data window
        clearElement(genStatsMain);

        //title area
        var storyTitle = document.createElement("div");
        storyTitle.id = "genStatsTitle";
        storyTitle.appendChild(document.createTextNode(storyData["title"]));
        genStatsMain.appendChild(storyTitle);
        //image area
        var imageArea = document.createElement("figure");
        imageArea.id = "genStatsStoryImage";
        imageArea.style.background = ("url(" + storyData["image"] + ")");
        genStatsMain.appendChild(imageArea);
        //Text Area
        var storyText = document.createElement("div");
        var spanArea = document.createElement("span");
        storyText.id = "genStatsScrollArea";
        storyText.className = "story";
        storyText.appendChild(spanArea).innerHTML = n2br(storyData["body"]);
        genStatsMain.appendChild(storyText);
        //Footer
        var footerArea = document.createElement("div");
        footerArea.id = "genStatsFooter";
        var backupText = document.createElement("div");
        backupText.id = "genStatsStoryBackupTxt";
        backupText.appendChild(document.createTextNode("PRESS 'BACK UP' TO RETURN"));
        var arrows = document.createElement("figure");
        arrows.id = "downUpArrow";
        genStatsMain.appendChild(footerArea).appendChild(backupText);
        footerArea.appendChild(arrows);
    }


    var populateProfilePage = function () {
        var profileData = genStatsModel.getMenuItem(genStatsModel.getCurrentTabIndex(), genStatsModel.getMenuIndex());
        var genStatsMain = document.getElementById("genStatsMain");
        //clear the gen Stats Main data window
        clearElement(genStatsMain);
        //title area
        var profileTitle = document.createElement("div");
        profileTitle.id = "genStatsTitle";
        profileTitle.appendChild(document.createTextNode(profileData["title"]));
        document.getElementById("genStatsMain").appendChild(profileTitle);
        //profile name
        var headerContainer = document.createElement("div");
        headerContainer.id = "genStatsHeaderContainer";
        headerContainer.className = "profile";
        //image area
        var imageArea = document.createElement("figure");
        imageArea.id = "genStatsProfileImage";
        imageArea.style.background = ("url(" + profileData["image"] + ")");
        genStatsMain.appendChild(imageArea);
        //scroll area
        var scrollArea = document.createElement("div");
        scrollArea.id = "genStatsScrollArea";
        scrollArea.className = "profile";
        genStatsMain.appendChild(scrollArea);
        //check if stats details are available
        if (typeof profileData["stats"] != "undefined") {
            var noOfRows = profileData["stats"].length;
            for (i = 0; i < noOfRows; i++) {
                var rowContainer = document.createElement("div");
                rowContainer.className = "tableRow";
                var rowColLeft = document.createElement("div");
                var rowColRight = document.createElement("div");
                rowColLeft.className = "leftCol";
                rowColRight.className = "rightCol";
                rowColLeft.appendChild(document.createTextNode(profileData["stats"][i]["title"]));
                rowColRight.appendChild(document.createTextNode(profileData["stats"][i]["body"]));
                rowContainer.appendChild(rowColLeft);
                rowContainer.appendChild(rowColRight);
                scrollArea.appendChild(rowContainer);
            }
        }

        //body text
        var scrollTextArea = document.createElement("div");
        scrollTextArea.className = "scrollText";
        scrollArea.appendChild(scrollTextArea).innerHTML = n2br(profileData["body"]);
        //Footer
        var footerArea = document.createElement("div");
        footerArea.id = "genStatsFooter";
        var backupText = document.createElement("div");
        backupText.id = "genStatsStoryBackupTxt";
        backupText.appendChild(document.createTextNode("PRESS 'BACK UP' TO RETURN"));
        var arrows = document.createElement("figure");
        arrows.id = "downUpArrow";
        genStatsMain.appendChild(footerArea).appendChild(backupText);
        footerArea.appendChild(arrows);
    }


    var populateTable1 = function () {
        var tableData = genStatsModel.getMenuItem(genStatsModel.getCurrentTabIndex(), genStatsModel.getMenuIndex());
        var genStatsMain = document.getElementById("genStatsMain");
        //clear the gen Stats Main data window
        clearElement(genStatsMain);
        //title area
        var tableTitle = document.createElement("div");
        tableTitle.id = "genStatsTitle";
        tableTitle.appendChild(document.createTextNode(tableData["title"]));
        genStatsMain.appendChild(tableTitle);
        //no player no
        var headerContainer = document.createElement("div");
        var headerLeft = document.createElement("div");
        var headerMid = document.createElement("div");
        var headerRight = document.createElement("div");
        headerContainer.id = "genStatsHeaderContainer";
        headerContainer.className = "table1";
        headerLeft.className = "leftCol";
        headerMid.className = "midCol";
        headerRight.className = "rightCol";
        var headerText = tableData["cols"].split(',');
        headerLeft.appendChild(document.createTextNode(headerText[0]));
        headerMid.appendChild(document.createTextNode(headerText[1]));
        headerRight.appendChild(document.createTextNode(headerText[2]));
        headerContainer.appendChild(headerLeft);
        headerContainer.appendChild(headerMid);
        headerContainer.appendChild(headerRight);
        genStatsMain.appendChild(headerContainer);
        //scroll area
        var scrollArea = document.createElement("div");
        scrollArea.id = "genStatsScrollArea";
        scrollArea.className = "table1";
        genStatsMain.appendChild(scrollArea);
        //no   playername points (repeat)
        var noOfRows = tableData["rows"].length;
        for (i = 0; i < noOfRows; i++) {
            var rowContainer = document.createElement("div");
            rowContainer.className = "tableRow";
            var rowColLeft = document.createElement("div");
            var rowColMid = document.createElement("div");
            var rowColRight = document.createElement("div");
            rowColLeft.className = "leftCol";
            rowColMid.className = "midCol";
            rowColRight.className = "rightCol";
            rowColLeft.appendChild(document.createTextNode(tableData["rows"][i]["v0"]));
            rowColMid.appendChild(document.createTextNode(tableData["rows"][i]["v1"]));
            rowColRight.appendChild(document.createTextNode(tableData["rows"][i]["v2"]));
            rowContainer.appendChild(rowColLeft);
            rowContainer.appendChild(rowColMid);
            rowContainer.appendChild(rowColRight);
            scrollArea.appendChild(rowContainer);
        }
        //Footer
        var footerArea = document.createElement("div");
        footerArea.id = "genStatsFooter";
        var backupText = document.createElement("div");
        backupText.id = "genStatsStoryBackupTxt";
        backupText.appendChild(document.createTextNode("PRESS 'BACK UP' TO RETURN"));
        var arrows = document.createElement("figure");
        arrows.id = "downUpArrow";
        genStatsMain.appendChild(footerArea).appendChild(backupText);
        footerArea.appendChild(arrows);

    }

    var populateTable2 = function () {
        var page = genStatsModel.getTable2Page();
        var tableData = genStatsModel.getMenuItem(genStatsModel.getCurrentTabIndex(), genStatsModel.getMenuIndex());
        //clear the gen Stats Sub data window
        var subMenuArea = document.getElementById("genStatsSub");
        clearElement(genStatsSub);

        var noOfRows = tableData["rows"].length;
        var noOfPages = Math.floor(noOfRows / 10);
        var remainder = noOfRows % 10;
        if (remainder > 0) {
            noOfPages++;
        }

        //assume that page starts at 0
        var dataRow = (page * 10);
        var loopIndex = 0;

        while (loopIndex < 10 && dataRow < noOfRows) {
            //   draw row containing data
            var rowContainer = document.createElement("div");
            rowContainer.className = "table2DataRow";
            var leftColumn = document.createElement("div");
            var rightColumn = document.createElement("div");
            leftColumn.className = "leftCol";
            rightColumn.className = "rightCol";
            leftColumn.appendChild(document.createTextNode(tableData["rows"][dataRow]["v0"]));
            rightColumn.appendChild(document.createTextNode(tableData["rows"][dataRow]["v1"]));
            rowContainer.appendChild(leftColumn);
            rowContainer.appendChild(rightColumn);
            subMenuArea.appendChild(rowContainer);
            dataRow++
            loopIndex++
        }



        page === (noOfPages - 1) ? page = 0 : page++;

        genStatsModel.setTable2Page(page);

        //Try and move the video underneath the sub stats window
        var channelManager = new ChannelManager();
        document.getElementById("genStatsSub").style.visibility = "visible";

    }

    var populateTable3 = function (page) {

        genStatsModel.setTable3Page(page);
        var tableData = genStatsModel.getTable3MenuItem(genStatsModel.getCurrentTabIndex(), genStatsModel.getMenuIndex());
        var genStatsMain = document.getElementById("genStatsMain");
        //clear the gen Stats Main data window
        clearElement(genStatsMain);

        //title area
        var tableTitle = document.createElement("div");
        tableTitle.id = "genStatsTitle";
        tableTitle.appendChild(document.createTextNode(tableData["data"]["title"]));
        genStatsMain.appendChild(tableTitle);
        //Top Half of Page
        var headerContainer = document.createElement("div");
        headerContainer.id = "genStatsHeaderContainer";
        headerContainer.className = "table3";
        var headerText = tableData["data"]["cols"].split(',');
        var column = document.createElement("div");
        column.className = "table3Col0";
        column.appendChild(document.createTextNode(headerText[0]));
        headerContainer.appendChild(column);
        if (page === 1) {
            for (var i = 1; i < 6; i++) {
                var column = document.createElement("div");
                column.className = "table3Col" + i;
                column.appendChild(document.createTextNode(headerText[i]));
                headerContainer.appendChild(column);
            }
        } else {
            for (var i = 6; i < 9; i++) {
                var column = document.createElement("div");
                column.className = "table3Col" + i;
                column.appendChild(document.createTextNode(headerText[i]));
                headerContainer.appendChild(column);
            }
        }
        genStatsMain.appendChild(headerContainer);
        var scrollArea = document.createElement("div");
        scrollAreaid = "genStatsScrollArea";
        scrollArea.className = "table3";
        genStatsMain.appendChild(scrollArea);
        var noOfRows = tableData["data"]["rows"].length;

        for (var i = 0; i < noOfRows; i++) {
            var rowContainer = document.createElement("div");
            rowContainer.className = "tableRow";
            var column = document.createElement("div");
            column.className = "table3Col0";
            column.appendChild(document.createTextNode(tableData["data"]["rows"][i]["v0"]));
            rowContainer.appendChild(column);
            if (page === 1) {
                for (var c = 1; c < 6; c++) {
                    var column = document.createElement("div");
                    column.className = "table3Col" + c;
                    column.appendChild(document.createTextNode(tableData["data"]["rows"][i]["v" + c]));
                    rowContainer.appendChild(column);
                }
            } else {
                for (c = 6; c < 9; c++) {
                    var column = document.createElement("div");
                    column.className = "table3Col" + c;
                    column.appendChild(document.createTextNode(tableData["data"]["rows"][i]["v" + c]));
                    rowContainer.appendChild(column);
                }
            }
            scrollArea.appendChild(rowContainer);
        }

        //Centre section
        var messageBox = document.createElement("div");
        messageBox.id = "genStatsMessageBox";
        messageBox.className = "table3";
        messageBox.appendChild(document.createTextNode("PRESS SELECT FOR MORE TABLE OPTIONS"));
        scrollArea.appendChild(messageBox);

        //Bottom section
        var midHeader = document.createElement("div");
        midHeader.id = "genStatsMidHeaderContainer";
        midHeader.className = "table3";
        midHeader.appendChild(document.createTextNode(tableData["fixtures"]["title"]));
        scrollArea.appendChild(midHeader);

        var noOfGroups = tableData["fixtures"]["groups"].length;

        for (i = 0; i < noOfGroups; i++) {
            var subHeader = document.createElement("div");
            subHeader.className = "genStatsBottomHeader";
            subHeader.appendChild(document.createTextNode(tableData["fixtures"]["groups"][i]["title"]));
            scrollArea.appendChild(subHeader);
            for (j = 0; j < 2; j++) {
                var rowContainer = document.createElement("div");
                rowContainer.className = "tableRow";
                var rowColLeft = document.createElement("div");
                var rowColMid = document.createElement("div");
                var rowColRight = document.createElement("div");
                rowColLeft.className = "leftCol";
                rowColMid.className = "midCol";
                rowColRight.className = "rightCol";
                rowColLeft.appendChild(document.createTextNode(tableData["fixtures"]["groups"][i]["games"][j]["v0"]));
                rowColMid.appendChild(document.createTextNode(tableData["fixtures"]["groups"][i]["games"][j]["v1"]));
                rowColRight.appendChild(document.createTextNode(tableData["fixtures"]["groups"][i]["games"][j]["v2"]));
                rowContainer.appendChild(rowColLeft);
                rowContainer.appendChild(rowColMid);
                rowContainer.appendChild(rowColRight);
                scrollArea.appendChild(rowContainer);
            }

        }


    }

    var populateTable4 = function () {
        var tableData = genStatsModel.getMenuItem(genStatsModel.getCurrentTabIndex(), genStatsModel.getMenuIndex());
        var genStatsMain = document.getElementById("genStatsMain");
        //clear the gen Stats Main data window
        clearElement(genStatsMain);
        //title area
        var tableTitle = document.createElement("div");
        tableTitle.id = "genStatsTitle";
        tableTitle.appendChild(document.createTextNode(tableData["title"]));
        genStatsMain.appendChild(tableTitle);
        //no player no
        var headerContainer = document.createElement("div");
        var headerLeft = document.createElement("div");
        var headerRight = document.createElement("div");
        headerContainer.id = "genStatsHeaderContainer";
        headerContainer.className = "table4";
        headerLeft.className = "leftCol";
        headerRight.className = "rightCol";
        var headerText = tableData["cols"].split(',');
        headerLeft.appendChild(document.createTextNode(headerText[0]));
        headerRight.appendChild(document.createTextNode(headerText[1]));
        headerContainer.appendChild(headerLeft);
        headerContainer.appendChild(headerRight);
        genStatsMain.appendChild(headerContainer);
        //scroll area
        var scrollArea = document.createElement("div");
        scrollArea.id = "genStatsScrollArea";
        scrollArea.className = "table4";
        genStatsMain.appendChild(scrollArea);
        //no   playername points (repeat)
        var noOfRows = tableData["rows"].length;
        for (i = 0; i < noOfRows; i++) {
            var rowContainer = document.createElement("div");
            rowContainer.className = "tableRow";
            var rowColLeft = document.createElement("div");
            var rowColRight = document.createElement("div");
            rowColLeft.className = "leftCol";
            rowColRight.className = "rightCol";
            rowColLeft.appendChild(document.createTextNode(tableData["rows"][i]["v0"]));
            rowColRight.appendChild(document.createTextNode(tableData["rows"][i]["v1"]));
            rowContainer.appendChild(rowColLeft);
            rowContainer.appendChild(rowColRight);
            scrollArea.appendChild(rowContainer);
        }
        //Footer
        var footerArea = document.createElement("div");
        footerArea.id = "genStatsFooter";
        var backupText = document.createElement("div");
        backupText.id = "genStatsStoryBackupTxt";
        backupText.appendChild(document.createTextNode("PRESS 'BACK UP' TO RETURN"));
        var arrows = document.createElement("figure");
        arrows.id = "downUpArrow";
        genStatsMain.appendChild(footerArea).appendChild(backupText);
        footerArea.appendChild(arrows);
    }

    var populateTable5 = function () {
        var tableData = genStatsModel.getMenuItem(genStatsModel.getCurrentTabIndex(), genStatsModel.getMenuIndex());
        var genStatsMain = document.getElementById("genStatsMain");
        //clear the gen Stats Main data window
        clearElement(genStatsMain);
        //title area
        var tableTitle = document.createElement("div");
        tableTitle.id = "genStatsTitle";
        tableTitle.appendChild(document.createTextNode(tableData["title"]));
        genStatsMain.appendChild(tableTitle);
        //no player no
        var headerContainer = document.createElement("div"),
            headerLeft = document.createElement("div"),
            headerMid = document.createElement("div"),
            headerRight = document.createElement("div"),
            headerRight2 = document.createElement("div");
        headerContainer.id = "genStatsHeaderContainer";
        headerContainer.className = "table5";
        headerLeft.className = "leftCol";
        headerMid.className = "midCol";
        headerRight.className = "rightCol";
        headerRight2.className = "right2Col";
        var headerText = tableData["cols"].split(',');
        headerLeft.appendChild(document.createTextNode(headerText[0]));
        headerMid.appendChild(document.createTextNode(headerText[1]));
        headerRight.appendChild(document.createTextNode(headerText[2]));
        headerRight2.appendChild(document.createTextNode(headerText[3]));
        headerContainer.appendChild(headerLeft);
        headerContainer.appendChild(headerMid);
        headerContainer.appendChild(headerRight);
        headerContainer.appendChild(headerRight2);
        genStatsMain.appendChild(headerContainer);
        //scroll area
        var scrollArea = document.createElement("div");
        scrollArea.id = "genStatsScrollArea";
        scrollArea.className = "table5";
        genStatsMain.appendChild(scrollArea);
        //no   playername points (repeat)
        var noOfRows = tableData["rows"].length;
        for (i = 0; i < noOfRows; i++) {
            var rowContainer = document.createElement("div");
            rowContainer.className = "tableRow";
            var rowColLeft = document.createElement("div");
            var rowColMid = document.createElement("div");
            var rowColRight = document.createElement("div");
            var rowColRight2 = document.createElement("div");
            rowColLeft.className = "leftCol";
            rowColMid.className = "midCol";
            rowColRight.className = "rightCol";
            rowColRight2.className = "right2Col";
            rowColLeft.appendChild(document.createTextNode(tableData["rows"][i]["v0"]));
            rowColMid.appendChild(document.createTextNode(tableData["rows"][i]["v1"]));
            rowColRight.appendChild(document.createTextNode(tableData["rows"][i]["v2"]));
            rowColRight2.appendChild(document.createTextNode(tableData["rows"][i]["v3"]));
            rowContainer.appendChild(rowColLeft);
            rowContainer.appendChild(rowColMid);
            rowContainer.appendChild(rowColRight);
            rowContainer.appendChild(rowColRight2);
            scrollArea.appendChild(rowContainer);
        }
        //Footer
        var footerArea = document.createElement("div");
        footerArea.id = "genStatsFooter";
        var backupText = document.createElement("div");
        backupText.id = "genStatsStoryBackupTxt";
        backupText.appendChild(document.createTextNode("PRESS 'BACK UP' TO RETURN"));
        var arrows = document.createElement("figure");
        arrows.id = "downUpArrow";
        genStatsMain.appendChild(footerArea).appendChild(backupText);
        footerArea.appendChild(arrows);
    }

    var populateTable6 = function () {
        var tableData = genStatsModel.getMenuItem(genStatsModel.getCurrentTabIndex(), genStatsModel.getMenuIndex());
        var genStatsMain = document.getElementById("genStatsMain");
        //clear the gen Stats Main data window
        clearElement(genStatsMain);
        //title area
        var tableTitle = document.createElement("div");
        tableTitle.id = "genStatsTitle";
        tableTitle.appendChild(document.createTextNode(tableData["title"]));
        genStatsMain.appendChild(tableTitle);
        //scroll area
        var scrollArea = document.createElement("div");
        scrollArea.id = "genStatsScrollArea";
        scrollArea.className = "table6";
        genStatsMain.appendChild(scrollArea);
        //no   playername points (repeat)
        var noOfGroups = tableData["groups"].length;
        for (n = 0; n < noOfGroups; n++) {

            var groupHeader = document.createElement("div");
            groupHeader.className = "genStatsGroupHeader table6";
            groupHeader.appendChild(document.createTextNode(tableData["groups"][n]["title"]));
            scrollArea.appendChild(groupHeader);

            var noOfGames = tableData["groups"][n]["games"].length;
            for (i = 0; i < noOfGames; i++) {
                var rowContainer = document.createElement("div");
                rowContainer.className = "tableRow";
                var rowColLeft = document.createElement("div");
                var rowColMid = document.createElement("div");
                var rowColRight = document.createElement("div");
                rowColLeft.className = "leftCol";
                rowColMid.className = "midCol";
                rowColRight.className = "rightCol";
                rowColLeft.appendChild(document.createTextNode(tableData["groups"][n]["games"][i]["v0"]));
                rowColMid.appendChild(document.createTextNode(tableData["groups"][n]["games"][i]["v1"]));
                rowColRight.appendChild(document.createTextNode(tableData["groups"][n]["games"][i]["v2"]));
                rowContainer.appendChild(rowColLeft);
                rowContainer.appendChild(rowColMid);
                rowContainer.appendChild(rowColRight);
                scrollArea.appendChild(rowContainer);
            }
        }
        //Footer
        var footerArea = document.createElement("div");
        footerArea.id = "genStatsFooter";
        var backupText = document.createElement("div");
        backupText.id = "genStatsStoryBackupTxt";
        backupText.appendChild(document.createTextNode("PRESS 'BACK UP' TO RETURN"));
        var arrows = document.createElement("figure");
        arrows.id = "downUpArrow";
        genStatsMain.appendChild(footerArea).appendChild(backupText);
        footerArea.appendChild(arrows);

    }


    /*
     * GenStats Loader
     * @PARAM rtu - true  : invoked by Real Time Updater so background AJAX load required
     *              false : SJAX load required
     * @PARAM url - URL of generic stats data
     * @PARAM index - index of generic stats
     */

    self.loadGenStats = function (rtu, url, index) {
        jsLoad = rtu ? new AJAXjsonLoader() : new SJAXjsonLoader;

        jsLoad.loadJSON(url + "?" + randNum.giveMeARandomNum(),
            function (data) {
                //maybe use a data ready flag ???
                genStatsModel.setGenStatsData(data, index);
                return;
            },
            function (jsonHR) {
                vmDtvLib.dax.trackError(jsonHR, "JSON Load error " + url);
                console.error("UH OH!!! -> " + jsonHR);
            }
        );
    };

    this.statsController = function (keyCode) {
        if (sportsAppModel.getKeyPressEnabled()) {
            var currentMenuType = genStatsModel.getCurrentMenuType();
            switch (keyCode) {

            case 37: //left
                var noOfTabs = genStatsModel.getNoOfTabs();
                var currentTabIndex = genStatsModel.getCurrentTabIndex();
                currentTabIndex == 1 ? currentTabIndex = noOfTabs : currentTabIndex--;
                genStatsModel.setCurrentTabIndex(currentTabIndex);
                vmDtvLib.dax.pageChange("Generic Stats Tab " + currentTabIndex, "left-button");
                self.buildStatsPage(currentTabIndex);
                break;

            case 39: //right
                var noOfTabs = genStatsModel.getNoOfTabs();
                var currentTabIndex = genStatsModel.getCurrentTabIndex();
                currentTabIndex == noOfTabs ? currentTabIndex = 1 : currentTabIndex++;
                genStatsModel.setCurrentTabIndex(currentTabIndex);
                vmDtvLib.dax.pageChange("Generic Stats Tab " + currentTabIndex, "right-button");
                self.buildStatsPage(currentTabIndex);

                break;

            case 38: //up
                if (currentMenuType === "menu" || currentMenuType === "submenu") {
                    //This is incremented for every blank menu item so we know 
                    //how many places to miss out during navigation
                    var jumpCount = 0;
                    var currItem = genStatsModel.getMenuIndex();
                    var listItem = document.querySelectorAll('.genStatsMenuBar');


                    if (currItem > 0) {
                        while (listItem[currItem - 1].classList.contains('blankItem')) { //jump the blank rows
                            currItem--;
                            jumpCount++;
                        }
                        currItem--;
                        genStatsModel.setMenuIndex(currItem);
                        listItem[currItem + (1 + jumpCount)].classList.remove('selected');
                        listItem[currItem].classList.add('selected');

                        var tabIndex = genStatsModel.getCurrentTabIndex();
                        var thisMenuType = genStatsModel.getMenuType(tabIndex, currItem);

                        if (thisMenuType === "table2") {
                            var vidArea = document.getElementById("vidArea");
                            vidArea.style.zIndex = 8;
                            genStatsModel.setTable2Page(0);
                            populateTable2();
                            break;
                        } else {
                            var vidArea = document.getElementById("vidArea");
                            vidArea.style.zIndex = 20;
                            document.getElementById("genStatsSub").style.visibility = "hidden";

                        }
                    }

                } else if (
                    currentMenuType === "story" ||
                    currentMenuType === "table1" ||
                    currentMenuType === "table4" ||
                    currentMenuType === "table5" ||
                    currentMenuType === "table6" ||
                    currentMenuType === "profile"
                ) {

                    var scrollArea = document.getElementById("genStatsScrollArea");
                    //scroll the text area by 50 pixels
                    scrollArea.scrollTop -= 50;

                }

                break;


            case 40: //down

                if (currentMenuType === "menu" || currentMenuType === "submenu") {
                    //This is incremented for every blank menu item so we know 
                    //how many places to miss out during navigation
                    var jumpCount = 0;
                    var currItem = genStatsModel.getMenuIndex();
                    var listItem = document.querySelectorAll('.genStatsMenuBar');
                    if (currItem < (genStatsModel.getNoOfMenuItems() - 1)) {
                        while (listItem[currItem + 1].classList.contains('blankItem')) { //jump the blank rows
                            currItem++;
                            jumpCount++;
                        }
                        currItem++;
                        genStatsModel.setMenuIndex(currItem);
                        listItem[currItem - (1 + jumpCount)].classList.remove('selected');
                        listItem[currItem].classList.add('selected');

                        var tabIndex = genStatsModel.getCurrentTabIndex();
                        var thisMenuType = genStatsModel.getMenuType(tabIndex, currItem);

                        if (thisMenuType === "table2") {
                            var vidArea = document.getElementById("vidArea");
                            vidArea.style.zIndex = 8;
                            genStatsModel.setTable2Page(0);
                            populateTable2();
                            break;
                        } else {
                            var vidArea = document.getElementById("vidArea");
                            vidArea.style.zIndex = 20;
                            document.getElementById("genStatsSub").style.visibility = "hidden";

                        }
                    }
                } else if (
                    currentMenuType === "story" ||
                    currentMenuType === "table1" ||
                    currentMenuType === "table4" ||
                    currentMenuType === "table5" ||
                    currentMenuType === "table6" ||
                    currentMenuType === "profile"
                ) {
                    var scrollArea = document.getElementById("genStatsScrollArea");
                    //scroll the text area by 50 pixels
                    scrollArea.scrollTop += 50;
                }

                break;
            case 13:
                //enter-return key
                var tabIndex = genStatsModel.getCurrentTabIndex();
                var menuIndex = genStatsModel.getMenuIndex();
                var currMenuType = genStatsModel.getCurrentMenuType();
                var thisMenuType = genStatsModel.getMenuType(tabIndex, menuIndex);
                if (currMenuType === "menu" || currMenuType === "submenu") {
                    if (thisMenuType !== "table2") {
                        genStatsModel.setCurrentMenuType(thisMenuType);
                    }
                    switch (thisMenuType) {
                    case "menu":
                        vmDtvLib.dax.pageChange("Generic Stats Menu", "ok-button");
                        populateMenuPage();
                        break;
                    case "submenu":
                        vmDtvLib.dax.pageChange("Generic Stats Submenu", "ok-button");
                        genStatsModel.pushBreadcrum(genStatsModel.getMenuIndex());
                        populateSubMenuPage();
                        break;
                    case "story":
                        vmDtvLib.dax.pageChange("Generic Stats Story", "ok-button");
                        populateStoryPage();
                        break;
                    case "profile":
                        vmDtvLib.dax.pageChange("Generic Stats Profile", "ok-button");
                        populateProfilePage();
                        break;
                    case "table1":
                        vmDtvLib.dax.pageChange("Generic Stats Table type 1", "ok-button");
                        populateTable1();
                        break;
                    case "table2":
                        vmDtvLib.dax.pageChange("Generic Stats Table type 2", "ok-button");
                        populateTable2();
                        break;
                    case "table3":
                        vmDtvLib.dax.pageChange("Generic Stats Table type 3", "ok-button");
                        populateTable3(1);
                        break;
                    case "table4":
                        vmDtvLib.dax.pageChange("Generic Table type 4", "ok-button");
                        populateTable4();
                        break;
                    case "table5":
                        vmDtvLib.dax.pageChange("Generic Stats Table type 5", "ok-button");
                        populateTable5();
                        break;
                    case "table6":
                        vmDtvLib.dax.pageChange("Generic Stats Table type 6", "ok-button");
                        populateTable6();
                        break;

                    }
                } else if (currMenuType === "table3") {
                    var page = genStatsModel.getTable3Page();
                    page === 1 ? page = 2 : page = 1;
                    vmDtvLib.dax.pageChange("Generic Stats Table type 3 page " + page, "ok-button");
                    populateTable3(page);
                }

                break;
            case 66:
                //backup
                var tabIndex = genStatsModel.getCurrentTabIndex();
                var menuIndex = genStatsModel.getMenuIndex();
                var currMenuType = genStatsModel.getCurrentMenuType();
                var videoMenu = new VideoMenu();

                if (currMenuType === "menu") {
                    var videoMenu = new VideoMenu();
                    var OSD = document.getElementById("OSD");
                    var gsc = document.getElementById("genStatsContainer");
                    OSD.removeChild(gsc);

                    //Back up to Fullscreen video or video Menu
                    if (sportsAppModel.getLastFocus() === "fullscreen") {
                        sportsAppModel.setCurrentFocus("fullscreen");
                        channelManager.showFullScreen();
                        vmDtvLib.dax.pageChange("Full Screen Video", "back-button");
                        videoMenu.fullScreen(channelManagerModel.getCurrentChannel(), channelManagerModel.getCurrentAudio());
                    } else {
                        sportsAppModel.setCurrentFocus("videoMenu");
                        videoMenu.loadVideoMenu();
                        channelManager.showFullScreen();
                        vmDtvLib.dax.pageChange("Video Menu 0", "back-button");
                        videoMenu.init(0);
                    }
                } else {
                    vmDtvLib.dax.pageChange("Generic Stats Menu", "back-button");
                    populateTopLevelMenu(genStatsModel.getCurrentTabIndex());
                }
                break;
            case 27:
                //backup
                var tabIndex = genStatsModel.getCurrentTabIndex();
                var menuIndex = genStatsModel.getMenuIndex();
                var currMenuType = genStatsModel.getCurrentMenuType();
                var videoMenu = new VideoMenu();


                if (currMenuType === "menu") {
                    var OSD = document.getElementById("OSD");
                    OSD.removeChild(document.getElementById("genStatsContainer"));
                    //Back up to Fullscreen video or video Menu
                    if (sportsAppModel.getLastFocus() === "fullscreen") {
                        sportsAppModel.setCurrentFocus("fullscreen");
                        channelManager.showFullScreen();
                        vmDtvLib.dax.pageChange("Full Screen Video", "back-button");
                        videoMenu.fullScreen(channelManagerModel.getCurrentChannel(), channelManagerModel.getCurrentAudio());
                    } else {
                        sportsAppModel.setCurrentFocus("videoMenu");
                        videoMenu.loadVideoMenu();
                        channelManager.showFullScreen();
                        vmDtvLib.dax.pageChange("Video Menu 0", "back-button");
                        videoMenu.init(0);
                    }
                } else {
                    vmDtvLib.dax.pageChange("Generic Stats Menu", "back-button");
                    populateTopLevelMenu(genStatsModel.getCurrentTabIndex());
                }
                break;
            default:
                break;
            }
        }

    };

    self.init = function (tabIndex) {

        var chanMan = new ChannelManager();
        self.loadGenStats(false, GENSTATS_URL, 0);

        var iMenu = new Imenu();
        iMenu.hideAudioIcon();
        iMenu = null;

        genStatsModel.setCurrentTabIndex(tabIndex);

        //load tab data
        var noOfTabs = genStatsModel.getNoOfTabs();
        for (i = 1; i < (noOfTabs + 1); i++) {
            self.loadGenStats(false, "stats/tab" + i + ".json", i);
        }
        self.buildStatsPage(tabIndex);


        //populate current stats window

        //build 
        //sportsAppModel.setLastFocus(sportsAppModel.getCurrentFocus());
        sportsAppModel.setCurrentFocus("stats");
        chanMan.showStatsVideo();
    };


}

/*************************************
 * Neil Cooper x4703
 * November 2015
 *************************************/
var HelpPopup = function () {

    var HELP_URL = "helptextdata.json",
        randNum = new RandomURLNum(), // new random number gen object
        self = this;

    /*
     * buildHelpPopup
     *
     * @desc creates the HTML elements and sets attributes required for the help Popup
     *
     */
    self.buildHelpPopup = function () {

        var helpContainer = document.getElementById("helpContainer");

        //If the help container div doesn't exist, we had better create one
        if (!helpContainer) {
            var helpText = helpModel.getHelpDataText();
            var OSD = document.getElementById('OSD');
            helpContainer = document.createElement("div");
            var helpTextArea = document.createElement("article");
            var helpSpan = document.createElement("span");
            var upArrow = document.createElement("figure");
            var downArrow = document.createElement("figure");
            helpContainer.id = "helpContainer";
            helpTextArea.id = "helpTextArea";
            upArrow.className = "helpArrow";
            upArrow.id = "helpUpArrow";
            downArrow.className = "helpArrow";
            downArrow.id = "helpDownArrow";
            helpContainer.appendChild(helpTextArea).appendChild(helpSpan);
            helpContainer.appendChild(upArrow);
            helpContainer.appendChild(downArrow);
            helpText += ("\n\nApp Version: " + version + "\n\nCommon Version: " + commonVersion);
            helpTextArea.firstChild.innerHTML = n2br(helpText);
            //hide the up/down arrows and the help popup
            upArrow.style.visibility = "hidden";
            downArrow.style.visibility = "hidden";
            helpContainer.style.visibility = "hidden";
            helpTextArea.style.visibility = "inherit";

            //append the help popup to the OSD container
            OSD.appendChild(helpContainer);
            helpContainer = null;
            helpTextArea = null;
            helpSpan = null;
            upArrow = null;
            downArrow = null;
        }

    }

    /*
     * showHelpPopup
     *
     * @desc Displays the Help popup by setting it's component parts 
     * visibility style to visible. It then checks to see if the
     * up/down arrows need to be displayed.
     */
    self.showHelpPopup = function () {
        var helpContainer = document.getElementById("helpContainer");
        var scrollArea = document.getElementById("helpTextArea");

        // Make sure that the help text is displaying from the top down when popup is displayed.
        scrollArea.scrollTop = 0;
        // Show the help popup container
        helpContainer.style.visibility = "visible";
        // Check if arrow icons need to be displayed
        checkArrowDisplay();
    };

    /*
     * hideHelpPopup
     *
     * @desc Hides the Help popup by setting it's component parts 
     * visibility style to hidden
     */
    self.hideHelpPopup = function () {
        //set the focus to the last focused scene
        sportsAppModel.setCurrentFocus(sportsAppModel.getLastFocus());
        var debug = document.getElementById("debugArea");
        debug.innerHTML = sportsAppModel.getCurrentFocus();
        var helpContainer = document.getElementById("helpContainer");
        var upArrow = document.getElementById("helpUpArrow");
        var downArrow = document.getElementById("helpDownArrow");
        // Hide the arrow icons and help popup container
        upArrow.style.visibility = "hidden";
        downArrow.style.visibility = "hidden";
        helpContainer.style.visibility = "hidden";
        return;
    };

    /*
     * helpController
     *
     * @desc handles remote control requests
     *
     * @param keycode - code of button pressed on remote control
     */
    self.helpController = function (keyCode) {
        var scrollval;

        switch (keyCode) {

        case 38:
            //up
            var scrollArea = document.getElementById("helpTextArea");
            //scroll the text area by 50 pixels
            scrollArea.scrollTop -= 50;
            //check to see if arrow icons require displaying
            checkArrowDisplay();
            break;
        case 40:
            //down
            var scrollArea = document.getElementById("helpTextArea");
            //scroll the text area by 50 pixels
            scrollArea.scrollTop += 50;
            //check to see if arrow icons require displaying
            checkArrowDisplay();
            break;
        case 27: //backup
            //close the popup
            self.hideHelpPopup();
            vmDtvLib.dax.pageChange(sportsAppModel.getLastFocus(), "back-button");
            break;
        case 66: // B button on keyboard
            //close the popup
            self.hideHelpPopup();
            vmDtvLib.dax.pageChange(sportsAppModel.getLastFocus(), "back-button");
            break;
        }
    };

    /* checkArrowDisplay
     *
     * @desc Displays and UP arrow icon if you can scroll up and
     * a DOWN arrow icon if you can scroll down.
     *
     */
    checkArrowDisplay = function () {
        //Get the required screen elements
        var scrollArea = document.getElementById("helpTextArea");
        var upArrow = document.getElementById("helpUpArrow");
        var downArrow = document.getElementById("helpDownArrow");

        //check to see if you can scroll up
        if (scrollArea.scrollHeight > scrollArea.clientHeight) {
            if (scrollArea.scrollTop > 0) {
                upArrow.style.visibility = "visible"; //display UP arrow
            } else {
                upArrow.style.visibility = "hidden"; //hide UP arrow
            }
            //check to see if you can scroll down
            if (scrollArea.scrollHeight > (scrollArea.scrollTop + scrollArea.clientHeight)) {
                downArrow.style.visibility = "visible"; //display DOWN arrow
            } else {
                downArrow.style.visibility = "hidden"; //hide DOWN arrow
            }
        }
    };

    /* n2br
     *
     * @desc This is a small function that converts \n newlines to <br/> in a string
     *
     */

    n2br = function (string) {
        this.str = string;
        this.str = this.str.replace(/(?:\r\n|\r|\n)/g, '<br />'); //string conversion
        return this.str;
    };


    /*
     * loadHelpText
     *
     * @desc Loads the help text JSON file data. 
     *
     * @PARAM rtu - true if request comes from the RTU. If true, AJAX is used
     */
    self.loadHelpText = function (rtu) {
        //Only use AJAX if called by rtu
        var jsLoad = rtu ? new AJAXjsonLoader() : new SJAXjsonLoader();
        var jsonFile = HELP_URL + "?" + randNum.giveMeARandomNum();

        jsLoad.loadJSON(jsonFile,
            function (data) {
                //store the help text JSON Data
                helpModel.setHelpData(data);
                return;
            },
            function (jsonHR) {
                vmDtvLib.dax.trackError(jsonHR, "JSON Load error " + HELP_URL);
                console.error("UH OH!!! -> " + jsonHR);
            }
        );
    }


}

/***************************************
 * ...
 * Neil Cooper
 * OTT & Mobile Core Products
 * October 2015
 *
 * href - handles href data from JSON files
 */
var Href = function () {

    var TYPESTRING_SCREEN = "screen://";
    var TYPESTRING_VIDEOMENU = "matrix://";
    var TYPESTRING_MENU = "menu://";
    var TYPESTRING_STATS = "stats://";
    var TYPESTRING_ALERT = "alert://";
    var TYPESTRING_TICKER = "ticker://";
    var TYPESTRING_TIVOHELP = "help://";
    var TYPESTRING_DRAW = "draw://";
    var TYPE_SCREEN = 0;
    var TYPE_VIDEOMENU = 1;
    var TYPE_STATS = 2;
    var TYPE_ALERT = 3;
    var TYPE_SUBMENU = 4;
    var TYPE_HELP = 5;
    var TYPE_TICKER = 6;
    var TYPE_DRAW = 7;

    this.getType = function (href) {
        if (href.indexOf(TYPESTRING_SCREEN) === 0) {
            return TYPE_SCREEN;
        } else if (href.indexOf(TYPESTRING_VIDEOMENU) === 0) {
            return TYPE_VIDEOMENU;
        } else if (href.indexOf(TYPESTRING_STATS) === 0) {
            return TYPE_STATS;
        } else if (href.indexOf(TYPESTRING_ALERT) === 0) {
            return TYPE_ALERT;
        } else if (href.indexOf(TYPESTRING_MENU) === 0) {
            return TYPE_SUBMENU;
        } else if (href.indexOf(TYPESTRING_TIVOHELP) === 0) {
            return TYPE_HELP;
        } else if (href.indexOf(TYPESTRING_TICKER) === 0) {
            return TYPE_TICKER;
        } else if (href.indexOf(TYPESTRING_DRAW) === 0) {
            return TYPE_DRAW;
        } else if (href.indexOf(TYPESTRING_TIVOHELP) === 0) {
            return TYPE_HELP;
        }
    }

    this.getVideoEncoder = function (href) {
        var videoEncoder;
        var encoderStringLength = 3;
        var startIndex = href.indexOf("v=") + 2; // 2 is the length of v=

        videoEncoder = href.substr(startIndex, encoderStringLength);

        return videoEncoder;
    }

    this.getAudioId = function (href) {
        var audioId;
        var audioStringLength = 1;
        var startIndex = href.indexOf("a=") + 2; // 2 is the length of a=

        audioId = href.substr(startIndex, audioStringLength);

        return audioId;
    }

    this.getVideoMenu = function (href) {
        var videoMenuNum,
            startIndex = href;

        var startIndex = href.indexOf("VIDEO_MENU") + "VIDEO_MENU".length;
        var videoMenuNum = Number(href.substr(startIndex, 1));

        return videoMenuNum;
    }

    this.getAlertsFlag = function (href) {
        var startIndex = href.indexOf(TYPESTRING_ALERT) + TYPESTRING_ALERT.length;
        var alertsFlag = href.substr(startIndex);

        return alertsFlag;
    }

    this.getTabIndex = function (href) {
        var stringStartIndex = 11;
        var stringEndIndex = 15;

        var tabIndex = parseInt(href.substr(stringStartIndex, stringEndIndex));

        return tabIndex;
    }

    this.getDrawIndex = function (href) {
        var startIndex = href.indexOf(TYPESTRING_DRAW) + TYPESTRING_DRAW.length;
        var drawIndex = Number(href.substr(startIndex + 4, 1));
        return drawIndex;
    }

    this.getSubMenuName = function (href) {

        var startIndex = href.indexOf(TYPESTRING_MENU) + TYPESTRING_MENU.length;
        var menuName = href.substr(startIndex);

        return menuName;

    }

    this.getTickerIndex = function (href) {
        var startIndex = href.indexOf(TYPESTRING_TICKER) + TYPESTRING_TICKER.length;
        var tickerIndex = href.substr(startIndex);
        //store the value in the ticker model
        tickerModel.setTickerIndex(tickerIndex);

        return tickerIndex;

    }

    this.hrefHandler = function (href, obj) {
        var hrefType = this.getType(href)


        switch (hrefType) {
        case TYPE_SCREEN:
            //"screen://v=181&a=0"

            var videoMenu = new VideoMenu();
            var iMenu = new Imenu();
            var encoder = this.getVideoEncoder(href);
            var audio = this.getAudioId(href);
            videoMenuModel.setCurrMenuAudio(audio); //Store the current audio in the video menu model for use in multi audio toggles
            // close imenu if open
            if (iMenuModel.getImenuStatus()) {
                iMenu.closeImenu();
            }
            //Remove Draw Stats if displayed
            console.log("TYPE_SCREEN: " + sportsAppModel.getCurrentFocus());
            if (drawStatsModel.getCurrentStatus()) {
                var OSD = document.getElementById("OSD");
                var drawContainer = document.getElementById("drawContainer");
                if (drawContainer) {
                    OSD.removeChild(drawContainer);
                }
            }
            //Call VideoMenu to set Full Screen Video with (hrefEncoder, hrefAudioIndex);
            vmDtvLib.dax.pageChange("Full Screen Video", "ok-button");
            videoMenu.fullScreen(encoder, audio);
            break;

        case TYPE_VIDEOMENU:
            //"matrix://VIDEO_MENU0"

            var iMenu = new Imenu();
            var videoMenu = new VideoMenu();
            var videoMenuNum = this.getVideoMenu(href);
            // Call VideoMenu to set the video menu as (videoMenuNum);
            vmDtvLib.dax.pageChange("Video Menu " + videoMenuNum, "ok-button");
            videoMenuModel.setOindex(0);
            console.log("TYPE_VIDEOMENU: " + sportsAppModel.getCurrentFocus());
            if (drawStatsModel.getCurrentStatus()) {
                var OSD = document.getElementById("OSD");
                var drawContainer = document.getElementById("drawContainer");
                if (drawContainer) {
                    OSD.removeChild(drawContainer);
                }
            }
            // close imenu if open
            if (iMenuModel.getImenuStatus()) {
                iMenu.closeImenu();
            }
            videoMenu.init(videoMenuNum);
            break;

        case TYPE_ALERT:
            //"alert://1"
            var iMenu = new Imenu();
            var alertsFlag = this.getAlertsFlag(href);
            alertsFlag === "0" ? iMenuModel.setAlertStatus(false) : iMenuModel.setAlertStatus(true);
            iMenuModel.setTickItemFlag(true);
            iMenu.populateMenu();
            break;

        case TYPE_STATS:
            //"stats://TAB0"
            // close imenu if open
            var iMenu = new Imenu();
            //close draw stats if open
            var OSD = document.getElementById("OSD");
            var drawContainer = document.getElementById("drawContainer");
            if (drawContainer) {
                OSD.removeChild(drawContainer);
            }
            var tabIndex = this.getTabIndex(href);
            if (iMenuModel.getImenuStatus()) {
                iMenu.closeImenu();
            }
            var genStats = new GenStats();
            vmDtvLib.dax.pageChange("Generic Stats Tab " + (tabIndex + 1), "ok-button");
            genStats.init(tabIndex + 1);
            OSD = null;
            drawContainer = null;
            break;

        case TYPE_DRAW:
            //"draw://0"
            var iMenu = new Imenu();
            var channelManager = new ChannelManager();
            var drawStats = new DrawStats();
            var drawIndex = this.getDrawIndex(href);

            //hide the video
            channelManager.hideVideo();

            //close iMenu if open
            if (iMenuModel.getImenuStatus()) {
                iMenu.closeImenu();
            }
            var OSD = document.getElementById("OSD");
            var statsContainer = document.getElementById("genStatsContainer");
            if (statsContainer) {
                OSD.removeChild(statsContainer);
            }

            //drawStats.populate(drawIndex);
            vmDtvLib.dax.pageChange("Draw Stats " + drawIndex, "ok-button");
            drawStats.init(drawIndex);

            OSD = null;
            channelManager = null;
            iMenu = null;
            drawStats = null;

            break;

        case TYPE_SUBMENU:
            //"menu://SUBMENU5"
            var iMenu = new Imenu();
            //store the previous
            obj.pushBreadcrum(obj.getMenuId());
            var menuName = this.getSubMenuName(href);
            obj.setMenuId(menuName);
            obj.setMenuIndex(obj.returnMenuId(menuName));
            //display the new menu
            iMenu.buildMenu();
            break;

        case TYPE_HELP:
            //"help://"
            var iMenu = new Imenu();
            var help = new HelpPopup();
            if (iMenuModel.getImenuStatus()) {
                iMenu.closeImenu();
            }
            //sportsAppModel.setLastFocus(sportsAppModel.getCurrentFocus());
            sportsAppModel.setCurrentFocus("help");
            help.showHelpPopup();

            break;


        case TYPE_TICKER:
            //"ticker://1"
            var iMenu = new Imenu();
            var ticker = new Ticker();
            var tickerIndex = this.getTickerIndex(href);
            ticker.toggleTicker(tickerIndex);
            iMenuModel.setTickItemFlag(true);
            iMenu.populateMenu();
            break;

        }
    }

}

/********************
 * Imenu
 *
 *********************/

var Imenu = function () {

    var IMENU_URL = "imenu.json",
        randNum = new RandomURLNum(), // new random number gen object
        self = this;

    self.buildMenu = function () {

        //reset the current list item
        iMenuModel.setItemIndex(0);

        var iMenuData = iMenuModel.getImenuData(),
            menuIndex = iMenuModel.getMenuIndex(),
            iMenuContainer = document.getElementById("iMenuContainer"),
            iMenuStrap = document.getElementById("iMenuStrap"),
            messageStrap = document.getElementById("messageStrap"),
            iMenuHint = document.getElementById("iMenuHint"),
            iMenuClose = document.getElementById("iMenuClose"),
            audioIcon = document.getElementById("audioIcon"),
            audioStream = document.getElementById("audioStream"),
            OSD = document.getElementById('OSD');

        if (!iMenuContainer) {
            iMenuContainer = document.createElement("div");
            var iMenuBody = document.createElement("div");

            iMenuContainer.id = "iMenuContainer";
            iMenuBody.className = "iMenu closed";

            iMenuContainer.appendChild(iMenuBody);
            OSD.appendChild(iMenuContainer);
        }

        if (!messageStrap) {
            messageStrap = document.createElement("div");
            messageStrap.id = "messageStrap";
            OSD.appendChild(messageStrap);
        }

        var iMenuButton = document.getElementById("iMenuButton");

        /*
         * If the iMenu button doesn't exist. Create the i button,
         * 'close' text and hint text objects
         */
        if (!iMenuButton) {
            iMenuButton = document.createElement("div");
            iMenuButton.id = "iMenuButton"; // 'i' iMenu icon
            iMenuClose = document.createElement("div");
            iMenuClose.id = "iMenuClose"; //'CLOSE' message area
            audioIcon = document.createElement("div");
            audioIcon.id = "audioIcon"; //Audio (speaker) icon
            audioStream = document.createElement("div");
            audioStream.id = "audioStream"; //Audio Stream number area
            audioStream.appendChild(document.createElement("span"));
            closeText = document.createElement("span");
            closeText.innerHTML = "CLOSE"; //CLOSE text
            iMenuHint = document.createElement("div");
            iMenuHint.id = "iMenuHint";
            var hintText = document.createElement("span");
            hintText.innerHTML = iMenuData.menu[menuIndex].item[0].hint;
            OSD.appendChild(iMenuButton);
            OSD.appendChild(audioIcon);
            OSD.appendChild(audioStream);
            OSD.appendChild(iMenuClose).appendChild(closeText);
            OSD.appendChild(iMenuHint).appendChild(hintText);
            iMenuClose.style.visibility = "hidden";
            iMenuHint.style.visibility = "hidden";
            audioIcon.style.visibility = "hidden";
        }


        /*
         * If the iMenu Strap bar doesn't exist, create.
         */
        if (!iMenuStrap) {
            var iMenuStrap = document.createElement("div");
            iMenuStrap.id = "iMenuStrap";
            OSD.appendChild(iMenuStrap);
        }

        /*
         * Position the iMenu and associated screen objects in relation to the 
         * X and Y coordinates set in imenu.json
         */
        var xPos = iMenuModel.getiMenuXPos();
        var yPos = iMenuModel.getiMenuYPos();
        iMenuContainer.style.left = iMenuModel.getiMenuXPos() + 'px';
        iMenuContainer.style.top = (Number(yPos) - iMenuContainer.clientHeight + 27) + 'px';
        iMenuButton.style.left = (Number(xPos) + 15) + 'px';
        iMenuButton.style.top = (Number(yPos)) + 'px';
        audioIcon.style.left = (Number(xPos) + 50) + 'px';
        audioIcon.style.top = (Number(yPos)) + 'px';
        audioStream.style.top = (Number(yPos) + 1 + 'px');
        audioStream.style.left = (Number(xPos) + 86 + 'px');
        iMenuClose.style.left = (Number(xPos) + 65 + iMenuButton.clientWidth) + 'px';
        iMenuButton.style.top = (Number(yPos)) + 'px';
        iMenuHint.style.left = (Number(xPos) + 70 + iMenuButton.clientWidth + iMenuClose.clientWidth) + 'px';
        iMenuClose.style.top = (Number(yPos)) + 'px';
        iMenuHint.style.top = (Number(yPos)) + 'px';
        iMenuStrap.style.top = (Number(yPos)) + 'px';
        messageStrap.style.top = (Number(yPos)) + 'px';


        self.populateMenu();

    }

    self.populateMenu = function () {

        /* iMenuData            = iMenu json data
           menuIndex            = current iMenu
           menuItemIndex        = current selected menu item
           iMenuContainer       = HTML DIV containing the iMenu
           iMenuInnerContainer  = HTML Sub-Container for iMenu tags and data
           ulElement            = HTML UL tag for menu list
           iMenuTitle           = HTML top title
           iMenuHint            = HTML Hint text area on message strap
           OSD                  = HTML Main screen layer
        */
        var iMenuData = iMenuModel.getImenuData(),
            menuIndex = iMenuModel.getMenuIndex(),
            menuItemIndex = iMenuModel.getItemIndex(),
            iMenuContainer = document.getElementById("iMenuContainer"),
            iMenuInnerContainer = document.getElementsByClassName("iMenu"),
            ulElement = document.getElementById("menuList"),
            iMenuTitle = document.getElementById("iMenuTitle"),
            iMenuHint = document.getElementById("iMenuHint"),
            OSD = document.getElementById("OSD");

        iMenuModel.setNumOfListItems(iMenuData.menu[menuIndex].item.length); //Get the number of items in the menu

        /*
         * Remove the old ul element if it exists. It's easier to remove and rebuild
         * because there could be a different number of elements in the next menu and 
         * i'm lazy ;-)
         */
        if (ulElement) {
            ulElement.parentNode.removeChild(ulElement);
        }

        /*
         * If the iMenu Title already exists, clear the text and replace
         * with the latest title text. Otherwise, create a new title div and text node
         */
        if (iMenuTitle) {
            var children = iMenuTitle.childNodes;
            for (var i = 0; i < children.length; i++) {
                iMenuTitle.removeChild(children[i]);
            }
            iMenuTitle.appendChild(document.createTextNode(iMenuData.menu[menuIndex].id));
        } else {
            iMenuTitle = document.createElement("div");
            iMenuTitle.id = "iMenuTitle";
            iMenuInnerContainer[0].appendChild(iMenuTitle).appendChild(document.createTextNode(iMenuData.menu[menuIndex].id));
        }

        if (iMenuHint) {
            iMenuHint.firstChild.innerHTML = iMenuData.menu[menuIndex].item[0].hint;
        } else {
            iMenuHint = document.createElement("div");
            iMenuHint.id = "iMenuHint";
            var hintText = document.createElement("span");
            hintText.innerHTML = iMenuData.menu[menuIndex].item[0].hint;
            OSD.appendChild(iMenuHint).appendChild(hintText);
        }

        ulElement = document.createElement("ul");
        ulElement.id = "menuList";
        iMenuInnerContainer[0].appendChild(ulElement);

        ulElement = document.getElementById("menuList");

        /* I'm setting the number of list items here because it crops
         * the number to the Maximum allowed (6)
         */
        iMenuModel.setNumOfListItems(iMenuData.menu[menuIndex].item.length);


        for (index = 0; index < iMenuModel.getNumOfListItems(); index++) {
            var liElement = document.createElement("li");
            var spanElement = document.createElement("div");
            var tickElement = document.createElement("div");

            //Is this an alert menu?
            if (iMenuData.menu[menuIndex].item[menuItemIndex].href.indexOf("alert://") != -1) {

                //This IS an alert menu, fancy that !
                //I suppose we had better set the ticks on the correct menu item
                if (index === 0) {
                    if (iMenuModel.getAlertStatus()) {
                        spanElement.className = "listItem selected";
                        tickElement.className = "alert ticked";
                    } else {
                        spanElement.className = "listItem";
                        tickElement.className = "alert";
                    }
                } else {
                    if (!iMenuModel.getAlertStatus()) {
                        spanElement.className = "listItem selected";
                        tickElement.className = "alert ticked";
                        iMenuModel.setItemIndex(1);
                    } else {
                        spanElement.className = "listItem";
                        tickElement.className = "alert";
                    }
                }
                ulElement.appendChild(liElement).appendChild(spanElement).innerHTML = iMenuData.menu[menuIndex].item[index].label;
                liElement.appendChild(tickElement);

            } else if (iMenuData.menu[menuIndex].item[index].href.indexOf("ticker://") != -1) {
                //This is a ticker item
                var href = new Href;
                var tickerNumber = href.getTickerIndex(iMenuData.menu[menuIndex].item[index].href);
                var tickerList = iMenuModel.getTickerFlags();

                if (index === menuItemIndex) {
                    spanElement.className = "listItem selected";
                } else {
                    spanElement.className = "listItem";
                }

                if (tickerList[tickerNumber] === true) {
                    tickElement.className = "ticker ticked";
                } else {
                    tickElement.className = "ticker";
                }

                //This is a ticker item in the iMenu
                ulElement.appendChild(liElement).appendChild(spanElement).innerHTML = iMenuData.menu[menuIndex].item[index].label;
                liElement.appendChild(tickElement);

                // if this a help menu
            } else if (iMenuData.menu[menuIndex].item[index].href.indexOf("help://") != -1) {
                // do not display :-)
                iMenuModel.setNumOfListItems(iMenuModel.getNumOfListItems() - 1);
            } else {

                if (index === 0 && !(iMenuModel.getTickItemFlag())) {
                    spanElement.className = "listItem selected";
                } else {
                    spanElement.className = "listItem";
                }
                ulElement.appendChild(liElement).appendChild(spanElement).innerHTML = iMenuData.menu[menuIndex].item[index].label;
            }

        }

        var liElement = document.createElement("li");
        var spanElement = document.createElement("div");
        spanElement.className = "listItem";
        ulElement.appendChild(liElement).appendChild(spanElement).innerHTML = "HELP";
        //iMenuModel.setNumOfListItems(iMenuModel.getNumOfListItems());


        iMenuModel.setTickItemFlag(false);

    }

    //iMenuController is where the remote control button presses are detected
    self.iMenuController = function (keyCode) {
        var iMenuData = iMenuModel.getImenuData();


        var currMenu = iMenuModel.getMenuIndex();
        var currItem = iMenuModel.getItemIndex();
        var numOfListItems = iMenuModel.getNumOfListItems();

        if (sportsAppModel.getKeyPressEnabled()) {
            iMenuElement = document.querySelector('.iMenu');
            if (iMenuElement.classList.contains('opened')) {
                clearTimeout(iMenuTimer);
                /*Binding 'self' to the function because timers refer to 'self' as the window
                 * and 'self' goes out of scope.
                 */
                iMenuTimer = setTimeout(self.closeImenu.bind(self), 5000);
            }

            switch (keyCode) {

            case 38:
                //up
                //sportsApp.keyPressEnabled = false; //disable key presses
                if (currItem > 0) {
                    currItem--; //decrement the current item index to match the one above
                    iMenuModel.setItemIndex(currItem); //Set the item index to the new value
                    var listItem = document.querySelectorAll('.listItem'); //get all the html objects with .listItem class
                    listItem[currItem + 1].classList.remove('selected'); //remove the 'selected' class from the old selected item
                    listItem[currItem].classList.add('selected'); //add the 'selected' class to the new selected item
                    var iMenuHint = document.getElementById("iMenuHint"); //get the html object with id of 'iMenuHint'
                    iMenuHint.firstChild.innerHTML = iMenuData.menu[currMenu].item[currItem].hint; //populate the text in the hint object with hint data in the iMenu json for the current list item
                }
                break;
            case 40:
                //down
                //sportsApp.keyPressEnabled = false; //disable key press
                //if (currItem < iMenuModel.getNumOfListItems() - 1) {
                if (currItem < numOfListItems) {
                    currItem++; //increment the current item index to match the one below
                    iMenuModel.setItemIndex(currItem); //Set the item index to the new value
                    var listItem = document.querySelectorAll('.listItem'); //get all the html objects with .listItem class
                    listItem[currItem - 1].classList.remove('selected'); //remove the 'selected' class from the old selected item
                    listItem[currItem].classList.add('selected'); //add the 'selected' class to the new selected item
                    var iMenuHint = document.getElementById("iMenuHint"); //get the html object with id of 'iMenuHint'
                    /*
                     * Help info is not in iMenuData so if we are on the last item in the iMenu (Help) 
                     * we just write our own hint text here
                     */
                    currItem < numOfListItems ? iMenuHint.firstChild.innerHTML = iMenuData.menu[currMenu].item[currItem].hint : iMenuHint.firstChild.innerHTML = "HELP INFORMATION"; //populate the text in the hint object with hint data in the iMenu json for the current list item

                }
                break;
            case 13:
                //enter-return key
                //sportsApp.keyPressEnabled = false; //disable key press
                var hrefProcessor = new Href();
                currItem === numOfListItems ? hrefProcessor.hrefHandler("help://", iMenuModel) : hrefProcessor.hrefHandler(iMenuData.menu[currMenu].item[currItem].href, iMenuModel);

                break;
            case 73:
            case 457:
                //i
                self.openCloseImenu();
                sportsAppModel.setKeyPressEnabled(true);
                break;
            case 66: //self will be changed to the backup button on the controller
                //B for BACKUP/DELETE
                //get the length of the breadcrum array
                var bcLength = iMenuModel.breadcrum.length;

                if (!currMenu == 0) {
                    if (bcLength > 0) {
                        iMenuModel.setMenuIndex(iMenuModel.returnMenuId(iMenuModel.breadcrum[iMenuModel.breadcrum.length - 1]));
                        iMenuModel.setMenuId(iMenuModel.breadcrum[bcLength - 1]);
                        //remove the last item off the breadcrum array
                        iMenuModel.popBreadcrum();
                        self.buildMenu();
                    }
                } else {
                    self.closeImenu();
                }

                break;
            case 27: //self will be changed to the backup button on the controller
                //B for BACKUP/DELETE
                //get the length of the breadcrum array
                var bcLength = iMenuModel.breadcrum.length;

                if (!currMenu == 0) {
                    if (bcLength > 0) {
                        iMenuModel.setMenuIndex(iMenuModel.returnMenuId(iMenuModel.breadcrum[iMenuModel.breadcrum.length - 1]));
                        iMenuModel.setMenuId(iMenuModel.breadcrum[bcLength - 1]);
                        //remove the last item off the breadcrum array
                        iMenuModel.popBreadcrum();
                        self.buildMenu();
                    }
                } else {
                    self.closeImenu();
                }

                break;
            case 8:
                //B for BACKUP/DELETE
                //get the length of the breadcrum array
                var bcLength = iMenuModel.getBreadcrumlLength();

                if (!currMenu == 0) {

                    if (bcLength > 0) {
                        iMenuModel.setMenuIndex(iMenuModel.returnMenuId(iMenuModel.breadcrum[iMenuModel.breadcrum.length - 1]));
                        iMenuModel.setMenuId(iMenuModel.breadcrum[bcLength - 1]);
                        //remove the last item off the breadcrum array
                        iMenuModel.popBreadcrum();
                        self.buildMenu();
                    }
                } else {
                    self.closeImenu();
                }

                break;
            default:
                break;
            }

        }

    }

    self.showAudioIcon = function () {
        document.getElementById('audioIcon').style.visibility = "visible";
        var audioStream = document.getElementById('audioStream');
        audioStream.style.visibility = "visible";
        audioStream.firstElementChild.innerHTML = videoMenuModel.getCurrMultiAudio();
    };

    self.hideAudioIcon = function () {
        var audioIcon = document.getElementById('audioIcon');
        var audioStream = document.getElementById('audioStream');
        if (audioIcon) {
            audioIcon.style.visibility = "hidden";
            audioStream.style.visibility = "hidden";
        }
    };

    self.showMessageStrap = function (messageText, timeOut, hideAudio) {
        var messageStrap = document.getElementById("messageStrap");
        if (!messageStrap) {
            messageStrap = document.createElement("div");
            messageStrap.id = "messageStrap";
            OSD.appendChild(messageStrap);
        }

        //remove any child nodes (i.e. text nodes)
        while (messageStrap.firstChild) {
            messageStrap.removeChild(messageStrap.firstChild);
        }

        //if hideo audio icon requested
        if (hideAudio) {
            self.hideAudioIcon();
        }
        messageText !== null ? messageStrap.appendChild(document.createTextNode(messageText)) : messageStrap.appendChild(document.createTextNode(""));

        messageStrap.style.visibility = "visible";
        var hideMessageStrap = setTimeout(function () {
            self.hideMessageStrap();
        }, timeOut);
    }

    self.hideMessageStrap = function () {
        var messageStrap = document.getElementById("messageStrap");
        messageStrap.style.visibility = "hidden";
    }

    self.openCloseImenu = function () {
        var iMenuData = iMenuModel.getImenuData();
        iMenuElement = document.querySelector('.iMenu');

        if (iMenuElement.classList.contains('opened')) {
            iMenuElement.classList.remove('opened');
            iMenuElement.classList.add('closed');
            clearTimeout(iMenuTimer);
            document.getElementById("iMenuHint").style.visibility = "hidden";
            document.getElementById("iMenuClose").style.visibility = "hidden";

            //Do not hide the iMenu Strap if the ticker is still running
            if (iMenuModel.getTickerStatus() === "off") {
                document.getElementById("iMenuStrap").style.visibility = "hidden";
            }
            sportsAppModel.setCurrentFocus(sportsAppModel.getLastFocus());

        } else {
            //reset the menu and list indexes
            iMenuModel.setMenuIndex(0);
            iMenuModel.setItemIndex(0);
            iMenuModel.setMenuId(iMenuData.menu[0].id);
            breadcrum = [];
            self.populateMenu();
            iMenuElement.classList.remove('closed');
            iMenuElement.classList.add('opened');
            /*Binding 'self' to the function because timers refer to 'self' as the window
             * and 'self' goes out of scope.
             */
            iMenuTimer = setTimeout(self.openCloseImenu.bind(self), 5000);
            document.getElementById("iMenuStrap").style.visibility = "visible";
            document.getElementById("iMenuClose").style.visibility = "visible";
            document.getElementById("iMenuHint").style.visibility = "visible";
        }
    }

    self.closeImenu = function () {

        iMenuElement = document.querySelector('.iMenu');

        if (iMenuElement.classList.contains('opened')) {
            iMenuElement.classList.remove('opened');
            iMenuElement.classList.add('closed');
            clearTimeout(iMenuTimer);
            document.getElementById("iMenuHint").style.visibility = "hidden";
            document.getElementById("iMenuClose").style.visibility = "hidden";

            //Do not hide the iMenu Strap if the ticker is still running
            if (iMenuModel.getTickerStatus() == "off") {
                document.getElementById("iMenuStrap").style.visibility = "hidden";
            }

            //move this somewhere else !!!!!!!!
            sportsAppModel.setCurrentFocus(sportsAppModel.getLastFocus());
        }

    }

    self.loadImenu = function (rtu) {
        //Only use AJAX if called by the Real Time Update module
        jsLoad = rtu ? new AJAXjsonLoader() : new SJAXjsonLoader;

        jsLoad.loadJSON(IMENU_URL + "?" + randNum.giveMeARandomNum(),
            function (data) {
                iMenuModel.setImenuData(data);

                //added 3/1/2016 - initialise iMenu if new one loaded via RTU
                if (rtu) {
                    self.init();
                }
                return;
            },
            function (jsonHR) {
                vmDtvLib.dax.trackError(jsonHR, "JSON Load error " + IMENU_URL);
                console.error("JSON Load error -> " + jsonHR + " " + IMENU_URL);
                iMenuModel.setImenuStatus(false);
            }
        );
    }

    self.hideInfoIcon = function () {
        var infoIcon = document.getElementById("iMenuButton");
        if (infoIcon) {
            infoIcon.style.visibility = "hidden";
        }
        return;
    }

    self.showInfoIcon = function () {
        var infoIcon = document.getElementById("iMenuButton");
        if (infoIcon) {
            infoIcon.style.visibility = "visible";
        }
        return;
    }

    self.hideImenuStrap = function () {
        document.getElementById("iMenuStrap").style.visibility = "hidden";
        return;
    }

    self.showImenuStrap = function () {
        document.getElementById("iMenuStrap").style.visibility = "visible";
        return;
    }

    self.init = function () {
        //initialise the menuId with the launch Menu value in the JSON
        /*
         * Check to see if the iMenu is actually required. You never know
         * the Technical directors might not have even set one up.
         */

        var iMenuData = iMenuModel.getImenuData();

        //Even if the iMenu isn't available, there are still coordinates set in the json data
        //I don't know why but you never know we may need them later.
        iMenuModel.setiMenuXPos(Number(iMenuData.x));
        iMenuModel.setiMenuYPos(Number(iMenuData.y));

        if (iMenuData.hasOwnProperty('launchMenu')) {
            //Oh that's nice. It looks as though they wanted an iMenu afterall
            iMenuModel.setMenuId(iMenuData.launchMenu);
            //Set the required flag to true so we will know for later
            iMenuModel.setImenuStatus(true);

            //check and set iMenu component requirements (alerts,stats,ticker and draw)
            iMenuModel.setRequirements();

            self.buildMenu(); //build the iMenu (if required)  

            if (iMenuModel.getTickerRequired()) {
                var ticker = new Ticker();
                ticker.loadTicker(); // Load the initial Ticker configuration (if available)
                ticker.buildTicker(); //build the ticker (if required)
                ticker = null;
            }

            if (iMenuModel.getAlertsRequired()) {
                var alerts = new Alerts();
                alerts.buildAlert(); //build goal alerts
                alerts = null;
            }


        } else {
            //No iMenu required. Oh well, that saves a job I suppose.
            //We had better set the required flag to false
            iMenuModel.setImenuStatus(false);
        }

    }


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
            var iMenu = new Imenu();
            //load latest iMenu data
            iMenu.loadImenu(true);
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
        setInterval(function () {
            self.loadRtu(true);
        }, configModel.getPollTime());
    }


}

var Ticker = function () {

    var SCREEN_WIDTH = 1280,
        padSize = 350,
        TICKER_URL = "tickerdata.json",
        randNum = new RandomURLNum(); // new random number gen object


    this.buildTicker = function () {
        var oStrap = document.getElementById("iMenuStrap");
        var oTicker = document.getElementById("ticker");

        if (!oTicker) {
            oTicker = document.createElement("div");
            oTicker.id = "ticker";
            var oTickerSpan = document.createElement("span");
            oTickerSpan.id = "tickerText";
            oStrap.appendChild(oTicker).appendChild(oTickerSpan);
        }

    };

    this.toggleTicker = function (index) {

        iMenuModel.getCurrentTickerFlag(index) === false ? this.startTicker(index) : this.stopTicker(index);
    };

    this.startTicker = function (tickerIndex) {

        //If a ticker is already running. Stop the current ticker
        if (iMenuModel.getTickerStatus() === "on") {
            for (i = 0; i < 6; i++) {
                if (iMenuModel.getCurrentTickerFlag(i) === true) {
                    this.stopTicker(i);
                }
            }
        }

        var tickerText = tickerModel.getTickerHeader(tickerIndex) + " -- " + tickerModel.getTickerBody(tickerIndex); // + Array(padSize).join("&nbsp;");
        var tickerSpan = document.getElementById("tickerText");
        var tickerContainer = document.getElementById("ticker");
        tickerContainer.style.visibility = "visible";

        if (tickerSpan) {
            tickerSpan.innerHTML = tickerText;
        }

        tickerWidth = window.getComputedStyle(tickerContainer, null).getPropertyValue('width');
        tickerWidth = tickerWidth.substring(0, tickerWidth.length - 2);
        //animateTicker();
        tickerContainer.style.left = "1280px";
        animationRequest = setInterval(moveTicker, 50);

        iMenuModel.setTickerStatus("on");

        //set the current ticker flag to true
        iMenuModel.setCurrentTickerFlag(tickerIndex, true);

    };


    /*
     * stopTicker() - clears ticker text, hides ticker
     *                element and clears interval timer
     */
    this.stopTicker = function (index) {
        //Hide the ticker
        var tickerSpan = document.getElementById("tickerText");
        var tickerContainer = document.getElementById("ticker");
        tickerContainer.style.visibility = "hidden";

        //If the ticker exists
        if (tickerSpan) {
            //clear the ticker text
            tickerSpan.innerHTML = "";
        }

        //Cancel the interval timer
        clearInterval(animationRequest);

        // Set the ticker status to off so that the iMenu knows it can
        // hide the strap bar when it closes
        iMenuModel.setTickerStatus("off");
        iMenuModel.setCurrentTickerFlag(index, false);

    };

    this.hideTicker = function () {
        var tickerContainer = document.getElementById("ticker");
        tickerContainer.style.visibility = "hidden";
        return;
    }

    this.showTicker = function () {
        var tickerContainer = document.getElementById("ticker");
        tickerContainer.style.visibility = "visible";
        return;
    }

    function animateTicker() {
        animationRequest = setInterval(moveTicker(), 50);
    };

    /*
     * moveTicker() - moves ticker text element from right to left
     *                then resets when ticker is fully off the screen.
     */

    function moveTicker() {
        //Find the ticker element and it's x coordinate
        var ticker = document.getElementById("ticker");
        var xPos = window.getComputedStyle(ticker, null).getPropertyValue('left');

        //store the numerical value without the 'px'
        xPos = xPos.substring(0, xPos.length - 2);

        //Move the ticker to the left by 4 pixels
        xPos = xPos - 4;

        //If all of the ticker is off the screen
        if (xPos < (Math.abs(tickerWidth) * -1)) {
            xPos = SCREEN_WIDTH;
        }
        ticker.style.left = xPos + "px";
    };


    /*
     * Ticker Loader
     * @PARAM rtu - true  : invoked by Real Time Updater so background AJAX load required
     *              false : SJAX load required
     */

    this.loadTicker = function (rtu) {
        jsLoad = rtu ? new AJAXjsonLoader() : new SJAXjsonLoader;

        jsLoad.loadJSON(TICKER_URL + "?" + randNum.giveMeARandomNum(),
            function (data) {
                //maybe use a data ready flag ???
                tickerModel.setTickerData(data);
                //this.buildTicker();
                return;
            },
            function (jsonHR) {
                vmDtvLib.dax.trackError(jsonHR, "JSON Load error " + TICKER_URL);
                console.error("JSON Load Error -> " + jsonHR + " " + TICKER_URL);
            }
        );
    };


}

/*
 * VideoMenu
 *
 * Neil Cooper
 * I can't remember how I worked all this out but it works :-)
 * 
 *
 */
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
        var targetBox = document.getElementById('target');
        //set the target visibility flag
        videoMenuModel.targetVisible(true);
        /*
        Only draw the target box if it's needed - if the width and height are more than 0
        If they are 0 or less, this is a single stream video menu
        */
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

        //Grab a snapshot of the video menu configuration from the model
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

        //multiplier for moving target direction (1 for positive movement and -1 for negative movement along an axis)
        var xDirection = x > nx ? -1 : 1;
        var yDirection = y > ny ? -1 : 1;

        //multiplier for target sizing (1 for grow and -1 for shrink)
        var hDirection = h > nh ? -1 : 1; //if old height is larger than new height then height multiplier is -1, otherwise 1
        var wDirection = w > nw ? -1 : 1; //if old width is larger than new width then width multiplier is -1, otherwise 1

        /* 
        Just a function calculate difference between two values
        and return the result as a positive number
        */
        var difference = function (a, b) {
            return Math.abs(a - b); //always return a positive number
        };

        var xDistance = difference(x, nx); //difference between start x coordinate and end x coordinate
        var yDistance = difference(y, ny); //difference between start y coordinate and end y coordinate

        var heightDifference = difference(w, nw); //difference between start width and end width
        var widthDifference = difference(h, nh); //difference between start height and end height

        /*
        This doubles the step rate if a ticker is active. It's because if a ticker is running, the speed of the
        target box will decrease becuase the set top box can't keep up
        */
        var stepMultiplier = iMenuModel.getTickerStatus() === "on" ? 2 : 1;

        //Declare the step variables for moving and resizing the target
        var xStep, yStep, wStep, hStep;

        //Calculate how many pixels the target moves and resizes by on each loop

        /*
        If the distance along the X-axis is greater than the distance along the Y-axis then
        calculate the travel using the x-axis distance as the y-axis distance could be zero 
        (indicating a straigh line left/right travel). Otherwise, calculate using the y-axis 
        distance as the x-axis could be zero (straigh up/down travel)
        */
        if (xDistance > yDistance) {

            /*
            If the y-axis distance is zero, just step the x-axis movement by 40 pixels (multiplied by the step multiplier -
            The step mutliplier is applied if the ticker is running because the ticker seems to slow everything up). If the y-axis
            distance is greater than zero then calculate the step by (xDistance / yDistance) * 20 - this ensures that the travel
            moves diagonally at more or less the correct ratio between x and y.
            */
            yDistance === 0 ? xStep = 40 * stepMultiplier : xStep = ((xDistance / yDistance) * 20) * stepMultiplier;
            yStep = yDistance / Math.ceil(xDistance / xStep);

            //Calculate the number of pixels the height and width change by on each movement 
            hStep = widthDifference / Math.ceil((xDistance === 0 ? 1 : xDistance) / xStep);
            wStep = heightDifference / Math.ceil((xDistance === 0 ? 1 : xDistance) / xStep);

        } else {
            /*
            If the x-axis distance is zero, just step the y-axis movement by 40 pixels (multiplied by the step multiplier -
            The step mutliplier is applied if the ticker is running because the ticker seems to slow everything up). If the y-axis
            distance is greater than zero then calculate the step by (yDistance / xDistance) * 20 - this ensures that the travel
            moves diagonally at more or less the correct ratio between y and x.
            */
            xDistance === 0 ? yStep = 40 * stepMultiplier : yStep = ((yDistance / xDistance) * 20) * stepMultiplier;
            xStep = xDistance / Math.ceil(yDistance / yStep);

            //Calculate the number of pixels the height and width change by on each movement 
            wStep = heightDifference / Math.ceil((yDistance === 0 ? 1 : yDistance) / yStep);
            hStep = widthDifference / Math.ceil((yDistance === 0 ? 1 : yDistance) / yStep);

        }

        var targetBox = document.getElementById("target"); //Store the target screen object
        var count = 0; //Initialise the counter to zero

        /*
        
        This section animates the target box using setInterval.
        On each interval the difference between the current position and the destination. 
        Using this information, the direction of travel can be attained. This is used to
        recalculate the target box coordinates for the next step and redraw it in the new position.
        The setInterval keeps running until the final destination is reached.
        */
        var stepper = setInterval(function () {

                /* 
                
                Work out the distance between the current position and the destination
                of the target box
                
                */
                var xDiff = Math.abs(nx - x); //distance left on x axis
                var yDiff = Math.abs(ny - y); //distance left on y axis
                var wDiff = Math.abs(nw - w); //width difference
                var hDiff = Math.abs(nh - h); //height difference

                /*
                Update the x coordinate of the target box but
                only if the x coordinate doesn't equal the destination
                coordinate yet.
                */
                if (x != nx) {
                    /*
                    If the difference between the current position and the destiantion is less than
                    the step distance, just move by the distance left to go. Otherwise, calculate the new postion
                    using the step distance.
                    */
                    if (xDiff < xStep) {
                        x = x + xDiff * (Number(xDirection));
                    } else {
                        x = x + xStep * (Number(xDirection));
                    }
                }

                /*
                Update the y coordinate of the target box but
                only if the y coordinate doesn't equal the destination
                coordinate yet.
                */
                if (y != ny) {
                    /*
                    If the difference between the current position and the destiantion is less than
                    the step distance, just move by the distance left to go. Otherwise, calculate the new postion
                    using the step distance.
                    */
                    if (yDiff < yStep) {
                        y = y + yDiff * (Number(yDirection));
                    } else {
                        y = y + yStep * (Number(yDirection));
                    }
                }

                /*
                Update the width of the target box but
                only if the width doesn't equal the destination
                width yet.
                */
                if (w != nw) {
                    /*
                    If the difference between the current width and the destiantion width is less than
                    the step distance, just adjust by the distance left to go. Otherwise, calculate the new width
                    using the step distance.
                    */
                    if (wDiff < wStep) {
                        w = w + wDiff * (Number(wDirection));
                    } else {
                        w = w + wStep * (Number(wDirection));
                    }
                }

                /*
                Update the height of the target box but
                only if the width doesn't equal the destination
                height yet.
                */
                if (h != nh) {
                    /*
                    If the difference between the current height and the destiantion height is less than
                    the step distance, just adjust by the distance left to go. Otherwise, calculate the new height
                    using the step distance.
                    */
                    if (hDiff < hStep) {
                        h = h + hDiff * (Number(hDirection));
                    } else {
                        h = h + hStep * (Number(hDirection));
                    }
                }

                //Apply the target box position and size to the target box css style
                targetBox.style.left = x + "px";
                targetBox.style.top = y + "px";
                targetBox.style.height = h + "px";
                targetBox.style.width = w + "px";

                count++; //increment the counter

                /*
                If the x and y coordinates match their destination coordinates and
                the width and height now match the destination size, clear the interval counter
                to stop moving the target box and allow user interaction using the remote control
                again.
                */
                if (x == nx && y == ny && w == nw && h == nh) {
                    clearInterval(stepper);
                    sportsAppModel.setKeyPressEnabled(true);
                }
            },
            20); //setInterval timer value of 20

    };


    self.videoMenuController = function () {


        oIndex = videoMenuModel.getOindex(); //Option index - added NDC 15/03/2016
        index = videoMenuModel.getVideoMenuIndex(); //Video Menu Index - added NDC 15/03/2016

        var direction,
            channelManager = new ChannelManager(),
            videoMenuConfig = videoMenuModel.getVideoMenuConfig();

        //Only detect key presses if getKeyPressEnabled() === true
        if (sportsAppModel.getKeyPressEnabled()) {

            //New href processor object to deal with 
            var hrefProcessor = new Href();

            clearTimeout(videoMenuTimer);

            switch (event.keyCode) {

            case 38:
                if (sportsAppModel.getCurrentFocus() !== "fullscreen") {
                    sportsAppModel.setKeyPressEnabled(false);
                    direction = "UP";
                    newIndex = videoMenuModel.getVideoMenuOptionNav(index, oIndex, direction);
                    targetMove(index, newIndex, oIndex);
                    videoMenuModel.setOindex(newIndex);
                    //Tune to the option audio only after ONE SECOND has passed so that rapid movement of the target box doesn't stack up the tuning.
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
                    targetMove(index, newIndex, oIndex);
                    videoMenuModel.setOindex(newIndex);
                    //Tune to the option audio only after ONE SECOND has passed so that rapid movement of the target box doesn't stack up the tuning.
                    videoMenuTimer = setTimeout(function () {
                        channelManager.audioTune(Number(videoMenuConfig.videoMenu[index].matrix.option[newIndex].menuAudio), self.audCallBack());
                    }, 1000);
                }
                break;
            case 39:
                /*
                RIGHT BUTTON PRESSED
                If the app is currently in 'full screen' mode and there is multiple
                audio available, check that the current audio stream id is less than 9. 
                If so, increment the current audio id by one and tune to that value. Then,
                display the current id on the screen.
                
                If the app is NOT in fullscreen mode, move the target box to the right.
                */
                if (sportsAppModel.getCurrentFocus() === "fullscreen") {
                    if (videoMenuModel.getMultiAudioFlag()) {
                        var currAudio = videoMenuModel.getCurrMultiAudio();
                        var audioStream = document.getElementById("audioStream");
                        currAudio < 9 ? currAudio++ : null;
                        videoMenuModel.setCurrMultiAudio(currAudio);
                        var channelManager = new ChannelManager();
                        document.getElementById("audioStream").style.visibility = "visible";
                        document.getElementById("audioStream").firstElementChild.innerHTML = currAudio;
                        channelManager.audioTune(videoMenuConfig.ma[currAudio].aid, self.audCallBack());
                    }
                } else {
                    sportsAppModel.setKeyPressEnabled(false);
                    direction = "RIGHT";
                    newIndex = videoMenuModel.getVideoMenuOptionNav(index, oIndex, direction);
                    targetMove(index, newIndex, oIndex);
                    videoMenuModel.setOindex(newIndex);
                    //Tune to the option audio only after ONE SECOND has passed so that rapid movement of the target box doesn't stack up the tuning.
                    videoMenuTimer = setTimeout(function () {
                        channelManager.audioTune(Number(videoMenuConfig.videoMenu[index].matrix.option[newIndex].menuAudio), self.audCallBack());
                    }, 1000);
                }
                break;
            case 37:
                /*
                LEFT BUTTON PRESSED
                If the app is currently in 'full screen' mode and there is multiple
                audio available, check that the current audio stream id is less than 9. 
                If so, increment the current audio id by one and tune to that value. Then,
                display the current id on the screen.
                
                If the app is NOT in fullscreen mode, move the target box to the left.
                */
                if (sportsAppModel.getCurrentFocus() === "fullscreen") {
                    if (videoMenuModel.getMultiAudioFlag()) {
                        var currAudio = videoMenuModel.getCurrMultiAudio();
                        currAudio > 0 ? currAudio-- : null;
                        videoMenuModel.setCurrMultiAudio(currAudio);
                        var channelManager = new ChannelManager();
                        document.getElementById("audioStream").style.visibility = "visible";
                        document.getElementById("audioStream").firstElementChild.innerHTML = currAudio;
                        channelManager.audioTune(videoMenuConfig.ma[currAudio].aid, self.audCallBack());
                    }
                } else {
                    sportsAppModel.setKeyPressEnabled(false);
                    direction = "LEFT";
                    newIndex = videoMenuModel.getVideoMenuOptionNav(index, oIndex, direction);
                    targetMove(index, newIndex, oIndex);
                    videoMenuModel.setOindex(newIndex);
                    //Tune to the option audio only after ONE SECOND has passed so that rapid movement of the target box doesn't stack up the tuning.
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
                var av = new Av();
                var chanID = channelManagerModel.getChannelID();
                if (iMenuModel.getImenuStatus()) {
                    var imenu = new Imenu();
                    imenu.hideMessageStrap();
                }

                sportsAppModel.getCurrentFocus() === "fullscreen" ? self.init(0) : function () {
                    if (videoMenuModel.getVideoMenuIndex() > 0) {
                        videoMenuModel.setOindex(0);
                        self.init(0);
                    } else {
                        splashLoader.show();
                        tivo.core.exit();
                    }
                }();
                av = null;
                break;
            case 27:
                //backup
                var av = new Av();
                var chanID = channelManagerModel.getChannelID();
                if (iMenuModel.getImenuStatus()) {
                    var imenu = new Imenu();
                    imenu.hideMessageStrap();
                }

                sportsAppModel.getCurrentFocus() === "fullscreen" ? self.init(0) : function () {
                    if (videoMenuModel.getVideoMenuIndex() > 0) {
                        videoMenuModel.setOindex(0);
                        self.init(0);
                    } else {
                        splashLoader.show();
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
        self.hideTarget(); //Hide the target box
        var iMenu = new Imenu();
        if (iMenuModel.getImenuStatus()) {
            if (videoMenuModel.getMultiAudioFlag()) {
                iMenu.showAudioIcon();
                iMenu.showMessageStrap(PRESS_LEFT_RIGHT_AUDIO_MESSAGE, 10000, false);
            } else {
                iMenu.showMessageStrap(BACKUP_TO_EXIT_VM_MESSAGE, 10000, true);
            }
        } else {
            iMenu.showMessageStrap(BACKUP_TO_EXIT_VM_MESSAGE, 10000, false);
        }
        sportsAppModel.setCurrentFocus("fullscreen");
        channelManagerModel.setCurrentChannel(encoder);
        channelManagerModel.setCurrentAudio(audio);
        channelManager.channelTune(encoder, self.vidCallBack);
        iMenu = null;
    };

    //showMessageStrap
    //Displays the message strap
    var showMessageStrap = function (message, time, hideAudio) {
        var iMenu = new Imenu();
        iMenu.showMessageStrap(message);
        hideMessage = setTimeout(function () {
            iMenu.hideMessageStrap();
        }, 10000);
        iMenu = null;
    };

    self.vidCallBack = function () {
        hideLoadingAnim();
        //now tune the audio
        channelManager.audioTune(Number(channelManagerModel.getCurrentAudio()), self.audCallBack);
        splashLoader.hide(); //hide the splash screen (Hopefully everything is ready by now!

    };

    self.audCallBack = function () {
        console.log("Audio Tuned");
    };

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
        oIndex = videoMenuModel.getOindex(); //option index
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

        //set the border colour of the target box
        var borderColour = "#" + (videoMenuConfig.videoMenu[index].matrix.rgb).slice(2, 8);
        var targetBox = document.getElementById('target');
        var OSD = document.getElementById('OSD');

        //If there is no target box, create one
        if (!targetBox) {
            targetBox = document.createElement("div");
            targetBox.id = "target";
            targetBox.style.zIndex = "1"; //layer Z-index 1
            OSD.appendChild(targetBox); //append the target box to the OSD layer
        }

        if (iMenuModel.getImenuStatus()) {
            var iMenu = new Imenu();
            iMenu.hideAudioIcon();
            iMenu = null;
            videoMenuModel.setMultiAudioFlag(false);
            videoMenuModel.setCurrMultiAudio(0);
        }

        var x = videoMenuConfig.videoMenu[index].matrix.option[oIndex].x;
        var y = videoMenuConfig.videoMenu[index].matrix.option[oIndex].y;
        var w = (videoMenuConfig.videoMenu[index].matrix.option[oIndex].w - TARGETBOXOFFSET);
        var h = (videoMenuConfig.videoMenu[index].matrix.option[oIndex].h - TARGETBOXOFFSET);

        self.showTarget(x, y, w, h, borderColour);

        //set the key focus to videoMenu so that button control
        sportsAppModel.setCurrentFocus("videoMenu");


    };
};



var AlertsModel = function () {

    var alertText = "",
        alertData = {},
        alertYPos = 0,
        redButtonChannel = "",
        redButtonTune = false,
        BACKGROUND_URL = "../assets/alert.png";

    var self = this;
    var alertTimer = 0; //Timer used for alert display timeout.

    self.setAlertData = function (data) {

        alertData = data;
    };

    //Set redButtonTune to true/false
    self.setRedButtonTune = function (tuned) {
        redButtonTune = tuned;
    };


    self.getAlertData = function () {
        return alertData;
    };

    self.getBackgroundURL = function () {
        return BACKGROUND_URL;
    };

    self.getAlertTimeout = function () {
        //get the timeout time from the config data and convert to milliseconds
        return (parseInt(alertData.display) * 1000);
    };

    self.getRedButtonChannel = function () {
        return alertData.stream;
    };

    self.getRedButtonAudio = function () {
        return alertData.audio;
    };

    self.getTuneAwayTimeout = function () {
        return (parseInt(alertData.exit) * 1000);
    };

    self.getRedButtonTune = function () {
        return redButtonTune;
    };

}


var ConfigModel = function () {

    var configData = {};

    this.setConfigData = function (data) {
        configData = data;
    };

    //Return config polltime (used for RTU timer)
    this.getPollTime = function () {
        return configData.polltime;
    };

    //Return videoX coordinate
    this.getVideoX = function () {
        return configData.videoX;
    };

    //Return videoy coordinate
    this.getVideoY = function () {
        return configData.videoY;
    };

}

var DrawStatsModel = function () {
    var self = this;
    var drawData = {};
    var currentRound,
        currentPage,
        status = false;

    self.setDrawData = function (data) {
        drawData = data;
    };
    self.getDrawData = function () {
        return drawData;
    };

    self.setCurrentStatus = function (currStatus) {
        status = currStatus;
    }

    self.getCurrentStatus = function () {
        return status;
    }

    //Get the player name @PARAMS  id (player Identification number)
    self.getPlayerName = function (id) {
        var playerName = "";
        //Just check that the id has a value otherwise player will return as undefined
        if (id !== "") {
            try {
                playerName = drawData["players"][id]["name"];
                return playerName;
            } catch (err) {
                console.log("Problem extracting player name: " + err);
                return " ";
            }
        }
        return " "; //return a blank 

    };

    self.getPlayer1Id = function (round, pageNo, pos) {
        return drawData["rounds"][round][pageNo + pos]["player1"] === undefined ? " " : drawData["rounds"][round][pageNo + pos]["player1"];
    };

    self.getPlayer2Id = function (round, pageNo, pos) {
        return drawData["rounds"][round][pageNo + pos]["player2"] === undefined ? " " : drawData["rounds"][round][pageNo + pos]["player2"];
    };

    self.getPlayer1Score = function (round, pageNo, pos) {
        return drawData["rounds"][round][pageNo + pos]["score1"] == undefined ? " " : drawData["rounds"][round][pageNo + pos]["score1"];
    };

    self.getPlayer2Score = function (round, pageNo, pos) {
        return drawData["rounds"][round][pageNo + pos]["score2"] == undefined ? " " : drawData["rounds"][round][pageNo + pos]["score2"];
    };

    self.getWinner = function (round, pageNo, pos) {
        return drawData["rounds"][round][pageNo + pos]["winner"] == undefined ? "-1" : drawData["rounds"][round][pageNo + pos]["winner"];
    };

    self.getExtraText = function (round, pageNo, pos) {
        return drawData["rounds"][round][pageNo + pos]["extraText"] == undefined ? " " : drawData["rounds"][round][pageNo + pos]["extraText"];
    };

    self.getRoundTitle = function (roundNumber) {
        return drawData.titles[roundNumber];
    };

    self.getCompTitle = function () {
        return drawData.title;
    };

    self.getActiveRound = function () {
        //Return the round number unless undefined. If so, return 0.
        var roundNumber = drawData.activeRound == undefined ? 0 : drawData.activeRound;

        if (roundNumber < 0) {
            roundNumber = 0;
        };

        return roundNumber;
    };

    self.getCurrentRound = function () {
        return currentRound === undefined ? 0 : currentRound;
    };

    self.setCurrentRound = function (round) {
        currentRound = round;
    };

    self.getNumberOfRounds = function () {
        return drawData["rounds"].length;
    };

    self.getNumberOfPages = function (roundNumber) {
        return drawData["rounds"][roundNumber].length / 4;
    };

    self.getCurrentPage = function () {
        return currentPage === undefined ? 0 : currentPage;
    };
    self.setCurrentPage = function (pageNo) {
        currentPage = pageNo;
    };

}

var GenStatsModel = function () {

    var self = this;

    /*This is where we will store the stats data 
      so we can just access it with an index value*/
    var genStatsData = {

        0: {}, //statsMenu.json
        1: {}, //tab1.json
        2: {}, //tab2.json
        3: {}, //   .
        4: {}, //   .
        5: {} //tab5.json
    };
    var currentTabIndex,
        menuLevel = "toplevel",
        menuIndex,
        noOfMenuItems,
        currMenuType,
        table2Page = 0,
        table3Page;

    var breadcrum = []; //breadcrum trail for submenu navigation

    self.pushBreadcrum = function (menuName) {
        //add a menu to the breadcrum trail array
        breadcrum.push(menuName);
    };

    self.popBreadcrum = function (menuName) {
        //pop() removes the last item in the array
        breadcrum.pop();
    };

    //Setters
    self.setGenStatsData = function (data, index) {
        genStatsData[index] = data;
    };

    self.setCurrentTabIndex = function (index) {
        currentTabIndex = index;
    };

    self.setMenuLevel = function (level) {
        menuLevel = level;
    };

    self.setMenuIndex = function (index) {
        menuIndex = index;
    };

    self.setCurrentMenuType = function (type) {
        currMenuType = type;
    };

    self.setNoOfMenuItems = function (n) {
        noOfMenuItems = n;
    };

    self.setTable2Page = function (page) {
        table2Page = page;
    };
    self.setTable3Page = function (page) {
        table3Page = page;
    };


    //Getters

    self.getGenStatsData = function (index) {
        return genStatsData[index];
    };

    self.getNoOfTabs = function () {
        return genStatsData[0].tabs.length;
    };

    self.getNoOfRows = function (tabIndex, menuIndex) {
        return genStatsData[tabIndex][menuLevel]["data"]["items"][menuIndex]["rows"].length;
    };

    self.getCurrentTabIndex = function () {
        return currentTabIndex;
    };
    self.getMenuIndex = function () {
        return menuIndex;
    };

    self.getMenuType = function (tabIndex, menuIndex) {
        return genStatsData[tabIndex][menuLevel]["data"]["items"][menuIndex]["type"];
    };

    self.getCurrentMenuType = function () {
        return currMenuType;
    };

    self.getNoOfMenuItems = function () {
        return noOfMenuItems;
    };

    self.getMenuItem = function (tabIndex, menuIndex) {
        return genStatsData[tabIndex][menuLevel]["data"]["items"][menuIndex]["data"];
    };

    self.getTable3MenuItem = function (tabIndex, menuIndex) {
        return genStatsData[tabIndex][menuLevel]["data"]["items"][menuIndex];
    };
    self.getTable2Page = function () {
        return table2Page;
    };
    self.getTable3Page = function () {
        return table3Page;
    };

    self.getBreadcrumLength = function () {
        return breadcrum.length;
    };
}

var HelpModel = function () {

    var helpData = {};

    //Setters

    this.setHelpDataText = function (text) {
        helpData.text = text;
    };

    this.setHelpData = function (data) {
        helpData = data;
    };


    //Getters

    this.getHelpDataText = function () {
        return helpData.text;
    };
}

/** 
 * @desc ImenuModel object contains the functions and data for the iMenu menu system. 
 * @author Neil Cooper neil.cooper@sky.uk
 * @required 
 */

var ImenuModel = function () {

    var iMenuData = {}, //holds the json config data for the imenu
        iMenuXPos = 0, //on screen X coordinate position
        iMenuYPos = 0, //Y coordinate position
        menuIndex = 0, //Index for the item currently selected on the menu.
        menuId = null, //Id of the Menu to be displayed
        itemIndex = 0, //index of the current item in the menu
        numOfListItems, //The number of selectable items on the iMenu
        MAX_LIST_ITEMS = 6, //Maximum number of items allowed in a menu
        iMenuElement,
        iMenuTimer, //non-activity Timer (normally 5 seconds) 
        SCREENRATIOX = 1, //1.7777777;				//Conversion between 720 pixels and 2048 pixels in screen width
        SCREENRATIOY = 1, //1.25;					//Conversion between 576 pixels and 720 pixels in screen height
        tickerStatus = {
            status: "off",
            0: false,
            1: false,
            2: false,
            3: false,
            4: false,
            5: false
        }, //Status for all 6 possible tickers
        tickItemFlag = false, //Flag set to notify an iMenu item has been ticked
        alertStatus = false, //Status of alert notifications
        required = false, //Flag to notify if the iMenu is required
        alertOnDisplay = false, //Flag set to notify if alerts are being displayed
        self = this,
        appRequirements = {
            tickerRequired: false, //set to true if ticker required in app
            alertsRequired: false, //set to true if alerts required in app
            statsRequired: false, //set to true if stats required in app
            drawRequired: false //set to true if draw required in app
        }; //Flags set if options required on iMenu

    self.breadcrum = []; //navigation breadcrum array


    self.setImenuData = function (data) {

        iMenuData = data;
    };

    self.getImenuData = function () {

        return iMenuData;
    };

    self.getBreadcrumLength = function () {
        return breadcrum.length;
    };


    //Returns true if the iMenu is required
    self.getImenuStatus = function () {
        return required;
    };

    //status : boolean
    self.setImenuStatus = function (status) {
        required = status;
    };

    self.setMenuIndex = function (i) {
        menuIndex = i;
    };

    self.setItemIndex = function (i) {
        itemIndex = i;
    };

    self.setNumOfListItems = function (numOfItems) {
        //Crop the number of list item to the maximum allowed if there are too many
        numOfListItems = numOfItems <= MAX_LIST_ITEMS ? numOfItems : MAX_LIST_ITEMS;
    };

    self.setMenuId = function (id) {
        menuId = id;
    };

    self.setiMenuXPos = function (x) {
        iMenuXPos = x;
    };

    self.setiMenuYPos = function (y) {
        iMenuYPos = y;
    };

    self.getMenuIndex = function () {
        return menuIndex;
    };

    self.getItemIndex = function () {
        return itemIndex;
    };

    self.getMenuId = function () {
        return menuId;
    };

    self.getiMenuXPos = function () {
        return iMenuXPos;
    };

    self.getiMenuYPos = function () {
        return iMenuYPos;
    };

    self.getNumOfListItems = function () {

        return numOfListItems;
    };

    self.getLaunchMenu = function () {
        return iMenuData.launchMenu;
    };

    self.returnMenuId = function (menuName) {
        var i = iMenuData.menu.length;
        while (i--) {
            if (iMenuData.menu[i].id === menuName) {
                break;
            }
        }
        return i;
    };

    self.pushBreadcrum = function (menuName) {
        //add a menu to the breadcrum trail
        self.breadcrum.push(menuName);
    };

    self.popBreadcrum = function (menuName) {
        //pop() removes the last item in the array
        self.breadcrum.pop();
    };

    self.getTickerStatus = function () {
        //"on" or "off"
        return tickerStatus.status;
    };

    self.setTickerStatus = function (status) {
        //"on" or "off"
        tickerStatus.status = status;
    };

    self.getTickerFlags = function () {
        return tickerStatus;
    };

    self.setCurrentTickerFlag = function (index, selectedFlag) {

        tickerStatus[index] = selectedFlag;

    };

    self.getCurrentTickerFlag = function (index) {

        return tickerStatus[index];

    };


    self.setTickItemFlag = function (flag) {
        tickItemFlag = flag; //Boolean
    };

    self.getTickItemFlag = function () {
        return tickItemFlag; //boolean
    };


    /*
     * Set and get requirement status values for
     * iMenu functions
     */

    self.setRequirements = function () {
        var found = false;
        var TYPESTRING_SCREEN = "screen://";
        var TYPESTRING_VIDEOMENU = "matrix://";
        var TYPESTRING_MENU = "menu://";
        var TYPESTRING_STATS = "stats://";
        var TYPESTRING_ALERT = "alert://";
        var TYPESTRING_TICKER = "ticker://";
        var TYPESTRING_TIVOHELP = "help://";
        var TYPESTRING_DRAW = "draw://";
        //iterate through the data and check to see if a draw link is set
        for (var j = 0; j < iMenuData.menu.length; ++j) {
            for (var i = 0; i < iMenuData.menu[j].item.length; ++i) {
                var attr = iMenuData.menu[j].item[i].href;
                if (attr.indexOf(TYPESTRING_DRAW) === 0) {
                    iMenuModel.setDrawRequired(true);
                } else if (attr.indexOf(TYPESTRING_TICKER) === 0) {
                    iMenuModel.setTickerRequired(true);
                } else if (attr.indexOf(TYPESTRING_ALERT) === 0) {
                    iMenuModel.setAlertsRequired(true);
                } else if (attr.indexOf(TYPESTRING_STATS) === 0) {
                    iMenuModel.setStatsRequired(true);
                }
            }
        }

    };

    self.getTickerRequired = function () {
        return appRequirements.tickerRequired;
    };
    self.getAlertsRequired = function () {
        return appRequirements.alertsRequired;
    };
    self.getStatsRequired = function () {
        return appRequirements.statsRequired;
    };
    self.getDrawRequired = function () {
        return appRequirements.drawRequired;
    };

    self.setTickerRequired = function (required) {
        appRequirements.tickerRequired = required;
    };
    self.setAlertsRequired = function (required) {
        appRequirements.alertsRequired = required;
    };
    self.setStatsRequired = function (required) {
        appRequirements.statsRequired = required;
    };
    self.setDrawRequired = function (required) {
        appRequirements.drawRequired = required;
    };
    self.setAlertStatus = function (status) {
        alertStatus = status;
    };


    self.setAlertStatus = function (status) {
        alertStatus = status;
    };

    self.getAlertStatus = function () {
        return alertStatus;
    };

    self.getAlertDisplayStatus = function () {
        return alertOnDisplay;
    };

    self.setAlertDisplayStatus = function (status) {
        alertOnDisplay = status;
    }

    self.showInfoIcon = function () {
        var infoIcon = document.getElementById("iMenuButton");
        if (infoIcon) {
            infoIcon.style.visibility = "visible";
        }
        return;
    }


}

/** 
 * @desc RtuModel holds the functions for real-time updates
 * examples include getRtuData(),setVmDataVersion(),getImenuDataVersion()
 * @author Neil Cooper neil.cooper@sky.uk
 * @required 
 */

var RtuModel = function () {
    "use strict";

    /* Object to store the rtu JSON data posted by the Kestrel Console  */
    var rtuData = {},
        /*
         * Initialise the version values these will store the last
         * rtu data values for comparison with the new ones.
         */
        vmDataVersion = 0, //Verson of the video menu data
        iMenuDataVersion = 0, //Version of the iMenu data
        alertDataVersion = 0, //Version of the alert data
        tickerDataVersion = 0, //Version of the ticker data
        firstLoad = true; // Is this the first time the Real Time Update has been loaded?

    /**
     * @desc sets flag depending on if rtu data has been loaded 
     * for the first time
     * @param bool (flag)
     * @return bool - true if first time
     */
    this.isFirstTime = function (flag) {
        if (flag === false) {
            firstLoad = flag;
        }
        return firstLoad;
    }

    /**
     * @desc sets the video menu data version. This number is incremented
     * if new data is available.
     * @param integer vm - the video menu version number
     * @return integer - version number
     */
    this.setVmDataVersion = function (vm) {
        vmDataVersion = vm;
    };

    /**
     *
     */
    this.setImenuDataVersion = function (im) {
        iMenuDataVersion = im;
    };
    this.setAlertDataVersion = function (ad) {
        alertDataVersion = ad;
    };
    this.setTickerDataVersion = function (td) {
        tickerDataVersion = td;
    };
    this.setRtuData = function (data) {
        rtuData = data;
    };

    this.getVmDataVersion = function () {
        return vmDataVersion;
    };
    this.getImenuDataVersion = function () {
        return iMenuDataVersion;
    };
    this.getAlertDataVersion = function () {
        return alertDataVersion;
    };
    this.getTickerDataVersion = function () {
        return tickerDataVersion;
    };

    this.getRtuData = function () {
        return rtuData;
    };


};

/**
 * @desc SportsAppModel() Sports Application data model
 */
var SportsAppModel = function () {

    var CONFIG_URL = "config.json"; //URL of config data
    var currentFocus = "videoMenu"; //Item or screen with focus
    var lastFocus = ""; //Item or screen that had focus last (for backup purposes)

    var keyPressEnabled = true; //If true, the user input is processed

    var self = this; //Putting this into self gets away from problems with timers etc. referencing the window object

    /*
     Getters for sports application data
    */

    //Get the object name that currently has focus
    self.getCurrentFocus = function () {
        return currentFocus;
    };

    //Get the object name that last had focus
    self.getLastFocus = function () {
        return lastFocus;
    };

    //Returns true if key presses are enabled
    self.getKeyPressEnabled = function () {
        return keyPressEnabled;
    };

    //Returns 1 if an HD channel is used, otherwise 0
    this.getIsHD = function () {
        return this.isHD;
    };


    /*
     Setters for sports application data
    */

    //Set the current focus
    self.setCurrentFocus = function (o) {
        /*
         * set to:
         * "videoMenu","iMenu", "alerts", "draw" or "help"
         */

        self.setLastFocus(currentFocus);
        currentFocus = o;
    };

    //Set the focus history
    self.setLastFocus = function (o) {
        /*
         * set to:
         * "videoMenu","iMenu", "alerts" or "help"
         */
        lastFocus = o;
    };

    //Set keypresses enabled true/false
    self.setKeyPressEnabled = function (flag) {
        keyPressEnabled = flag;
    };


    //set isHD flag
    self.setIsHD = function (isHDChannel) {
        this.isHD = isHDChannel;
    };


}

/**
 * @desc TickerModel() News Ticker data model
 */
var TickerModel = function () {

    var tickerData = {};
    var tickTimer; //Interval timer for ticker movement
    var animationRequest;
    var tickerStopped = true;
    var tickerWidth;
    var tickerIndex;

    /**
     * @desc setTickerData() sets the news ticker data to be displayed
     * @param {string} data - the message to be displayed
     */
    this.setTickerData = function (data) {

        tickerData = data;
    };

    /**
     * @desc setTickerIndex() sets the index value for the required ticker data
     * @param {integer} index - The ticker data index
     */
    this.setTickerIndex = function (index) {
        tickerIndex = index;
    };

    /**
     * @desc getTickerIndex() returns the index number of the current news ticker in the json data
     * @return {integer} tickerIndex - index value
     */
    this.getTickerIndex = function () {
        return tickerIndex;
    };

    /**
     * @desc getTickerHeader() returns the header text of the current news ticker
     * @param {integer} index - The ticker data index
     * @return {string} tickerData.data[tickerIndex].header - header text
     */
    this.getTickerHeader = function (tickerIndex) {
        //only if ticker available
        return tickerData.data[tickerIndex].header;
    };

    /**
     * @desc getTickerBody() returns the header text of the current news ticker
     * @param {integer} index - The ticker data index
     * @return {string} tickerData.data[tickerIndex].body - ticker body text
     */
    this.getTickerBody = function (tickerIndex) {
        return tickerData.data[tickerIndex].body;
    };

    /**
     * @desc setTickerStopped() sets the status of the ticker to stopped
     * @param {boolean} status - true if ticker set to stop
     */
    this.setTickerStopped = function (status) {
        tickerStopped = status;
    };

    /**
     * @desc getTickerStopped() returns started/stopped status of ticker
     * @return {boolean} tickerStopped - true if ticker set to stop
     */
    this.getTickerStopped = function () {
        return tickerStopped;
    };

}


/**
 * @desc VideoMenuModel() News Ticker data model object
 */
var VideoMenuModel = function () {

    //initialise variables on instantiation 
    var keyPressEnabled = true,
        direction = "",
        boxTopPos = 100,
        vboxLeftPos = 100,
        targetVisible = false,
        self = this,
        videoMenuIndex = 0,
        matrixOption = 0,
        multiAudio = false,
        multiAudioToggleVal = 0,
        oIndex = 0,
        currMenuAudio,
        audioStreamId = 0,
        videoMenuConfig = {};

    /**
     * @desc targetVisible() flag for target box visibility
     * @param {boolean} visibility - true if visible
     */
    self.targetVisible = function (visibility) {
        targetVisible = visibility;
    };

    /**
     * @desc setVideoMenuConfig() sets the configuration data for the video menu
     * @param {json} data - video menu configuration
     */
    self.setVideoMenuConfig = function (data) {
        videoMenuConfig = data;
    };

    /**
     * @desc getVideoMenuConfig() sets the configuration data for the video menu
     * @return {json} videoMenuConfig.videoMenu - video menu configuration
     */
    self.getVideoMenuJSON = function () {
        return videoMenuConfig.videoMenu;
    };

    /**
     * @desc setVideoMenuIndex() sets the index value to point to a specific video menu in the config data
     * @param {integer} index - video menu index value
     */
    self.setVideoMenuIndex = function (index) {
        videoMenuIndex = index;
    };

    /**
     * @desc setMatrixOption() sets the video matrix option index value (matrixOption)
     * @param {integer} oIndex - video menu matrix option index value
     */
    self.setMatrixOption = function (oIndex) {
        matrixOption = oIndex;
    };

    /**
     * @desc getMultiAudioToggle() returns the multiple audio toggle value (F1 Only)
     * @return {integer} multiAudioToggleVal - returns either 1 or 0 for toggle value
     */
    self.getMultiAudioToggle = function () {
        return multiAudioToggleVal;
    };

    /**
     * @desc setMultiAudioToggle() sets the multiple audio toggle value (multiAudioToggleVal) (F1 Only)
     * @param {integer} toggleVal - 1 or 0 to switch multiaudio on/off
     */
    self.setMultiAudioToggle = function (toggleVal) {
        multiAudioToggleVal = toggleVal;
    }

    /**
     * @desc setMultiAudioFlag() sets the multiple flag value (multiAudio)
     * @param {boolean} flag - true if multiple audio available
     */
    self.setMultiAudioFlag = function (flag) {
        multiAudio = flag;
    };

    /**
     * @desc setOindex() sets the video menu option index value (oIndex)
     * @param {integer} i - index of the required video menu option
     */
    self.setOindex = function (i) {
        oIndex = Number(i);
    };

    /**
     * @desc setOindex() sets the current audio stream id (audioStreamId)
     * @param {integer} id - audio stream id 0-8
     */
    self.setCurrMultiAudio = function (id) {
        audioStreamId = id;
    };

    /**
     * @desc setOindex() returns the current audio stream id (audioStreamId)
     * @return {integer} audioStreamId - audio stream id 0-8
     */
    self.getCurrMultiAudio = function () {
        return audioStreamId;
    };

    /**
     * @desc setOindex() stores the current menu audio id (currMenuAudio)
     * @param {integer} id - audio stream id 0-8
     */
    self.setCurrMenuAudio = function (id) {
        currMenuAudio = id;
    };

    /**
     * @desc getCurrMenuAudio() returns the current menu audio id
     * @return {integer} currMenuAudio - audio stream id 0-8
     */
    self.getCurrMenuAudio = function () {
        return currMenuAudio;
    };

    /**
     * @desc getMultiAudioFlag() returns the current menu audio id
     * @return {integer} multiAudio - true if multiple audio available
     */
    self.getMultiAudioFlag = function () {
        return multiAudio;
    };

    /**
     * @desc getVideoMenuIndex() returns the current video menu index
     * @return {integer} videoMenuIndex - Index of current video menu in JSON data
     */
    self.getVideoMenuIndex = function () {
        return videoMenuIndex;
    };

    /**
     * @desc getMatrixOption() returns the Matrix Option index value
     * @return {integer} matrixOption - index of option in video menu matrix
     */
    self.getMatrixOption = function () {
        return matrixOption;
    };

    /**
     * @desc getVideoMenuConfig() returns all the video menu config data
     * @return {JSON} videoMenuConfig - video menu config data
     */
    self.getVideoMenuConfig = function () {
        return videoMenuConfig;
    };

    /**
     * @desc getVideoMenuOptionNav() Takes the current video menu, current selected matrix option
     * and direction, then returns the index of the next video option depending on the direction chosen
     * using data in the video menu configuration.
     * @param {integer} index - video menu index value
     * @param {integer} oIndex - video menu option index value
     * @param {string} direction - direction chosen by user ("UP","DOWN","LEFT","RIGHT")
     * @return {integer} retIndex - new option position index to move target to.
     */
    self.getVideoMenuOptionNav = function (index, oIndex, direction) {

        var retIndex; //The index value to be returned

        switch (direction) {
        case "LEFT":
            retIndex = videoMenuConfig.videoMenu[index].matrix.option[oIndex].l;
            break;
        case "RIGHT":
            retIndex = videoMenuConfig.videoMenu[index].matrix.option[oIndex].r;
            break;
        case "UP":
            retIndex = videoMenuConfig.videoMenu[index].matrix.option[oIndex].u;
            break;
        case "DOWN":
            retIndex = videoMenuConfig.videoMenu[index].matrix.option[oIndex].d;
            break;
        }

        return retIndex;

    };


    /**
     * @desc getMultiAudio() Returns multiple audio configuration data if it is defined
     * @return {JSON || boolean} videoMenuConfig.ma - multiple Audio data or false (if not defined)
     */
    self.getMultiAudio = function () {

        return (videoMenuConfig.ma !== "" && videoMenuConfig.ma !== null && videoMenuConfig.ma !== undefined) ? videoMenuConfig.ma : false;

    };

    /**
     * @desc getOindex() Returns the current video menu option index
     * @return {integer} oIndex - option index
     */
    self.getOindex = function () {
        return oIndex;
    };


}

/**
 * @desc showLoadingAnim() Sets visibility css style of loading animation to visible
 * to display animated image on screen
 */
var showLoadingAnim = function () {
    console.log("show loading animation");
    var loading = document.getElementById("loadingAnim");
    loading.style.visibility = "visible";
};

/**
 * @desc hideLoadingAnim() Sets visibility css style of loading animation to hidden
 * to hide animated image
 */
var hideLoadingAnim = function () {
    console.log("hide loading animation");
    var loading = document.getElementById("loadingAnim");
    loading.style.visibility = "hidden";
};