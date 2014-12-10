
angular.module('MyApp')
    .controller('AddCtrl', ['$route', '$scope', '$rootScope', '$routeParams', 'Mooc', 'Subscription', '$alert', '$http',
      function($route, $scope, $rootScope, $routeParams, Mooc, Subscription, $alert, $http) {


/*
      $scope.selectedState = "";
      $scope.states = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Dakota","North Carolina","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
      $scope.selectedAddress = "";*/

      /*$scope.selectedState = '';
      $scope.states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Dakota', 'North Carolina', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

      $scope.selectedIcon = '';
      $scope.icons = [
        {value: 'Gear', label: '<i class="fa fa-gear"></i> Gear'},
        {value: 'Globe', label: '<i class="fa fa-globe"></i> Globe'},
        {value: 'Heart', label: '<i class="fa fa-heart"></i> Heart'},
        {value: 'Camera', label: '<i class="fa fa-camera"></i> Camera'}
      ];*/

      $scope.onTextClick = function ($event) {
        $event.target.select();
      };

          $scope.currentUser = $rootScope.currentUser;

      $scope.selectedSession = '';
      $scope.selectedMooc = '';
      $scope.generatedMooc = '';

          $scope.loading = false;

      $scope.getMooc = function(viewValue) {
        var params = {q: 'search', query: encodeURIComponent(viewValue)};
        console.log(encodeURIComponent(viewValue));
        return $http.get('https://api.coursera.org/api/catalog.v1/courses', {params: params})
            .then(function(res) {
              return res.data.elements.map(function(mooc){
                console.log(mooc.name);
                return mooc;
              });
            });
      };

      $scope.analyzeMooc = function() {
          $scope.loading = true;
        var moocId = $scope.selectedMooc.id;
        var userId = $rootScope.currentUser._id;
        console.log(moocId);
        if (moocId && userId) {
          console.log('analyzing: ' + moocId);
          var defaultFields = 'language,shortDescription,smallIconHover,previewLink,universityLogo,instructor';
          var defaultIncludes = 'sessions';
          var params = {id: moocId, fields: defaultFields, includes: defaultIncludes};
          var activeSessions = [];
          $http.get('https://api.coursera.org/api/catalog.v1/courses', {params: params})
              .then(function (res) {
                res.data.elements.map(function (data) {
                  var sessions = data.links.sessions;
                  console.log('sessions: ' + sessions);
                  var analyzed = 0;
                  sessions.forEach(function (el) {
                    var fields = 'homeLink,startDay,startMonth,startYear,status,active,durationString';
                    var params = {id: el, fields: fields};
                    $http.get('https://api.coursera.org/api/catalog.v1/sessions', {params: params})
                        .then(function (res) {
                          res.data.elements.map(function (el) {
                            // console.log(el.id + ' is: ' + el.active + ' with status: ' + el.status);
                            // coursera non è attendibile con i campi 'active' e 'status'.... faccio in altro modo:
                            var startDate = moment(el.startYear + '-' + el.startMonth + '-' + el.startDay, "YYYY-MM-DD");
                            var durationWeeks = parseInt(el.durationString);
                            var endDate = moment(startDate).add(durationWeeks, 'weeks');
                            var nowDate = moment();
                            var inProgress = !isNaN(durationWeeks) && nowDate.isAfter(startDate) && nowDate.isBefore(endDate);
                            startDate = startDate.format('YYYY-MM-DD').toString();
                            endDate = endDate.format('YYYY-MM-DD').toString();
                            console.log('testing ' + (analyzed + 1) + '/' + sessions.length + ' : ' + el.id + ' is inProgress: ' + inProgress + ' -- S: ' + startDate + ', E: ' + endDate);
                            if (inProgress == true) {
                              var mooc = new Mooc({
                                _id: moocId,
                                name: $scope.selectedMooc.name,
                                shortName: $scope.selectedMooc.shortName,
                                description: data.shortDescription,
                                provider: 'Coursera',
                                tags: [],
                                rating: 0,
                                ratingCount: 0,
                                photo: data.smallIconHover,
                                sessions: [{
                                  //id: el.id,
                                  sessionName: el.homeLink.split('/')[3], //TODO: sanitize,
                                  startDate: new Date(startDate),
                                  endDate: new Date(endDate),
                                  active: 1,
                                  subscribers: [ $scope.currentUser._id ]
                                  //deadlines: []
                                }]
                              });
                                console.log($scope.currentUser);
                              activeSessions.push(mooc);
                            }
                            analyzed++;
                            if (sessions.length === analyzed) {
                              if (activeSessions.length > 0) {

                                var chosenSession = activeSessions.pop();

                                console.log('active session: ' + chosenSession._id);

                                $scope.selectedSession = chosenSession;
                                $scope.generatedMooc = JSON.stringify($scope.selectedSession);
                                  $scope.isChecked = true;
                                  $scope.loading = false;

                                console.log($scope.generatedMooc);
                              } else {
                                console.log('no active session found');
                              }

                            }
                          });
                        });
                  });
                });
              });
        } else { console.log('ERROR');}
      };

      $scope.alphabet = ['0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
        'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
        'Y', 'Z'];

      $scope.tags = ['Action', 'Adventure', 'Animation', 'Children', 'Comedy',
        'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Food',
        'Home and Garden', 'Horror', 'Mini-Series', 'Mystery', 'News', 'Reality',
        'Romance', 'Sci-Fi', 'Sport', 'Suspense', 'Talk Mooc', 'Thriller',
        'Travel'];

      $scope.headingTitle = 'My MOOCs';

      $scope.moocs = Mooc.query();

      $scope.filterByGenre = function(utag) {
        $scope.moocs = Mooc.query({ utag: utag });
        $scope.headingTitle = utag;
      };

      $scope.filterByAlphabet = function(char) {
        $scope.moocs = Mooc.query({ alphabet: char });
        $scope.headingTitle = char;
      };

          $scope.isChecked = false;

    $scope.addMooc = function(sendForm, addForm) {
        $scope.loading = true;
      Mooc.save({ generatedMooc: $scope.generatedMooc },
        function(response) {

            $scope.isChecked = false;
            $scope.loading = false;

            $scope.moocs.push($scope.generatedMooc);
          //$rootScope.$apply();
          //$scope.$digest();
          //$rootScope.$digest();

          $route.reload();

          console.log('lOOOOl' + $scope.generatedMooc);
          $scope.selectedMooc = '';
          $scope.generatedMooc = '';/*
          $scope.sendForm.$setPristine();*/
          sendForm.$setPristine();
          addForm.$setPristine();

          $alert({
            content: 'MOOC successfully added!',
            placement: 'top-right',
            type: 'success',
            duration: 3
          });
          console.log(response);
        },
        function(response) {

          $scope.selectedMooc = '';
          $scope.generatedMooc = '';

            $scope.isChecked = false;
            $scope.loading = false;
            /*

          $scope.sendForm.$setPristine();
          $scope.addForm.$setPristine();*/
          sendForm.$setPristine();
          addForm.$setPristine();
          $alert({
            content: response.data.message,
            placement: 'top-right',
            type: 'danger',
            duration: 3
          });
        });
    }
  }]);
