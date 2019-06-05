    var onloading = function () {
        vmDtvLib.lib.init(function () {
            libLoaded();
        });
    }

    var libLoaded = function () {
        var currMenuIndex = 0,
            menuItem,
            splashURL;
        buildPage();
        document.onkeydown = function (event) {
            console.log(event.keyCode);
            switch (event.keyCode) {

            case 38: //UP
                currMenuIndex > 0 ? (
                    console.log("up"),
                    currMenuIndex--,
                    menuItem = document.querySelectorAll('.menu__item'),
                    menuItem[currMenuIndex + 1].classList.remove('menu-item-selected'),
                    menuItem[currMenuIndex].classList.add('menu-item-selected'),
                    splashURL = pageConfig.baseAppURL + pageConfig.listOfApps[currMenuIndex] + "/splash.jpg?" + Math.floor((Math.random() * 65536) + 1),
                    document.getElementById("splash-image").setAttribute("src", splashURL),
                    document.getElementById("footer").innerHTML = "Press OK to view '" + pageConfig.listOfApps[currMenuIndex] + "' " + pageConfig.listOfEvents[pageConfig.listOfApps[currMenuIndex]] + " - Use colour buttons to toggle parameters."
                ) : currMenuIndex = 0;
                console.log(pageConfig.appList[currMenuIndex]);
                break;
            case 40: //DOWN
                currMenuIndex < (pageConfig.appListLength - 1) ? (
                    console.log("down"),
                    currMenuIndex++,
                    menuItem = document.querySelectorAll('.menu__item'),
                    menuItem[currMenuIndex - 1].classList.remove('menu-item-selected'),
                    menuItem[currMenuIndex].classList.add('menu-item-selected'),
                    splashURL = pageConfig.baseAppURL + pageConfig.listOfApps[currMenuIndex] + "/splash.jpg?" + Math.floor((Math.random() * 65536) + 1),
                    document.getElementById("splash-image").setAttribute("src", splashURL),
                    document.getElementById("footer").innerHTML = "Press OK to view '" + pageConfig.listOfApps[currMenuIndex] + "' " + pageConfig.listOfEvents[pageConfig.listOfApps[currMenuIndex]] + " - Use colour buttons to toggle parameters."
                ) : currMenuIndex = pageConfig.appListLength - 1;
                console.log(pageConfig.appList[currMenuIndex]);
                break;
            case 66: //b
                console.log("Blue");
                pageConfig.toggleTestMode();
                break;
            case 406: //Blue Button
                console.log("Blue");
                pageConfig.toggleTestMode();
                break;
            case 71: //g
                console.log("Green");
                pageConfig.toggleHDMode();
                break;
            case 404: //Green Button
                pageConfig.toggleHDMode();
                break;
            case 89: //y
                console.log("Yellow");
                pageConfig.toggleDaxMode();
                break;
            case 405: //Yellow
                console.log("Yellow");
                pageConfig.toggleDaxMode();
                break;
            case 403:
            case 82: //Red
                console.log("Red");
                window.location.href = "../chanManExample.html?"+ Math.floor((Math.random() * 65536) + 1);
                break;
            case 13: //GO
                window.location.href = pageConfig.appLinks[currMenuIndex] + pageConfig.daxCommand + "&isHD=" + pageConfig.isHDFlag + "&test=" + pageConfig.testFlag + "&" + pageConfig.chanId;
                break;
            case 27: //Backup
                tivo.core.exit();
                break;
            }
        };
    }

    var pageConfig = {
        baseURL: "http://sit-tkestrel.interactive.sky.com/uatcontent/tivoextra/",
        isHD: "isHD=1",
        daxString: "vdl.dax.test=true",
        channelId: "channelID=SS1",
        appList: ["app1", "app2", "app4", "app5", "app6", "app8", "gen1", "gen2", "gen3", "gen4"],
        test: "0",
        hd: "0",
        eventList: {
            app1: "Football 1",
            app2: "Tennis US Open",
            app3: "Champions League",
            app4: "Football 2",
            app5: "Rugby",
            app6: "Tennis Masters",
            app7: "n/a",
            app8: "Formula 1",
            gen1: "Generic App 1",
            gen2: "Generic App 2",
            gen3: "Generic App 3",
            gen4: "Generic App 4"
        },
        appLinkList: [],
        get appListLength() {
            return this.appList.length;
        },
        get listOfApps() {
            return this.appList;
        },
        get listOfEvents() {
            return this.eventList;
        },
        get baseAppURL() {
            return this.baseURL;
        },
        get chanId() {
            return this.channelId;
        },
        get isHDFlag() {
            return this.hd;
        },
        get testFlag() {
            return this.test;
        },
        get daxCommand() {
            return this.daxString;
        },
        get appLinks() {
            return this.appLinkList;
        },
        set appLinks(listItem) {
            this.appLinkList = listItem;
        },
        set daxCommand(daxMode) {
            this.daxString = daxMode;

        },

        toggleTestMode: function () {
            this.test === "1" ?
                (this.test = "0", document.getElementById("testTickContainer").className = "tickBox") :
                (this.test = "1", document.getElementById("testTickContainer").className = "tickBox ticked");
            console.log(this.testFlag);

        },
        toggleHDMode: function () {
            this.hd === "1" ?
                (this.hd = "0", document.getElementById("hdTickContainer").className = "tickBox") :
                (this.hd = "1", document.getElementById("hdTickContainer").className = "tickBox ticked");

        },
        toggleDaxMode: function () {
            this.daxString === "vdl.dax.test=true" ?
                (this.daxString = "", document.getElementById("daxTickContainer").className = "tickBox") :
                (this.daxString = "vdl.dax.test=true", document.getElementById("daxTickContainer").className = "tickBox ticked");

        }


    }


    var buildPage = function () {
        var appList = pageConfig.listOfApps,
            appListLength = pageConfig.appListLength,
            eventList = pageConfig.listOfEvents;

        var menuContainer = document.getElementById("menuContainer");
        var paramContainer = document.getElementById("paramContainer");
        var menuTitleContainer = document.createElement("div");
        menuTitleContainer.className = "menu-title-container";
        var menuTitle = document.createElement("div");
        menuTitle.className = "menu__title";
        menuTitle.appendChild(document.createTextNode("Sky Sports Kestrel Applications"));
        menuTitleContainer.appendChild(menuTitle);
        menuContainer.insertBefore(menuTitleContainer, paramContainer);
        for (var listIndex = 0; listIndex < appListLength; listIndex++) {
            console.log("loop");
            var menuItem = document.createElement("div");
            listIndex === 0 ? menuItem.className = "menu__item menu-item-selected" : menuItem.className = "menu__item";
            pageConfig.appLinks[listIndex] = pageConfig.baseAppURL + appList[listIndex] + "/sportsapp.html?";
            menuItem.appendChild(document.createTextNode(eventList[appList[listIndex]]));
            menuContainer.insertBefore(menuItem, paramContainer);
        }

        document.getElementById("footer").innerHTML = "Press OK to view '" + pageConfig.listOfApps[0] + "' " + eventList[appList[0]] + " - Use colour buttons to toggle parameters.";
        splashURL = pageConfig.baseAppURL + pageConfig.listOfApps[0] + "/splash.jpg?" + Math.floor((Math.random() * 65536) + 1);
        document.getElementById("splash-image").setAttribute("src", splashURL);


    }