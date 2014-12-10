angular.module('MyApp')
    .factory('Deadline', ['$resource', function($resource) {
        return $resource('/api/deads/:deadId');
    }]);