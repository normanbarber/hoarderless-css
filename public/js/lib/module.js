'use strict';
var xcss = xcss || {};
xcss.module = function(name, deps) {
    var module;
    deps = deps || ['xcss.services'];
    try {
        module = angular.module(name);
    }
    catch(e) {
        module = angular.module(name, deps);
    }
    return module;
};

