angular.module('MyApp')
  .factory('Mooc', ['$resource', function($resource) {
    return $resource('/api/moocs/:_id');
  }]);