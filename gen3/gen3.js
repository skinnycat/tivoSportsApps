/*******************************
 * SportsApp
 * @author Neil Cooper
 *
 * This is going to need a lot of re-factoring :-)
 */

var SportsApp = function () {

    //Key Codes
    var INFOBUTTON = 457,
        REDBUTTON = 0,
        iKEY = 73,

        help = new HelpPopup(),
        ticker = new Ticker(),
        iMenu = new Imenu(),
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

            // Load the iMenu configuration (if available)
            iMenu.loadImenu(false);
            sportsAppModel.setCurrentFocus("videoMenu");

            videoMenu.init(0); //initialise video menu with video menu 0
            iMenu.init(); //initialise the iMenu (if required)

            //check to see if iMenu is required. It's not worth going through all the bother
            //of setting one up if it's not even wanted, is it?
            var iMenuRequired = iMenuModel.getImenuStatus();

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


                //if (event.keyCode == 459) {
                if (event.keyCode == 48) {
                    if (iMenuModel.getImenuStatus()) {
                        iMenu.closeImenu();
                    }
                    sportsAppModel.setLastFocus(sportsAppModel.getCurrentFocus());
                    sportsAppModel.setCurrentFocus("help");
                    help.showHelpPopup();
                }

                if (event.keyCode == INFOBUTTON || event.keyCode == iKEY) {
                    if (iMenuModel.getImenuStatus()) {
                        var currentFocus = sportsAppModel.getCurrentFocus();
                        if (currentFocus != "alerts" && currentFocus != "help") {
                            //keyCode 457 : i (info) button
                            if (currentFocus != "iMenu") {
                                sportsAppModel.setLastFocus(currentFocus);
                                sportsAppModel.setCurrentFocus("iMenu");
                            }


                            iMenu.iMenuController(event.keyCode);
                        }
                    }

                } else {
                    switch (sportsAppModel.getCurrentFocus()) {

                    case "iMenu":
                        iMenu.iMenuController(event.keyCode);
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

    vmDtvLib.dax.init("Sky Sports Generic 3 (gen3)", "0.0.262");

    sportsAppModel.setIsHD(urlQuery.ishd);

    buildEvent();
}