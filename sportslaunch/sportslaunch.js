var SportsLaunch = function () {

    var VERSION = 0.2,
        scheduleBg = "background.jpg",
        catFlapCode = ["0", "5", "3", "7", "8", "7", "3", "5"], //0KESTREL
        sequenceIndex = 0;

    var loadSportsApp = function (channelID) {
        var SPORTSLAUNCH_URL = "sportslaunch.json";

        var jsLoad = new SJAXjsonLoader();
        jsLoad.loadJSON(SPORTSLAUNCH_URL,
            function (data) {
                processSportsLaunch(data, channelID);

            },
            function (jsonHR) {
                console.error("There was a problem loading the JSON data -> " + jsonHR);
            }
        );

        function processSportsLaunch(data, channelID) {
            console.log("CHANNEL ID IS: " + channelID);
            var sl = data;
            var channelList = sl.channels;
            var randNum = new RandomURLNum();

            for (chan = 0; chan < channelList.length; chan++) {
                if (channelList[chan].id == channelID) {

                    if (channelList[chan].link !== "") {
                        console.log("QueryString = " + getQueryString());
                        console.log("APP Href: " + channelList[chan].link + "&" + getQueryString());
                        window.location.href = channelList[chan].link + "&" + getQueryString() + "&" + randNum.giveMeARandomNum();
                    } else {
                        console.log("show schedule");
                        showSchedule(sl, channelID);
                    }

                    break;
                }
            }

            showSchedule(sl, channelID);

        }
    }

    var showSchedule = function (sl, channelID) {
        var scheduleArea = document.createElement('div');
        var scheduleSpan = document.createElement('span');
        var scheduleText = sl.schedule.replace(/\n/g, "<br />");
        scheduleArea.setAttribute('id', 'scheduleArea');
        document.body.appendChild(scheduleArea).appendChild(scheduleSpan).innerHTML = scheduleText;
        scheduleArea.style.visibility = "visible";

        addEventListener("keydown",
            function () {
                event.stopImmediatePropagation();
                //If Backup pressed
                (event.keyCode === 27 || event.keyCode === 66) && tivo.core.exit(); //exit to channel using tivo core exit 
                catFlapCheck(event.keyCode);
                return false;
            }
        );

    }

    function catFlapCheck(keyCode) {
        var currentEntry = String.fromCharCode(keyCode);
        console.log(sequenceIndex + " " + currentEntry);
        if (currentEntry === catFlapCode[sequenceIndex]) {
            sequenceIndex++;
            if (sequenceIndex === 8) {
                sequenceIndex = 0;
                window.location.href = "index.html";
            }
        } else {
            sequenceIndex = 0;
        }
    }


    this.init = function () {
        var channelQuery = new QueryString();
        var channelID = channelQuery.channelID;
        console.log("Channel ID: " + channelID);
        vmDtvLib.lib.init(function () {
            loadSportsApp(channelID);
        });

    }


}