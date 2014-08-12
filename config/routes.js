module.exports = exports = function () {
    return [
        {
            method: 'get',
            route: '/',
            render: {
                template: 'index'
            }
        },
        {
            method: 'get',
            route: '/searchcode',
            render: {
                template: 'searchcode'
            }
        },
        {
            method: 'post',
            route: '/readhtml',
            handler: {
                module: 'routeHandlers',
                method: 'readhtml'
            }
        },
        {
            method: 'post',
            route: '/readcss',
            handler: {
                module: 'routeHandlers',
                method: 'readcss'
            }
        },
        {
            method: 'post',
            route: '/getresults',
            handler: {
                module: 'routeHandlers',
                method: 'getresults'
            }
        },
        {
            method: 'post',
            route: '/cleancode',
            handler: {
                module: 'routeHandlers',
                method: 'cleancode'
            }
        }
    ];
}
