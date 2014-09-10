'use strict';
xcss.module('xcss.controllers', [])
	.controller('SearchCode', function($rootScope, $log, $scope, $location,  httpService){
		function resetDefault(){
			$scope.showStepOne = true;
			$scope.showStepTwo = false;
			$scope.showStepThree = false;
			$scope.showResults = false;
			$scope.statusok = true;
			$scope.codecleaned = false;
			$scope.directory = {readhtml: '', readcss: ''};
		}
		$scope.cssdirectory;
		$scope.isLoaded = false;
		resetDefault();

		$scope.$on('$routeChangeStart', function () {
			$scope.isLoaded = false;
		});
		$scope.resetPage = function(){
			resetDefault();
		};
		$scope.readHtml = function(){

			httpService.post('/readhtml', $scope.directory)
				.success(function(data){
					$log.info('read html');
					$log.log(data);

					if(data.status === 'success'){
						$scope.statusok = true;
						$scope.showStepOne = false;
						$scope.showStepTwo = true;
						$scope.showStepThree = false;
					}else{
						$scope.statusok = false;
						$scope.errormessage = data;
					}
				})
				.error(function(error){
					$log.log('reading view service error');
				});
		};
		$scope.readCss = function(){
			$log.info($scope.directory);
			httpService.post('/readcss', $scope.directory)
				.success(function(data){
					$log.info('read css');
					$log.log(data);
					$scope.cssdirectory = $scope.directory.readcss;
					$log.info($scope.cssdirectory);
					if(data.status === 'success'){

						$scope.statusok = true;
						$scope.showStepOne = false;
						$scope.showStepTwo = false;
						$scope.showStepThree = true;

					}else{
						$scope.statusok = false;
						$scope.errormessage = data;
					}
				})
				.error(function(error){
					$log.log('read css service error');
				});
		};
		$scope.getResults = function(){

			httpService.post('/getresults', $scope.directory)
				.success(function(data){
					$log.info('at get results');
					$log.log(data);
					$scope.selectors = {};
					$scope.showStepOne = false;
					$scope.showStepTwo = false;
					$scope.showStepThree = false;
					$scope.showResults = true;
					$scope.statusok = true;
					$scope.selectors.classes = data.classes;
					$scope.selectors.ids = data.ids;
					$scope.selectors.tags = data.tags;
					$scope.selectors.advanced = data.advanced;
					$scope.selectors.cssfilenames = data.filenames;
                    $scope.cleanCode();
				})
				.error(function(error){
					$log.log('get results service error');
				});
		};
		$scope.cleanCode = function(){
			$scope.statusok = true;
			$scope.codecleaned = true;
			httpService.post('/cleancode')
				.success(function(data, status, headers){
					$log.info('at cleancode css');
					$log.log(data);
					if(data.status === 'success'){

						$scope.showResults = false;
					}else{
						$scope.statusok = false;
						$scope.errormessage = data;
					}
				})
				.error(function(error){
					$log.log('read css service error');
				});
		};
	});