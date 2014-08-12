'use strict';
xcss.module('xcss', ['xcss.controllers',  'xcss.services', 'ngRoute', 'ui.bootstrap'])
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/',
            {
                templateUrl: 'searchcode',
                controller: 'SearchCode'
            })
        $routeProvider
            .otherwise({redirectTo: '/'});
        $locationProvider
            .html5Mode(true);
    }]);


