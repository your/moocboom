angular.module('MyApp')
  .controller('MainCtrl', ['$rootScope', '$scope', '$http', 'Mooc', 'Deadline', function($rootScope, $scope, $http, Mooc, Deadline) {


    $scope.headingTitle = 'My Upcoming Deadlines';

    $scope.moocs = Mooc.query();

      $scope.deadlines = Deadline.query();
      console.log($scope.deadlines);


      $scope.filterByGenre = function(utag) {
      $scope.moocs = Mooc.query({ utag: utag });
      $scope.headingTitle = utag;
    };

    $scope.filterByAlphabet = function(char) {
      $scope.moocs = Mooc.query({ alphabet: char });
      $scope.headingTitle = char;
    };

      $scope.popover = {
        "title": "Title",
        "content": "Hello Popover<br />This is a multiline message!"
      };


      var values = {};

      $scope.popover = function(a) {
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
      $scope.isAlarmOn = function($deadline) {
        //a = Math.random();
        //console.log(a);
        //return a > 0.5? true : false;
        //console.log($deadline);
        return $deadline.alarmOn.indexOf($rootScope.currentUser._id) !== -1;
      };

      $scope.alarmOn = function(deadline) {
        return $http.post('/api/alarmon', { deadId: deadline._id }).success(function () {
          deadline.alarmOn.push($rootScope.currentUser._id);
          //$scope.deadlines.push(deadline);
          //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
        });
      }

      $scope.alarmOff = function(deadline) {
        return $http.post('/api/alarmoff', { deadId: deadline._id }).success(function () {
          deadline.alarmOn.pop($rootScope.currentUser._id);
          //$scope.deadlines.push(deadline);
          //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
        });
      }

      $scope.isSubsOn = function($deadline) {
        //a = Math.random();
        //console.log(a);
        //return a > 0.5? true : false;
        //console.log($deadline);
        return $deadline.subsOn.indexOf($rootScope.currentUser._id) !== -1;
      };

      $scope.subsOn = function(deadline) {
        return $http.post('/api/subson', { deadId: deadline._id }).success(function () {
          deadline.subsOn.push($rootScope.currentUser._id);
          //$scope.deadlines.push(deadline);
          //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
        });
      }

      $scope.unsubsOn = function(deadline) {
        return $http.post('/api/unsubson', { deadId: deadline._id }).success(function () {
          deadline.subsOn.pop($rootScope.currentUser._id);
          //$scope.deadlines.push(deadline);
          //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
        });
      }

      $scope.isSubsDone = function($deadline) {
        //a = Math.random();
        //console.log(a);
        //return a > 0.5? true : false;
        //console.log($deadline);
        return $deadline.subsDone.indexOf($rootScope.currentUser._id) !== -1;
      };

      $scope.subsDone = function(deadline) {
        return $http.post('/api/subsdone', { deadId: deadline._id }).success(function () {
          $scope.unsubsOn(deadline);
          deadline.subsDone.push($rootScope.currentUser._id);
          //$scope.deadlines.push(deadline);
          //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
        });
      }

      $scope.unsubsDone = function(deadline) {
        return $http.post('/api/unsubsdone', { deadId: deadline._id }).success(function () {
          deadline.subsDone.pop($rootScope.currentUser._id);
          //$scope.deadlines.push(deadline);
          //$scope.deadlines.sessions[0].subscribers.push($rootScope.currentUser._id);
        });
      }

      $scope.sortDeadline = function(deadline) {
        var date = new Date(deadline.endDate);
        return date;
      };

      $scope.cutExpired = function(deadline) {
        if ($scope.computeLeft(deadline.endDate) > 0) return deadline;
      }

      $scope.isForThisMooc = function(deadline, mooc) {
        if (mooc.mooc._id === deadline.moocId) return deadline;
      }

      $scope.moocnow='';
      $scope.setme = function(thismooc) {
        $scope.moocnow = thismooc;
      }

      $scope.filterMooc = function(deadline) {
        return function(d) {
          return (deadline.moocId === $scope.moocnow);
        }
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

      $scope.computeStyle = function($endDate) {
        var leftsecs = $scope.computeLeft($endDate);
        var newwidth = $scope.computeWidth(leftsecs);
        var bg = $scope.computeBackground(leftsecs);

        var bgStr = '#' + bg;
        var widthStr = newwidth + "%";

        return { background: bgStr, width: widthStr };

      }

      $scope.computeLeft = function($endDate) {
        var now = moment().unix();
        return $endDate-now;
      }

      $scope.computeLeftStr = function($endDate) {

        var leftsecs = $scope.computeLeft($endDate);

        var sb = '';

        if (leftsecs > 0) {

          var weeks = Math.floor(leftsecs / SECS_1W);
          var days = Math.floor((leftsecs % SECS_1W) / SECS_1D);
          var hours = Math.floor((leftsecs % SECS_1D) / SECS_1H);
          var mins = Math.floor((leftsecs % SECS_1H) / SECS_1M);

          (weeks > 0) ? sb += (weeks.toString() + "W ") : null;
          (days > 0) ? sb += (days.toString() + "D ") : null;
          (hours > 0) ? sb += (hours.toString() + "H ") : null;
          (mins > 0) ? sb += (mins.toString() + "M") : null;
          (leftsecs < 60) ? sb += (leftsecs.toString() + "S") : null;

        } else {
          sb += ("EXP"); // what to do then?
        }

        return sb;

      }

      $scope.computeWidth = function(leftsecs) {

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


        if (newwidth <= 150) {newwidth = 15;} // dont collapse any furthur.. but check this later joe
        else {
          //newwidth = newwidth * browserWidth / 1280 ; // I choose the proportions on 1280
          newwidth = Math.floor((newwidth * 100) / browserWidth);
        }



        return newwidth;

      };

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

      $scope.computeBackground = function(leftsecs) {

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