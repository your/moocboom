angular.module('MyApp')
    .controller('MainCtrl', ['$rootScope', '$scope', '$http', '$log', 'Mooc', 'Deadline', function ($rootScope, $scope, $http, $log, Mooc, Deadline) {


        $scope.headingTitle = 'My Upcoming Deadlines';

        $scope.moocs = Mooc.query();

        $scope.deadlines = Deadline.query();
        console.log($scope.deadlines);


        $scope.filterByGenre = function (utag) {
            $scope.moocs = Mooc.query({utag: utag});
            $scope.headingTitle = utag;
        };

        $scope.filterByAlphabet = function (char) {
            $scope.moocs = Mooc.query({alphabet: char});
            $scope.headingTitle = char;
        };

        $scope.init = setInterval(function(){
            $scope.$apply();
        }, 1000);


        /*
         // Without JQuery
         var slider = new Slider("#ex11", {
         step: 20000,
         min: 0,
         max: 200000
         });


         // For non-getter methods, you can chain together commands
         slider
         .setValue(5)
         .setValue(7);

         // Call a method on the slider
         var value = slider.getValue();*/

        $scope.popover = {
            "title": "Title",
            "content": "Hello Popover<br />This is a multiline message!"
        };


        var values = {};

        $scope.popover = function (a) {
            return a;
        }
        $scope.popover = {
            "title": '',
            "content": "s"
        }

        $scope.tooltip = [
            "Set e-mail reminder!",
            "E-mail reminder is set! --- (WARNING: if you click again it'll be UNSET!)",
            "Work this deadline NOW!",
            "You are working on this... --- Click again when you'll have submitted your assessment!",
            "You have submitted this assessment! --- (Click again to RESET the status)",
            "Click to open this assessment page!"
        ];
        /* TODO: check this. throws errors but works.. with:

         in the ng-repeat of the deadlines

         <button type="button" class="btn btn-default" name="{{deadline.id}}" ng-model="isSubsOn(deadline)" bs-checkbox>Toggle</button>
         */
        $scope.isAlarmOn = function ($deadline) {
            //a = Math.random();
            //console.log(a);
            //return a > 0.5? true : false;
            //console.log($deadline);
            return $deadline.alarmOn.indexOf($rootScope.currentUser._id) !== -1;
        };

        $scope.alarmOn = function (deadline) {
            return $http.post('/api/alarmon', {deadId: deadline._id}).success(function () {
                deadline.alarmOn.push($rootScope.currentUser._id);
                //$scope.deadlines.push(deadline);
                //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
            });
        }

        $scope.alarmOff = function (deadline) {
            return $http.post('/api/alarmoff', {deadId: deadline._id}).success(function () {
                deadline.alarmOn.pop($rootScope.currentUser._id);
                //$scope.deadlines.push(deadline);
                //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
            });
        }

        $scope.isSubsOn = function ($deadline) {
            //a = Math.random();
            //console.log(a);
            //return a > 0.5? true : false;
            //console.log($deadline);
            return $deadline.subsOn.indexOf($rootScope.currentUser._id) !== -1;
        };

        $scope.subsOn = function (deadline) {
            return $http.post('/api/subson', {deadId: deadline._id}).success(function () {
                deadline.subsOn.push($rootScope.currentUser._id);
                //$scope.deadlines.push(deadline);
                //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
            });
        }

        $scope.unsubsOn = function (deadline) {
            return $http.post('/api/unsubson', {deadId: deadline._id}).success(function () {
                deadline.subsOn.pop($rootScope.currentUser._id);
                //$scope.deadlines.push(deadline);
                //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
            });
        }

        $scope.isSubsDone = function ($deadline) {
            //a = Math.random();
            //console.log(a);
            //return a > 0.5? true : false;
            //console.log($deadline);
            return $deadline.subsDone.indexOf($rootScope.currentUser._id) !== -1;
        };

        $scope.subsDone = function (deadline) {
            return $http.post('/api/subsdone', {deadId: deadline._id}).success(function () {
                $scope.unsubsOn(deadline);
                deadline.subsDone.push($rootScope.currentUser._id);
                //$scope.deadlines.push(deadline);
                //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
            });
        }

        $scope.unsubsDone = function (deadline) {
            return $http.post('/api/unsubsdone', {deadId: deadline._id}).success(function () {
                deadline.subsDone.pop($rootScope.currentUser._id);
                //$scope.deadlines.push(deadline);
                //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
            });
        }

        $scope.sortDeadline = function (deadline) {
            var date = new Date(deadline.endDate);
            return date;
        };

        $scope.cutExpired = function (deadline) {
            if ($scope.computeLeft(deadline.endDate) > 0) return deadline;
        }

        $scope.isForThisMooc = function (deadline, mooc) {
            if (mooc.mooc._id === deadline.moocId) return deadline;
        }

        $scope.moocnow = '';
        $scope.setme = function (thismooc) {
            $scope.moocnow = thismooc;
        }

        $scope.filterMooc = function (deadline) {
            return function (d) {
                return (deadline.moocId === $scope.moocnow);
            }
        }

        $scope.getLocalDate = function($endDate){
            return moment.unix($endDate).local();
        }
        //
        // Find a representation like: 1w 2d 14h 5m
        // (no intln for now)
        //
        var SECS_1M = 60;
        var SECS_1H = 3600;
        var SECS_6H = SECS_1H * 6;
        var SECS_1D = SECS_1H * 24;
        var SECS_3D = SECS_1D * 3;
        var SECS_1W = SECS_1D * 7;
        var SECS_2W = SECS_1W * 2;

        //
        // How many secs to represent in one pixel?
        // (anyway I switch to percentages then)
        //
        var RAPPR_STEP_1H = 60; // <1h : 1px = ?min orig:60 - 1min
        var RAPPR_STEP_6H = 200; // <6h : 1px = ?min orig:300
        var RAPPR_STEP_1D = 600; // <1d : 1px = 15min
        var RAPPR_STEP_3D = 900; // <3d : 1px = 20min
        var RAPPR_STEP_1W = 3600; // <1w : 1px = 25min
        var RAPPR_STEP_2W = 7200; // <1w : 1px = 25min
        var RAPPR_STEP_XN = 14400; // >1w : 1px = 30min

        var PIX_1H = SECS_1H / RAPPR_STEP_1H; // 60
        var PIX_6H = SECS_6H / RAPPR_STEP_6H; // 72
        var PIX_1D = SECS_1D / RAPPR_STEP_1D; // 96
        var PIX_3D = SECS_3D / RAPPR_STEP_3D; // 403
        var PIX_1W = SECS_1W / RAPPR_STEP_1W; // 465
        var PIX_2W = SECS_2W / RAPPR_STEP_2W; // 465

        function getWidth() {
            if (self.innerHeight) {
                return self.innerWidth;
            }

            if (document.documentElement && document.documentElement.clientHeight) {
                return document.documentElement.clientWidth;
            }

            if (document.body) {
                return document.body.clientWidth;
            }
        }




        var seekSpace = SECS_1D * 1;

        $scope.isInZone = function (zoneType, $endDate) {

            var leftsecs = $scope.computeLeft($endDate);
            var condIn;

            switch(zoneType) {
                case 'R':
                    condIn = leftsecs > ZONE_RELAX_SECS;
                    break;
                case 'W':
                    condIn = leftsecs > ZONE_DANGER_SECS && leftsecs <= ZONE_RELAX_SECS;
                    break;
                case 'D':
                    condIn = leftsecs > 0 && leftsecs <= ZONE_DANGER_SECS;
                    break;
                default:
                    return false;
            }
            return (condIn);
            // make sure size of the bar is more than min needed for cd text label
            // AND leftsecs are within the correct range
        }

        $scope.isOverflowing = function (zoneType, $endDate) {
            var wantedSize = $scope.computeZonePerc(zoneType, $endDate);
            return (wantedSize < (ZONE_MIN_PERC));
        }

        /*$scope.isInWarning = function ($endDate) {
            var leftsecs = $scope.computeLeft($endDate);
            return leftsecs > (ZONE_DANGER_SECS+seekSpace) && leftsecs < (ZONE_RELAX_SECS+seekSpace);
        }
        $scope.isInDanger = function ($endDate) {
            var leftsecs = $scope.computeLeft($endDate);
            return leftsecs > 0+seekSpace && leftsecs < (ZONE_DANGER_SECS+seekSpace);
        }*/
        $scope.isEndingNow = function ($endDate) {
            var leftsecs = $scope.computeLeft($endDate);
            return (leftsecs < (SECS_1D - (SECS_1H * 5))); // 19 ore prima
        }


        $scope.computeMinimumPerc = function() {
            $(function () {
                var progressSize = $('.progress').width();
                return Math.floor((COUNTDOWN_SIZE * 100) / progressSize);
            });
        }

        $scope.computeLeft = function ($endDate) {
            var now = moment().unix();
            return $endDate-now; // in seconds
        }


        $scope.computeLeftStr = function ($endDate) {

            var leftsecs = $scope.computeLeft($endDate);

            var sb = '';

            if (leftsecs > 0) {

                var weeks = Math.floor(leftsecs / SECS_1W);
                var days = Math.floor((leftsecs % SECS_1W) / SECS_1D);
                var hours = Math.floor((leftsecs % SECS_1D) / SECS_1H);
                var mins = Math.floor((leftsecs % SECS_1H) / SECS_1M);

                (weeks > 0) ? sb += (weeks.toString() + "W ") : null;
                (days > 0) ? sb += (days.toString() + "D ") : null;
                (leftsecs < SECS_1W && hours > 0) ? sb += (hours.toString() + "H ") : null;
                (leftsecs < SECS_1W && leftsecs < SECS_1D && mins > 0) ? sb += (mins.toString() + "M") : null;
                (leftsecs < 60) ? sb += (leftsecs.toString() + "S") : null;

            } else {
                sb += ("EXP"); // what to do then?
            }

            //sb += "\xa0\xa0";

            return sb;

        }

        ///// never change!!! or change accordingly..
        // 74px : 291px = 27% : x% => x% = 6.865979381
        var ZONE_MIN_PERC = 6.865979381;
        /////

        /// defaults
        var ZONE_RELAX_PERC = 27;
        var ZONE_RELAX_SECS = SECS_1D * 4; // default for now, then will you'll be able to set it
        // NOTE VERY WELL: THIS ONE IS THE SUM OF THE PREVIOUS ZONES MAX SECS....
        // TODO: change the name of this last variable

        var ZONE_WARNING_PERC = 54.8; // -0.2 ALWAYS, because of borders in the warning zone
        var ZONE_WARNING_SECS = SECS_1D * 3; // default for now, then will you'll be able to set it

        var ZONE_DANGER_PERC = 18;
        var ZONE_DANGER_SECS = SECS_1D * 1; // default for now, then will you'll be able to set it

        $scope.computeZone = function (zoneType, $endDate) {
            return $scope.buildWidthPercStyleStr($scope.computeZonePerc(zoneType, $endDate));
        }

        $scope.buildWidthPercStyleStr = function (percentage) {
            var widthStr = percentage + "%";
            return {width: widthStr};
        }

        ///
        $scope.computeZonePerc = function (zoneType, $endDate) {

            var lowerSecs;  // default for now, then will you'll be able to set it
            var upperSecs;
            var toSubtract;
            var zonePerc;
            var zoneSize = 0; // will return 0 if leftsecs is negative

            switch(zoneType) {
                case 'W':
                    lowerSecs = ZONE_DANGER_SECS;
                    upperSecs = ZONE_WARNING_SECS;
                    toSubtract = ZONE_DANGER_SECS;
                    zonePerc = ZONE_WARNING_PERC;
                    break;
                case 'D':
                    lowerSecs = 0;
                    upperSecs = ZONE_DANGER_SECS;
                    toSubtract = 0;
                    zonePerc = ZONE_DANGER_PERC;
                    break;
                case 'R':
                    lowerSecs = ZONE_RELAX_SECS;
                    upperSecs = SECS_1W * 2;
                    toSubtract = 0;
                    zonePerc = ZONE_RELAX_PERC;
                    break;
                default: // wtf, man.
                    return 0;

            }

            var leftsecs = $scope.computeLeft($endDate); // could be negative!

            if (leftsecs > 0) { // if not negative

                if (leftsecs > lowerSecs) { // still in the danger zone?


                    zoneSize = zonePerc * (leftsecs - toSubtract) / upperSecs; // computed percentage

                    if (zoneSize > zonePerc) {
                        zoneSize = zonePerc;
                    }

                    if (zoneSize < ZONE_MIN_PERC*2) {
                        zoneSize = ZONE_MIN_PERC*2;
                    }

                } // what if not in the danger zone? return 0 for this zone!
            }
            return zoneSize; // in %
        }

       /* $scope.computeRelaxZone = function ($endDate) {

            var endsecs = ZONE_RELAX_SECS;
            var maxsecs = SECS_1W * 2;

            var leftsecs = $scope.computeLeft($endDate); // could be negative!

            var zoneSize = 0; // will return 0 if leftsecs is negative

            if (leftsecs > 0) { // if not negative

                if (leftsecs > endsecs) { // still in the danger zone?

                    // diffmax : ZONE_DANGER_PERC = diffnow : zoneSize =>

                    zoneSize = ZONE_RELAX_PERC * leftsecs / maxsecs; // computed percentage

                    if (zoneSize > ZONE_RELAX_PERC) {
                        zoneSize = ZONE_RELAX_PERC;
                    }

                } // what if not in the danger zone? return 0 for this zone!
            }
            return $scope.computeWidth(zoneSize);
        }*/


        /*$scope.computeDangerZone = function ($endDate) {

            var endsecs = ZONE_DANGER_SECS;  // default for now, then will you'll be able to set it
            var maxsecs = ZONE_DANGER_SECS;

            var leftsecs = $scope.computeLeft($endDate); // could be negative!

            var zoneSize = 0; // will return 0 if leftsecs is negative

            if (leftsecs > 0) { // if not negative

                if (leftsecs > 0) { // still in the danger zone?

                    zoneSize = ZONE_DANGER_PERC * leftsecs / maxsecs; // computed percentage

                    if (zoneSize > ZONE_DANGER_PERC) {
                        zoneSize = ZONE_DANGER_PERC;
                    }

                } // what if not in the danger zone? return 0 for this zone!
            }
            return $scope.computeWidth(zoneSize);
        }*/


/*
        $scope.computeWidth = function (leftsecs) {

            var browserWidth = getWidth();

            var newwidth = 150; // default

            // ok, I got crazy doing these calculations but it was fun.
            // guessing what I am doing here?
            if (leftsecs > 0) {

                if (leftsecs <= SECS_1H) {
                    var range = leftsecs;
                    newwidth = Math.floor(range / RAPPR_STEP_1H);
                }

                if (leftsecs > SECS_1H && leftsecs <= SECS_6H) {
                    var range1 = leftsecs - SECS_1H;
                    var width1 = Math.floor(range1 / RAPPR_STEP_6H);
                    var range0 = SECS_1H;
                    var width0 = Math.floor(SECS_1H / RAPPR_STEP_1H);
                    newwidth = width0 + width1;
                }

                if (leftsecs > SECS_6H && leftsecs <= SECS_1D) {
                    var range2 = leftsecs - SECS_6H;
                    var width2 = Math.floor(range2 / RAPPR_STEP_1D);
                    var range1 = SECS_6H - SECS_1H;
                    var width1 = Math.floor(range1 / RAPPR_STEP_6H);
                    var range0 = SECS_1H;
                    var width0 = Math.floor(range0 / RAPPR_STEP_1H);
                    newwidth = width0 + width1 + width2;
                }

                if (leftsecs > SECS_1D && leftsecs <= SECS_3D) {
                    var range3 = leftsecs - SECS_1D;
                    var width3 = Math.floor(range3 / RAPPR_STEP_3D);
                    var range2 = SECS_1D - SECS_6H;
                    var width2 = Math.floor(range2 / RAPPR_STEP_1D);
                    var range1 = SECS_6H - SECS_1H;
                    var width1 = Math.floor(range1 / RAPPR_STEP_6H);
                    var range0 = SECS_1H;
                    var width0 = Math.floor(range0 / RAPPR_STEP_1H);
                    newwidth = width0 + width1 + width2 + width3;
                }

                if (leftsecs > SECS_3D && leftsecs <= SECS_1W) {
                    var range4 = leftsecs - SECS_3D;
                    var width4 = Math.floor(range4 / RAPPR_STEP_1W);
                    var range3 = SECS_3D - SECS_1D;
                    var width3 = Math.floor(range3 / RAPPR_STEP_3D);
                    var range2 = SECS_1D - SECS_6H;
                    var width2 = Math.floor(range2 / RAPPR_STEP_1D);
                    var range1 = SECS_6H - SECS_1H;
                    var width1 = Math.floor(range1 / RAPPR_STEP_6H);
                    var range0 = SECS_1H;
                    var width0 = Math.floor(range0 / RAPPR_STEP_1H);
                    newwidth = width0 + width1 + width2 + width3 + width4;
                }

                if (leftsecs > SECS_1W && leftsecs <= SECS_2W) {
                    var range5 = leftsecs - SECS_1W;
                    var width5 = Math.floor(range5 / RAPPR_STEP_2W);
                    var range4 = SECS_1W - SECS_3D;
                    var width4 = Math.floor(range4 / RAPPR_STEP_1W);
                    var range3 = SECS_3D - SECS_1D;
                    var width3 = Math.floor(range3 / RAPPR_STEP_3D);
                    var range2 = SECS_1D - SECS_6H;
                    var width2 = Math.floor(range2 / RAPPR_STEP_1D);
                    var range1 = SECS_6H - SECS_1H;
                    var width1 = Math.floor(range1 / RAPPR_STEP_6H);
                    var range0 = SECS_1H;
                    var width0 = Math.floor(range0 / RAPPR_STEP_1H);
                    newwidth = width0 + width1 + width2 + width3 + width4 + width5;
                }

                if (leftsecs > SECS_2W) {
                    var range6 = leftsecs - SECS_2W;
                    var width6 = Math.floor(range6 / RAPPR_STEP_XN);
                    var range5 = SECS_2W - SECS_1W;
                    var width5 = Math.floor(range5 / RAPPR_STEP_2W);
                    var range4 = SECS_1W - SECS_3D;
                    var width4 = Math.floor(range4 / RAPPR_STEP_1W);
                    var range3 = SECS_3D - SECS_1D;
                    var width3 = Math.floor(range3 / RAPPR_STEP_3D);
                    var range2 = SECS_1D - SECS_6H;
                    var width2 = Math.floor(range2 / RAPPR_STEP_1D);
                    var range1 = SECS_6H - SECS_1H;
                    var width1 = Math.floor(range1 / RAPPR_STEP_6H);
                    var range0 = SECS_1H;
                    var width0 = Math.floor(range0 / RAPPR_STEP_1H);
                    newwidth = width0 + width1 + width2 + width3 + width4 + width5 + width6;
                }

            } else {
                newwidth = 150;
            }


            if (newwidth <= 150) {
                newwidth = 15;
            } // dont collapse any furthur.. but check this later joe
            else {
                //newwidth = newwidth * browserWidth / 1280 ; // I choose the proportions on 1280
                newwidth = Math.floor((newwidth * 100) / browserWidth);
            }


            return newwidth;

        };*/

        //
        // Choose background according to left time
        // Current: http://www.colourlovers.com/palette/138026/a_beautiful_day
        //
        var BG_1H = '000';
        var BG_6H = 'F23C1F';//'FF4E50';//'FF003D';
        var BG_1D = 'F26F1D';//'FC913A';//'FC930A';
        var BG_3D = 'F2A41D';//'F9D423';//'F7C41F';
        var BG_1W = 'F2D91D';//'EDE574';//E0E05A';
        var BG_XN = 'E3E3E3';//'E1F5C4';//CCF390';

        $scope.computeBackground = function (leftsecs) {

            var bg = "000"; // default

            if (leftsecs > 0) {
                (leftsecs <= SECS_1H) ? bg = BG_1H : null;
                (leftsecs > SECS_1H && leftsecs <= SECS_6H) ? bg = BG_6H : null;
                (leftsecs > SECS_6H && leftsecs <= SECS_1D) ? bg = BG_1D : null;
                (leftsecs > SECS_1D && leftsecs <= SECS_3D) ? bg = BG_3D : null;
                (leftsecs > SECS_3D && leftsecs <= SECS_1W) ? bg = BG_1W : null;
                (leftsecs > SECS_1W) ? bg = BG_XN : null;
            }

            return bg;
        }

    }]);