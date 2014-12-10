angular.module('MyApp')
  .controller('DetailCtrl', ['$scope', '$rootScope', '$routeParams', 'Mooc', 'Deadline', 'Subscription',
    function($scope, $rootScope, $routeParams, Mooc, Deadline, Subscription) {
      $scope.deadlines = Deadline.query(); // TODO: grabs anything.. bad.



      Mooc.get({ _id: $routeParams.id }, function(mooc) {
        $scope.mooc = mooc;


        $scope.isForThisMooc = function(deadline) {
          if ($scope.mooc._id === deadline.moocId) return deadline;
        }

          $scope.isSubscribed = function () {
            return $scope.mooc.sessions[0].subscribers.indexOf($rootScope.currentUser._id) !== -1;
          };

          $scope.subscribe = function () { // TODO: I set sessions[0] BUT IT'S DANGEROUS; FIX ASAP
            Subscription.subscribe(mooc).success(function () {
              $scope.mooc.sessions[0].subscribers.push($rootScope.currentUser._id);
            });
          };

          $scope.unsubscribe = function () {
            Subscription.unsubscribe(mooc).success(function () {
              var index = $scope.mooc.sessions[0].subscribers.indexOf($rootScope.currentUser._id);
              $scope.mooc.sessions[0].subscribers.splice(index, 1);
            });
          };

          $scope.nextDeadline = $scope.deadlines.filter(function ($deadline) {
            return new Date($deadline.endDate) > new Date();
          })[0];

          $scope.convertDate = function ($date) {
            return moment($date, 'YYYY-MM-DD').format('MM/DD/YYYY');
          }

          $scope.convertDateFromUnix = function ($date) {
            return moment.unix($date).format('MM/DD/YYYY');
          }

        });
    }]);