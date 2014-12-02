module.exports =  function () {
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
				module: 'main',
				method: 'readhtml'
			}
		},
		{
			method: 'post',
			route: '/readcss',
			handler: {
				module: 'main',
				method: 'readcss'
			}
		},
		{
			method: 'post',
			route: '/getresults',
			handler: {
				module: 'main',
				method: 'getresults'
			}
		},
		{
			method: 'post',
			route: '/cleancode',
			handler: {
				module: 'main',
				method: 'cleancode'
			}
		}
	];
}
