var SportsLaunchViewer = function () {
    var SPORTSLAUNCH_URL = "sportslaunch/sportslaunch.json";
    var IMENU_URL = "imenu.json";
    var CONFIG_URL = "config.json";
    var randNum = new RandomURLNum();
    //var jsLoad = new SJAXjsonLoader();


    this.showData = function (dataType, appValue) {
        switch (dataType) {
        case "sportslaunch":
            loadJSON(SPORTSLAUNCH_URL, processSportsLaunch, function (jsonerr) {
                console.log("There has been a JSON Load problem: " + jsonerr);
            });
            break;
        case "iMenu":
            loadJSON(appValue + "/" + IMENU_URL, processImenu, function (jsonerr) {
                console.log("There has been a JSON Load problem: " + jsonerr);
            });
            break;
        case "config":
            loadJSON(appValue + "/" + CONFIG_URL, processConfig, function (jsonerr) {
                console.log("There has been a JSON Load problem: " + jsonerr);
            });
            break;
        };

    }

    //loadJson: loads JSON from given url (Asynchronous)
    var loadJSON = function (url, loadSuccess, error) {
        var jsonHR = new XMLHttpRequest();
        jsonHR.onreadystatechange = function () {
            if (jsonHR.readyState === XMLHttpRequest.DONE) {
                if (jsonHR.status === 200) {
                    if (loadSuccess) {
                        var response = jsonHR.responseText;

                        if (response.length === 0) {
                            console.log("Response length " + jsonHR.responseText.length);
                            console.log("EMPTY JSON FILE!!");
                            response = "{}";
                        }

                        try {
                            loadSuccess(JSON.parse(response));
                        } catch (e) {
                            console.error("ERROR : " + e);
                        }
                    }
                } else {
                    if (error)
                        error(jsonHR);
                }
            }
        };

        jsonHR.open("GET", url + "?" + randNum.giveMeARandomNum(), true);

        jsonHR.send();
    };

    function clearUl(id) {
        var ulToClear = document.getElementById(id);
        ulToClear.parentNode.removeChild(ulToClear);
        return;
    }

    function processConfig(data) {
        if (document.getElementById("dataList")) {
            clearUl("dataList");
        }
        var configData = data;
        var ulElement = document.createElement("ul");
        ulElement.id = "dataList";
        var liElement = document.createElement("li");
        var spanElement = document.createElement("span");
        spanElement.appendChild(document.createTextNode("polltime : " + configData.polltime));
        liElement.appendChild(spanElement);
        ulElement.appendChild(liElement);
        liElement = document.createElement("li");
        spanElement = document.createElement("span");
        spanElement.appendChild(document.createTextNode("x : " + configData.x));
        liElement.appendChild(spanElement);
        ulElement.appendChild(liElement);
        liElement = document.createElement("li");
        spanElement = document.createElement("span");
        spanElement.appendChild(document.createTextNode("y : " + configData.y));
        liElement.appendChild(spanElement);
        ulElement.appendChild(liElement);
        document.getElementById("data-body").appendChild(ulElement);
    }

    function processSportsLaunch(data) {
        if (document.getElementById("dataList")) {
            clearUl("dataList");
        }
        var sportsLaunchData = data;
        var channelList = sportsLaunchData.channels;
        var scheduleText = sportsLaunchData.schedule.replace(/\n/g, "<br />");
        var ulElement = document.createElement("ul");
        ulElement.id = "dataList";
        for (chan = 0; chan < channelList.length; chan++) {
            var spanElement = document.createElement("span");
            spanElement.className = "channelName";
            var liElement = document.createElement("li");
            spanElement.appendChild(document.createTextNode((channelList[chan].id) + " : "));
            liElement.appendChild(spanElement);
            var anchorElement = document.createElement("a");
            anchorElement.className = "channelLink";
            anchorElement.href = channelList[chan].link;
            anchorElement.appendChild(document.createTextNode(channelList[chan].link));
            liElement.appendChild(anchorElement);
            ulElement.appendChild(liElement);
        }
        var liElement = document.createElement("li");
        //liElement.appendChild(document.createTextNode("schedule : " + scheduleText));
        var spanElement = document.createElement("span");
        spanElement.className = "scheduleTitle";
        spanElement.innerHTML = "SCHEDULE : ";
        liElement.appendChild(spanElement);
        spanElement = document.createElement("span");
        spanElement.className = "scheduleBody";
        spanElement.innerHTML = "<br/>" + scheduleText;
        liElement.appendChild(spanElement);
        ulElement.appendChild(liElement);
        document.getElementById("data-body").appendChild(ulElement);
    };

    function processImenu(data) {
        if (document.getElementById("dataList")) {
            clearUl("dataList");
        }
        var iMenuData = data;
        var ulElement = document.createElement("ul");
        ulElement.id = "dataList";
        var liElement = document.createElement("li");
        liElement.className = "dataLi";
        liElement.appendChild(document.createTextNode("x : " + iMenuData.x));
        ulElement.appendChild(liElement);
        liElement = document.createElement("li");
        liElement.className = "dataLi";
        liElement.appendChild(document.createTextNode("y : " + iMenuData.y));
        ulElement.appendChild(liElement);
        liElement = document.createElement("li");
        liElement.className = "dataLi";
        liElement.appendChild(document.createTextNode("launchmenu : " + iMenuData.launchMenu));
        ulElement.appendChild(liElement);

        for (menuIndex = 0; menuIndex < iMenuData.menu.length; menuIndex++) {
            var idUlElement = document.createElement("ul");
            var idLiElement = document.createElement("li");
            idLiElement.appendChild(document.createTextNode("id : " + iMenuData.menu[menuIndex].id));
            idUlElement.appendChild(idLiElement);
            var idLiElement = document.createElement("li");
            idLiElement.innerHTML = "&nbsp;";
            for (itemIndex = 0; itemIndex < iMenuData.menu[menuIndex].item.length; itemIndex++) {
                var itemUlElement = document.createElement("ul");
                itemLiElement = document.createElement("li");
                itemLiElement.className = "itemLi";
                itemLiElement.appendChild(document.createTextNode("label : " + iMenuData.menu[menuIndex].item[itemIndex].label));
                itemUlElement.appendChild(itemLiElement);
                itemLiElement = document.createElement("li");
                itemLiElement.className = "itemLi";
                itemLiElement.appendChild(document.createTextNode("hint : " + iMenuData.menu[menuIndex].item[itemIndex].hint));
                itemUlElement.appendChild(itemLiElement);
                itemLiElement = document.createElement("li");
                itemLiElement.className = "itemLi";
                itemLiElement.appendChild(document.createTextNode("href : " + iMenuData.menu[menuIndex].item[itemIndex].href));
                itemUlElement.appendChild(itemLiElement);
                itemLiElement = document.createElement("li");
                itemLiElement.className = "itemLi";
                itemLiElement.innerHTML = "&nbsp;"
                itemUlElement.appendChild(itemLiElement);
                idLiElement.appendChild(itemUlElement);
                idUlElement.appendChild(idLiElement);
                idLiElement = document.createElement("li");
            }

            idUlElement.appendChild(idLiElement);
            liElement.appendChild(idUlElement);

        }

        document.getElementById("data-body").appendChild(ulElement);
    }

    this.init = function () {
        var links = document.getElementsByClassName("sectionListItem");

        for (var i = 0; i < links.length; i++) {
            console.log(links[i].getAttribute('data-section'));
            links[i].addEventListener('click',
                function (event) {
                    //event.preventDefault();
                    var viewer = new SportsLaunchViewer();
                    var appSelection = document.getElementById('sectionAppSelect');
                    var selectionText = appSelection.options[appSelection.selectedIndex].value;
                    console.log(this.getAttribute('data-section'));
                    viewer.showData(this.getAttribute('data-section'), selectionText);
                },
                false);
        };
    }
};


var RandomURLNum = function () {
    this.baseNum = 1;
    this.ceilNum = 99999;
    this.rndResult = 0;

    this.giveMeARandomNum = function () {
        this.rndResult = Math.floor((Math.random() * this.ceilNum) + this.baseNum);
        return this.rndResult;
    };


};