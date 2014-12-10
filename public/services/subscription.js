angular.module('MyApp')
  .factory('Subscription', ['$http', function($http) {
    return {
      subscribe: function(mooc, user) {
        return $http.post('/api/subscribe', { moocId: mooc._id });
      },
      unsubscribe: function(mooc, user) {
        return $http.post('/api/unsubscribe', { moocId: mooc._id });
      }
    };
  }]);