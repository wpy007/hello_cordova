var controllers = angular.module('rescue.controllers', ['ionic', 'ui.router']);

//登录
controllers.controller('LoginCtrl', function($scope, $rootScope, $state, $ionicPopup, LoginService, $ionicLoading, $timeout, $cordovaNetwork, RscService, BasicService) {

	$scope.data = {};
	if(localStorage.FRTAUTO_RSCAPP_USRNAME != null || localStorage.FRTAUTO_RSCAPP_USRNAME != 'undefined') {
		$scope.data.username = localStorage.FRTAUTO_RSCAPP_USRNAME;
	}

	//localStorage.FRTAUTO_RSCAPP_SAVEPWD = true;
	if(localStorage.FRTAUTO_RSCAPP_SAVEPWD) {
		$scope.data.password = localStorage.FRTAUTO_RSCAPP_USRPWD;
	}

	//以前已经登录
	if(localStorage.FRTAUTO_RSCAPP_LOGINSTATE == 1) {
		$scope.data.password = localStorage.FRTAUTO_RSCAPP_USRPWD;
	}

	//输入密码登录
	$scope.login = function() {
		if(localStorage.NetworkState == 'none') {
			try {
				window.plugins.toast.showShortCenter('当前网络不可用，请检查您的网络设置！');
			} catch(e) {
				alert("当前网络不可用，请检查您的网络设置！");
			}
			return;
		}
		//判空
		var checkValid = function() {
			if($scope.data.username == null || $scope.data.username == "" ||
				$scope.data.password == null || $scope.data.password == "") {

				try {
					window.plugins.toast.showLongCenter('亲，请填写有效的用户名密码！');
				} catch(e) {
					var alertPopup = $ionicPopup.alert({
						title: '登录',
						template: '亲，请填写有效的用户名密码！',
						okType: 'alert-ok'
					});
				}
				return false;
			}
			//后台服务器获取不到 字符 '#'、'+'
			if($scope.data.username.indexOf('#') >= 0 ||
				$scope.data.username.indexOf('+') >= 0 ||
				$scope.data.password.indexOf('#') >= 0 ||
				$scope.data.password.indexOf('+') >= 0) {

				try {
					window.plugins.toast.showLongCenter("亲，不能含有以下特殊字符哦！ 如：'#','+',...");
				} catch(e) {
					var alertPopup = $ionicPopup.alert({
						title: "登录",
						template: "亲，不能含有以下特殊字符哦！ 如：'#','+',...",
						okType: 'alert-ok'
					});
				}
				return false;
			}

			return true;
		}

		if(!checkValid()) {
			return;
		}

		$ionicLoading.show({
			template: '正在登录...'
		});

		setTimeout(function() {
			LoginService.login($scope.data.username, $scope.data.password)
				.success(function(data) {
					$ionicLoading.hide();

					if(localStorage.FRTAUTO_RSCAPP_LOGINSTATE == 1) {
						BasicService.GetGeoLocation(function(bdPoint) {
							RscService.UpdateMySite(bdPoint.lng, bdPoint.lat, 'Login');
						})
						//登录成功
						$state.go("vehselect");
					} else {
						try {
							window.plugins.toast.showLongCenter("登录失败! " + data);
						} catch(e) {
							var alertPopup = $ionicPopup.alert({
								title: "登录",
								template: "登录失败！" + data,
								okType: 'alert-ok'
							});
						}
					}
				})
				.error(function(data) {
					$ionicLoading.hide();

					try {
						window.plugins.toast.showLongCenter("登录失败, 请检查您填写的登陆信息！");
					} catch(e) {
						var alertPopup = $ionicPopup.alert({
							title: "登录",
							template: "登录失败, 请检查您填写的登陆信息！",
							okType: 'alert-ok'
						});
					}
				});
		}, 200);
	}

	$scope.ClearInput = function(param) {
		switch(param) {
			case 'data.username':
				$scope.data.username = '';
				$scope.data.password = '';
				break;
			case 'data.password':
				$scope.data.password = '';
				break;
			default:
				break;
		}
	}

});
//车辆选择
controllers.controller('VehSelectCtrl', function($scope, $rootScope, $state, $ionicLoading, $ionicModal, RscService, $ionicPopup) {

	$scope.data = {};
	$scope.data.ASSETS_NO = localStorage.FRTAUTO_RSCAPP_EMP_CARNO;
	$scope.data.ASSETS_TYPE = localStorage.FRTAUTO_RSCAPP_EMP_CARTYPE;
	//车辆选择
	$scope.selectList = [];
	//$scope.selectListTitle = "";
	$scope.selectListTitle = "车辆选择";
	RscService.GetRscSPCarList()
		.success(function(data) {
			//      	console.log(data);
			if(data.IsSuccess) {
				$scope.selectList = data.DataList;
			}
		})
		.error();

	$scope.select = function(item, type) {
		$scope.clientInfo = item;
		//if (type == "vehNo") {
		//    $scope.selectListTitle = "车辆选择";
		//
		//    RscService.GetRscSPCarList()
		//        .success(function (data) {
		//            if (data.IsSuccess) {
		//                $scope.selectList = data.DataList;
		//            }
		//        })
		//        .error();
		//}
		$scope.modal.show();
	}

	$ionicModal.fromTemplateUrl('templates/modal.html', {
		scope: $scope,
		animation: 'slide-in-down'
	}).then(function(modal) {
		$scope.modal = modal;
	});

	$scope.updateInfo = function(info) {
		$scope.data.ASSETS_NO = info.ASSETS_NO;
		$scope.data.BV_VALUE = info.BV_VALUE;
		localStorage.FRTAUTO_RSCAPP_EMP_CARNO = info.ASSETS_NO;
		localStorage.FRTAUTO_RSCAPP_EMP_CARTYPE = info.BV_VALUE;

		$scope.modal.hide();
	};

	//当我们用完模型时，清除它！
	$scope.$on('$destroy', function() {
		$scope.modal.remove();
	});
	// 当隐藏模型时执行动作
	$scope.$on('modal.hidden', function() {
		// 执行动作
	});
	// 当移动模型时执行动作
	$scope.$on('modal.removed', function() {
		// 执行动作
	});

	$scope.GoHome = function() {
		if(localStorage.FRTAUTO_RSCAPP_EMP_CARNO == undefined ||
			localStorage.FRTAUTO_RSCAPP_EMP_CARNO == null ||
			localStorage.FRTAUTO_RSCAPP_EMP_CARNO == "") {
			try {
				window.plugins.toast.showLongCenter('请选择救援车辆！');
			} catch(e) {
				var alertPopup = $ionicPopup.alert({
					title: '车辆选择',
					template: '请选择车辆！',
					okType: 'alert-ok'
				});
			}
			return;
		}
		$ionicLoading.show({
			template: '数据更新...'
		});
		RscService.SaveVehToWKR()
			.success(function(data) {
				$ionicLoading.hide();
				if(data.IsSuccess) {
					$state.go("tab.home");
				} else {
					try {
						window.plugins.toast.showLongCenter('车辆信息保存失败！' + data.ErrCode);
					} catch(e) {
						var alertPopup = $ionicPopup.alert({
							title: '车辆选择',
							template: '车辆信息保存失败！' + data.ErrCode,
							okType: 'alert-ok'
						});
					}
				}

			})
			.error(function(data) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showLongCenter('车辆信息保存失败！' + data);
				} catch(e) {
					var alertPopup = $ionicPopup.alert({
						title: '车辆选择',
						template: '车辆信息保存失败！' + data,
						okType: 'alert-ok'
					});
				}
			});

		//$state.go("tab.home");
	}

	$scope.GotoLogin = function() {
		localStorage.removeItem("FRTAUTO_RSCAPP_USRID"); //用户USR_NO
		//localStorage.removeItem("FRTAUTO_RSCAPP_USRNAME");
		localStorage.removeItem("FRTAUTO_RSCAPP_USRORGID"); //用户ORG_NO
		localStorage.removeItem("FRTAUTO_RSCAPP_ALLUSRINFO"); //用户完整信息
		localStorage.removeItem("FRTAUTO_RSCAPP_LOGINSTATE"); //登录状态

		$state.go("login");
	}

});

//tab 主页
controllers.controller('HomeCtrl', function($scope, $rootScope, $state, $timeout, $ionicLoading, $cordovaGeolocation, LoginService, BasicService, RscService, CheckService) {

	$scope.carNo = localStorage.FRTAUTO_RSCAPP_EMP_CARNO;
	$scope.carType = localStorage.FRTAUTO_RSCAPP_EMP_CARTYPE;
	$scope.todayOrderNum = 0;
	$scope.monthOrderNum = 0;
	var IsWkrReady;

	$scope.$on('$ionicView.beforeEnter', function() {
		if(localStorage.FRTAUTO_RSCAPP_LOGINSTATE != 1) {
			$state.go("login");
		}

		//在线
		if(localStorage.FRTAUTO_RSCAPP_EMPSTATE == BasicService.Emp_State_List().READY) {
			SwitchWkrStatus(true);
		} else {
			SwitchWkrStatus(false);
		}

		$scope.currentUser = JSON.parse(localStorage.FRTAUTO_RSCAPP_ALLUSRINFO);
		$scope.avatarPath = ($scope.currentUser.USR_AVATAR_PATH && $scope.currentUser.USR_AVATAR_PATH != '') ? $scope.currentUser.USR_AVATAR_PATH : 'img/avatar.jpg';
		$scope.carNo = localStorage.FRTAUTO_RSCAPP_EMP_CARNO;
		$scope.carType = localStorage.FRTAUTO_RSCAPP_EMP_CARTYPE;

		//获取当前订单数量
		RscService.GetRscWOTotalCnt()
			.success(function(data) {
				if(data.IsSuccess) {
					var result = data.DataList[0];
					$scope.todayOrderNum = result.TODAY_CNT;
					$scope.monthOrderNum = result.MONTH_CNT;
				}
			});
	})

	$scope.doOption = function() {

		RscService.GetRscDoingCnt()
			.success(function(data) {
				if(!data.IsSuccess) {
					doExChange();
				} else {
					SwitchWkrStatus(false);
					localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY;

					try {
						window.plugins.toast.showLongCenter("您有" + data.iTotalCnt + "条未完成的救援任务！请及时处理！");

					} catch(e) {
						alert("您有" + data.iTotalCnt + "条未完成的救援任务！请及时处理！");
					}
				}
			})
			.error(function(data) {
				try {
					window.plugins.toast.showLongCenter("切换状态失败！" + data);
				} catch(e) {
					alert("切换状态失败！" + data);
				}
			});
	}
	//  LoginService.heartBeat(function(result){
	//  	console.log(123)
	//  	.success(function (data) {
	//              if (data.IsSuccess) {
	//                 console.log(result);
	//              }
	//		
	//		})
	//	});
	//待命/暂停 切换
	function doExChange() {
		$ionicLoading.show({
			template: '状态切换中...'
		});
		if(!IsWkrReady) { //暂停=>待命
			LoginService.UpdateCurrStatus(BasicService.Emp_State_List().READY)
				.success(function(data) {
					$ionicLoading.hide();
					if(data.IsSuccess) {
						SwitchWkrStatus(true);
						localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().READY; //在线
						//window.plugins.insomnia.keepAwake();//保持屏幕亮屏
						try {
							window.plugins.toast.showShortTop("您已将当前状态切换到【待命】");
						} catch(e) {}

						//主动更新位点信息
						BasicService.GetGeoLocation(function(dbPoint) {
							RscService.UpdateMySite(bdPoint.lng, bdPoint.lat, 'READY');
						});
					} else {
						try {
							window.plugins.toast.showLongCenter("切换状态失败！" + data.ErrCode);
						} catch(e) {
							alert("切换状态失败！" + data.ErrCode);
						}
					}
				})
				.error(function(data) {
					$ionicLoading.hide();
					try {
						window.plugins.toast.showLongCenter("切换状态失败！" + data);
					} catch(e) {
						alert("切换状态失败！" + data);
					}
				});
		} else { //待命=>暂停
			LoginService.UpdateCurrStatus(BasicService.Emp_State_List().BREAK)
				.success(function(data) {
					$ionicLoading.hide();

					if(data.IsSuccess) {
						SwitchWkrStatus(false);
						localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BREAK; //离开
						//window.plugins.insomnia.allowSleepAgain();//取消保持屏幕亮屏
						try {
							window.plugins.toast.showShortTop("您已将当前状态切换到【暂停】");
						} catch(e) {}
					} else {
						try {
							window.plugins.toast.showLongCenter("切换状态失败！" + data.ErrCode);
						} catch(e) {
							alert("切换状态失败！" + data.ErrCode);
						}
					}
				})
				.error(function(data) {
					$ionicLoading.hide();
					try {
						window.plugins.toast.showLongCenter("切换状态失败！" + data);
					} catch(e) {
						alert("切换状态失败！" + data);
					}
				});
		}
	}

	function SwitchWkrStatus(ready) {

		if(ready) { //待命
			IsWkrReady = true;
			$scope.wkrstatus = "待命中..."; //救援工当前状态
			$scope.btntext = "暂停"; //当前按钮显示名称
			$scope.btnclass = "button-assertive";
		} else { //暂停
			IsWkrReady = false;
			$scope.wkrstatus = "暂停"; //救援工当前状态
			$scope.btntext = "待命"; //当前按钮显示名称
			$scope.btnclass = "button-balanced";
		}
	}

	$scope.gotoHelp = function() {
		$state.go("help", {
			prev: "tab.home"
		})
	}

	if(localStorage.FRTAUTO_RSCAPP_ALLUSRINFO == null ||
		localStorage.FRTAUTO_RSCAPP_ALLUSRINFO == '' ||
		localStorage.FRTAUTO_RSCAPP_ALLUSRINFO == 'undefined') {
		localStorage.FRTAUTO_RSCAPP_LOGINSTATE = 0;
		$state.go("login");
	}
});

//proc-地图导航
controllers.controller('MapLocationCtrl', function($scope, $rootScope, $state, $stateParams, $ionicPopup, $cordovaMedia, $ionicLoading, LoginService, $ionicModal, BasicService, RscService, CheckService, $interval, $cordovaGeolocation, $timeout, $ionicActionSheet) {

	$scope.RscWOInfo = {};

	//window.plugins.insomnia.keepAwake();//保持屏幕亮屏

	//判断是否已接过单
	if($stateParams.status == 'push') { //未接单 新工单
		$scope.bBtnClose = false; //关闭按钮
		$scope.bMapDetail = true; //工单简介描述
		$scope.bMapNav = false; //导航栏按钮
		$scope.bMapGo = false; //出发按钮
		$scope.bMapArrive = false; //到达按钮
		$scope.divMapArea = false; //accept一个点的地图
		$scope.divMapAreaTwo = true; //push两个点的地图
		CountDown();    //倒计时
		//              PlayTips();     //播放提示音
	}
	// else if ($stateParams.status == 'accept' || $stateParams.status == 'manual') { //接受工单、手工派单

	// $scope.bBtnClose = true;    //关闭按钮
	// $scope.bMapDetail = false;  //工单简介描述
	// $scope.bMapNav = true;      //导航栏按钮
	// $scope.bMapGo = false;      //出发按钮
	// $scope.bMapArrive = true;   //到达按钮

	// try {
	// window.plugins.toast.showLongBottom("出发前请及时点击【出发】按钮");
	// }
	// catch (e) {
	// }
	//}
	else { //已出发
		if($stateParams.status == 'accept')
			StartOffOption();

		$scope.bBtnClose = true; //关闭按钮
		$scope.bMapDetail = false; //工单简介描述
		$scope.bMapNav = true; //导航栏按钮
		$scope.bMapGo = false; //出发按钮
		$scope.bMapArrive = true; //到达按钮
		$scope.divMapArea = true; //accept一个点的地图
		$scope.divMapAreaTwo = false; //push两个点的地图
	}

	//获取工单信息
	$ionicLoading.show({
		template: '数据加载中...'
	});
	RscService.GetRscWOMstrByWoNo($stateParams.woNo)
		.success(function(data) {
			$ionicLoading.hide();
			if(data.IsSuccess) {

				$scope.RscWOInfo = data.DataList[0];
				localStorage.FRTAUTO_RSCAPP_WO_NO = $scope.RscWOInfo.WO_NO;
				localStorage.FRTAUTO_RSCAPP_WO_FROM = $scope.RscWOInfo.WO_FROM;
				localStorage.FRTAUTO_RSCAPP_OUT_NO = $scope.RscWOInfo.OUT_SOURCE_NO;
				localStorage.DepartureTime = Date.parse($scope.RscWOInfo.KICK_OFF_DATE);
				localStorage.StartPointLng = $scope.RscWOInfo.CAR_START_LNG;
				localStorage.StartPointLat = $scope.RscWOInfo.CAR_START_LAT;
				//移到起始位置
				$scope.StartPoint();
				// 获取当前覆盖物（两个点显示在同一张地图上）
				$scope.Cover();

				//获取距离当前位置的公里数
				var start = {loc: {lng: Number($scope.RscWOInfo.TO_ADDR_LNG),lat: Number($scope.RscWOInfo.TO_ADDR_LAT)}};
				var geolocation = new BMap.Geolocation();
				geolocation.getCurrentPosition(function(r) {
					var reach = BasicService.GetMapDistance(r.point.lng, r.point.lat, start.loc.lng, start.loc.lat);
					$scope.RscWOInfo.EST_ARRIVE_MILEAGE = Math.ceil((reach * 0.001).toFixed(2));
				}, {enableHighAccuracy: true})

			} else {
				if(!CheckService.CheckErrCode(data.ErrCode, true)) {
					try {
						window.plugins.toast.showLongCenter("获取救援工单信息失败" + data.ErrCode);
					} catch(e) {
						alert("获取救援工单信息失败" + data.ErrCode);
					}
				}
			}
		})
		.error(function(error) {
			$ionicLoading.hide();
			try {
				window.plugins.toast.showLongCenter("获取救援工单信息失败");
			} catch(e) {
				alert("获取救援工单信息失败");
			}
		});

	//var isIOS = false;
	//if (ionic.Platform.isIOS()) {
	//    isIOS = true;
	//}

	$scope.Cover = function(type,point) {
        $ionicLoading.show({
            template: '获取当前位置信息...'
        });
		var map = new BMap.Map("divMapAreaTwo");
		var markers = {loc: {lng: Number($scope.RscWOInfo.FROM_ADDR_LNG),lat: Number($scope.RscWOInfo.FROM_ADDR_LAT)}};
		var to = new BMap.Point($scope.RscWOInfo.FROM_ADDR_LNG, $scope.RscWOInfo.FROM_ADDR_LAT);
		var point = new BMap.Point("");
		map.centerAndZoom(point, 10);
		map.enableScrollWheelZoom(true); //启用滚轮放大缩小，默认禁用
		map.enableContinuousZoom(); //启用地图惯性拖拽，默认禁用
		var geolocation = new BMap.Geolocation();
		geolocation.getCurrentPosition(function(r) {
			if(this.getStatus() == BMAP_STATUS_SUCCESS) {
				var mk = new BMap.Marker(r.point);
				map.panTo(r.point);
				if(r.point) {
					point_lng = r.point.lng;
					point_lat = r.point.lat;
				}
				// 复杂的自定义覆盖物
				function ComplexCustomOverlay(point, text, mouseoverText) {
					this._point = point;
					this._text = text;
					this._overText = mouseoverText;
				}
				ComplexCustomOverlay.prototype = new BMap.Overlay();
				ComplexCustomOverlay.prototype.initialize = function(map) {
					this._map = map;
					var div = this._div = document.createElement("div");
					div.style.position = "absolute";
					div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);
					div.style.background = "url(img/site1.png) no-repeat";
					div.style.width = "35px";
					div.style.height = "45px";
					div.style.left = "173px";
					div.style.top = "267px";
					div.style.padding = "0px";
					div.style.margin = "0px";
					div.style.cursor = "pointer";
					div.style.zIndex = "-6249832";
					div.style.userSelect = "none";
					var span = this._span = document.createElement("span");
					div.appendChild(span);
					span.appendChild(document.createTextNode(this._text));
					var that = this;
					var arrow = this._arrow = document.createElement("div");
					arrow.style.left = "0px";
					div.appendChild(arrow);
					map.getPanes().labelPane.appendChild(div);

					return div;
				}
				ComplexCustomOverlay.prototype.draw = function() {
					var map = this._map;
					var pixel = map.pointToOverlayPixel(this._point);
					this._div.style.left = pixel.x - parseInt(this._arrow.style.left) + "px";
					this._div.style.top = pixel.y - 30 + "px";
				}
				var myCompOverlay = new ComplexCustomOverlay(r.point, "");
				map.addOverlay(myCompOverlay);
                $ionicLoading.hide();
			} else {
				alert('failed' + this.getStatus());
			}
		}, {
			enableHighAccuracy: true
		})
		var from = new BMap.Point(point.lng, point.lat);

		// 复杂的自定义覆盖物
		function ComplexCustomOverlay(point, text, mouseoverText) {
			this._point = point;
			this._text = text;
			this._overText = mouseoverText;
		}
		ComplexCustomOverlay(from);
		ComplexCustomOverlay(to)
		ComplexCustomOverlay.prototype = new BMap.Overlay();
		ComplexCustomOverlay.prototype.initialize = function(map) {
			this._map = map;
			var div = this._div = document.createElement("div");
			div.style.position = "absolute";
			div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);
			div.style.background = "url(img/site2.png) no-repeat";
			div.style.width = "35px";
			div.style.height = "45px";
			div.style.left = "173px";
			div.style.top = "267px";
			div.style.padding = "0px";
			div.style.margin = "0px";
			div.style.cursor = "pointer";
			div.style.zIndex = "-6249832";
			div.style.userSelect = "none";
			var span = this._span = document.createElement("span");
			div.appendChild(span);
			span.appendChild(document.createTextNode(this._text));
			var that = this;

			var arrow = this._arrow = document.createElement("div");
			arrow.style.left = "0px";
			div.appendChild(arrow);
			map.getPanes().labelPane.appendChild(div);

			return div;
		}
		ComplexCustomOverlay.prototype.draw = function() {
			var map = this._map;
			var pixel = map.pointToOverlayPixel(this._point);
			this._div.style.left = pixel.x - parseInt(this._arrow.style.left) + "px";
			this._div.style.top = pixel.y - 30 + "px";
		}
		var myCompOverlay_from = new ComplexCustomOverlay(from, "");
        var myCompOverlay_to = new ComplexCustomOverlay(to, "");
		map.addOverlay(myCompOverlay_from);
        map.addOverlay(myCompOverlay_to);

	}
	//播放提示音 Play audio
	function PlayTips() {
		var src = cordova.file.applicationDirectory + "www/audio/msg.wav";
		var media = new Media(src);

		var iOSPlayOptions = {
			numberOfLoops: 2,
			playAudioWhenScreenIsLocked: false
		}

		if(localStorage.IS_IOS)
			media.play(iOSPlayOptions); // iOS only!
		else
			media.play(); // Android

		$scope.alarm = $interval(function() {
			if(localStorage.IS_IOS)
				media.play(iOSPlayOptions); // iOS only!
			else
				media.play(); // Android
		}, 3000, 9);
	}

	//倒计时
	function CountDown() {
		//30秒 倒计时
		$scope.NewItemCountDown = 30;

		function timer() {
			$scope.NewItemCountDown--;
			if($scope.NewItemCountDown <= 0) {
				try {
					//停止倒计时 停止播放提示音
					$interval.cancel($scope.countDownTimer);
					$interval.cancel($scope.alarm);
				} catch(e) {}

				//更新数据库
				RscService.ReplyForRscWOMstr($scope.RscWOInfo.WO_NO, 0, null)
					.success(function(data) {
						if(data.IsSuccess) {
							try {
								window.plugins.toast.showLongCenter("您没有回应该救援单！");
							} catch(e) {
								alert("您没有回应该救援单！");
							}

							localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().READY; //待命 可接单
							//更新状态
							LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);

							//setTimeout(function () {
							$state.go('tab.home');
							//}, 2000);
						} else {
							try {
								window.plugins.toast.showLongCenter("更新状态失败！" + data.ErrCode);
							} catch(e) {
								alert("更新状态失败！" + data.ErrCode);
							}

							localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().READY; //待命 可接单
							//更新状态
							LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
							$state.go("tab.home");
						}
					})
					.error(function(data) {
						try {
							window.plugins.toast.showLongCenter("更新状态失败！" + data);
						} catch(e) {
							alert("更新状态失败！" + data);
						}

						$state.go("tab.home");
					})
			}
			console.log("countDownTimer : " + $scope.NewItemCountDown);
		}

		$scope.countDownTimer = $interval(function() {
			timer()
		}, 1000); //30秒 倒计时
	}

	//取消
	$scope.Cancel = function() {
		$state.go('tab.list');
	}

	//接单
	$scope.Accept = function() {
		$ionicLoading.show({
			template: '接单中...'
		});

		try {
			//停止倒计时 停止播放提示音
			$interval.cancel($scope.countDownTimer);
			$interval.cancel($scope.alarm);
		} catch(e) {}

		RscService.ReplyForRscWOMstr($stateParams.woNo, 1)
			.success(function(data) {
				$ionicLoading.hide();
				if(data.IsSuccess) {

					try {
						window.plugins.toast.showLongCenter("你已接受该救援单，请及时前往！");
					} catch(e) {
						alert("你已接受该救援单，请及时前往！");
					}


					localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY; //忙碌中
					//更新状态
					LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);

					BasicService.GetGeoLocation(function(bdPoint) {
						RscService.UpdateMySite(bdPoint.lng, bdPoint.lat, 'O'); //接单
					})

					//接受
					$scope.bBtnClose = true; //关闭按钮
					$scope.bMapDetail = false; //工单简介描述
					$scope.bMapNav = true; //导航栏按钮
					$scope.bMapGo = true; //出发按钮
					$scope.bMapArrive = false; //到达按钮

					//Updated by ITKing on 2017-11-02，接单即出发
                    var confirmPopup = $ionicPopup.confirm({
                        title: '出发',
                        template: '<div class="text-center">确认立即出发 ???</div>',
                        okText: '确定',
                        okType: 'confirm-ok',
                        cancelText: '取消',
                        cancelType: 'confirm-cancel'
                    });
                    confirmPopup.then(function(res) {
                        if(res) {
                            $state.go("maplocation", {
                                status: 'accept',
                                woNo: $stateParams.woNo
                            });
                            StartOffOption();
                        }
                    });


				} else if(!CheckService.CheckErrCode(data.ErrCode, true, BasicService.Emp_State_List().READY)) {
					try {
						window.plugins.toast.showLongCenter("接单失败！" + data.ErrCode);
					} catch(e) {
						alert("接单失败！" + data.ErrCode);
					}
					$state.go("tab.home");
				}

			})
			.error(function(error) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showLongCenter("接单失败！" + error);
				} catch(e) {
					alert("接单失败！" + error);
				}

				$state.go("tab.home");
			});
	}
	//拒绝中的取消
	$scope.OrderCancel = function(item) {

		$scope.data = {
			item: item,
			reason: ''
		};

		$scope.selectList = [{
				text: '无法执行救援项目',
				value: '无法执行救援项目'
			},
			{
				text: '无法联系到客户',
				value: '无法联系到客户'
			},
			{
				text: '救援车辆出现故障',
				value: '救援车辆出现故障'
			},
			{
				text: '到客户救援地点超过1小时',
				value: '到客户救援地点超过1小时'
			},
			{
				text: '客户取消救援',
				value: '客户取消救援'
			}
		];

		/////////////////////////////////////////////
		// 取消救援工单modal
		/////////////////////////////////////////////
		$ionicModal.fromTemplateUrl('templates/cancel.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.cancel = modal;
			$scope.cancel.show();
		});
		//当我们用完模型时，清除它！
		$scope.$on('$destroy', function() {
			$scope.cancel.remove();
		});
		// 当隐藏模型时执行动作
		$scope.$on('modal.hidden', function() {
			// 执行动作
			console.log('cancel.hidden');
		});
		// 当移动模型时执行动作
		$scope.$on('modal.removed', function() {
			// 执行动作
			console.log('cancel.removed');
		});
	}
	//取消订单
	$scope.CancelRscWo = function() {
		var confirmPopup = $ionicPopup.confirm({
			title: (($scope.data.reason == '客户取消救援') ? '取消订单' : '订单退回'),
			template: '<div class="text-center">您确定' + (($scope.data.reason == '客户取消救援') ? '取消' : '退回') + '该救援工单？</div>',
			okText: '确定',
			okType: 'confirm-ok',
			cancelText: '取消',
			cancelType: 'confirm-cancel'
		});
		confirmPopup.then(function(res) {
			if(res) {
				$scope.cancel.hide();
				//              判断boolean值
				if(true) {
					//拒绝
					$scope.Refuse();
					$state.go("tab.home");
				}
			} else {
				$scope.cancel.hide();
			}
		});
	};
	//拒绝
	$scope.Refuse = function() {
		$ionicLoading.show({
			template: '拒单中...'
		});

		//停止倒计时 停止播放提示音
		try {
			$interval.cancel($scope.countDownTimer);
			$interval.cancel($scope.alarm);
		} catch(e) {}

		// RscService.ReplyForRscWOMstr($stateParams.woNo, -1)
        RscService.ReplyForRscWOMstr($stateParams.woNo,-1, $scope.data.reason)
			.success(function(data) {
				$ionicLoading.hide();
				if(data.IsSuccess) {
					try {
						window.plugins.toast.showLongCenter("你已拒绝该救援单！");
					} catch(e) {
						alert("你已拒绝该救援单！");
					}
					localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().READY; //待命 可接单
					//更新状态
					LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);

					localStorage.removeItem("FRTAUTO_RSCAPP_WO_NO");
					localStorage.removeItem("FRTAUTO_RSCAPP_WO_FROM");
					localStorage.removeItem("FRTAUTO_RSCAPP_OUT_NO");

					$state.go('tab.home');
				} else if(!CheckService.CheckErrCode(data.ErrCode, true, BasicService.Emp_State_List().READY)) {
					try {
						window.plugins.toast.showLongCenter("拒绝失败！" + data.ErrCode);
					} catch(e) {
						alert("拒绝失败！" + data.ErrCode);
					}

					$state.go("tab.home");
				}
			})
			.error(function(error) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showLongCenter("拒绝失败！" + error);
				} catch(e) {
					alert("拒绝失败！" + error);
				}

				$state.go("tab.home");
			})
	}

	//救援工出发
	$scope.StartOff = function() {

		var confirmPopup = $ionicPopup.confirm({
			title: '出发',
			template: '<div class="text-center">确认立即出发 ???</div>',
			okText: '确定',
			okType: 'confirm-ok',
			cancelText: '取消',
			cancelType: 'confirm-cancel'
		});
		confirmPopup.then(function(res) {
			if(res) {
				StartOffOption();
			}
		});
	}

	//到达现场
	$scope.Arrived = function() {

		var confirmPopup = $ionicPopup.confirm({
			title: '到达',
			template: '<div class="text-center">确认已到达故障地点 ???</div>',
			okText: '确定',
			okType: 'confirm-ok',
			cancelText: '取消',
			cancelType: 'confirm-cancel'
		});
		confirmPopup.then(function(res) {
			if(res) {
				ArrivedOption();
			}
		});
	}

	//百度导航
	$scope.BaiduNavi = function() {
		BasicService.BaiduNavi("", $scope.RscWOInfo.FROM_ADDR_LNG, $scope.RscWOInfo.FROM_ADDR_LAT);
	}

	$scope.CancelOrder = function() {
		// Show the action sheet
		var buttons = [{
			text: '取消无空驶'
		}];
		debugger;

		//出发后15分钟，测试时设为2秒
		if((Date.parse(new Date()) - localStorage.DepartureTime) > 900000) {
			//传入出发经纬度和当前经纬度获取距离
			var distance = BasicService.GetMapDistance(localStorage.StartPointLng, localStorage.StartPointLat, localStorage.longitude, localStorage.latitude);

			//距离大于1000米，测试时设为0
			if(distance >= 1000)
				buttons.push({
					text: '取消有空驶'
				});
		}

		var hideSheet = $ionicActionSheet.show({
			buttons: buttons,
			//destructiveText: 'Delete',
			//titleText: '取消工单',
			//cancelText: '返回',
			//cancel: function () {
			//    // add cancel code..
			//},
			buttonClicked: function(index) {
				var msg = "";
				var action = function() {};
				switch(index) {
					case 0:
						msg = "确认取消且无空驶？";
						action = function() {
							$state.go("tab.list", {
								woNo: localStorage.FRTAUTO_RSCAPP_WO_NO
							});
						};
						break;
					case 1:
						msg = "确认取消且有空驶（需拍摄路牌照片及工单照片）？";
						action = function() {
							$state.go("takephoto", {
								woNo: $scope.RscWOInfo.WO_NO,
								svcItem: "取消有空驶"
							});
						};
						break;
				}

				var confirmPopup = $ionicPopup.confirm({
					title: '取消工单确认',
					template: msg,
					okText: '确定',
					okType: 'confirm-ok',
					cancelText: '取消',
					cancelType: 'confirm-cancel'
				});
				confirmPopup.then(function(res) {
					if(res) {
						action();
					}
				});
			}
		});
	}

	//救援工出发 后台更新
	function StartOffOption() {
		$ionicLoading.show({
			template: '数据更新中...'
		});

		//window.plugins.toast.showLongTop("为保证订单信息准确，请勿退至后台运行且保持屏幕常亮。谢谢！");

		RscService.UpdateRscWorkerOption($stateParams.woNo, '出发')
			.success(function(data) {
				$ionicLoading.hide();
				if(data.IsSuccess) {
                        //出发时间
                        localStorage.DepartureTime = Date.parse(new Date());

                        try {
                            window.plugins.toast.showShortCenter("您已出发，请及时赶往救援现场！");
                        } catch(e) {
                            alert("您已出发，请及时赶往救援现场！");
                        }

                        BasicService.GetGeoLocation(function(bdPoint) {
                            //update by ITKing on 2017-08-01 出发点没有必要转详细地址
                            //var geoc = new BMap.Geocoder();
                            //geoc.getLocation(bdPoint, function (rs) {
                            //    var addComp = rs.addressComponents;
                            //    var currPlace = addComp.province + "|" + addComp.city + "|" + addComp.district + "|" + addComp.street + addComp.streetNumber;
                            localStorage.StartPointLng = bdPoint.lng;
                            localStorage.StartPointLat = bdPoint.lat;
                            RscService.UpdateMySite(bdPoint.lng, bdPoint.lat, 'S', "");
                            //})
                        })

                        //更改显示
                        $scope.bBtnClose = true; //关闭按钮
                        $scope.bMapDetail = false; //工单简介描述
                        $scope.bMapNav = true; //导航栏按钮
                        $scope.bMapGo = false; //出发按钮
                        $scope.bMapArrive = true; //到达按钮

				} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
					try {
						window.plugins.toast.showShortCenter("点击失败！" + data.ErrCode);
					} catch(e) {
						alert("点击失败！" + data.ErrCode);
					}
				}
			})
			.error(function(data) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showShortCenter("点击失败！" + data);
				} catch(e) {
					alert("点击失败！" + data);
				}
			});
	}

	//到达现场 后台更新
	function ArrivedOption() {
		$ionicLoading.show({
			template: '数据更新中...'
		});

		RscService.UpdateRscWorkerOption($stateParams.woNo, '到达')
			.success(function(data) {
				$ionicLoading.hide();
				if(data.IsSuccess) {
					try {
						window.plugins.toast.showShortCenter("您已到达现场，请及时拍照上传哦！");
					} catch(e) {
						alert("您已到达现场，请及时拍照上传哦！");
					}
					//更新位点
					BasicService.GetGeoLocation(function(bdPoint) {
						RscService.UpdateMySite(bdPoint.lng, bdPoint.lat, 'E');
					});

					//跳转 待拍照
					if($scope.RscWOInfo.GOODS_NAME == "事故拖车" ||
						$scope.RscWOInfo.GOODS_NAME == "拖车牵引" ||
						$scope.RscWOInfo.GOODS_NAME == "酒后代拖") { //拖车
						$state.go("takephoto", {
							woNo: $scope.RscWOInfo.WO_NO,
							svcItem: $scope.RscWOInfo.GOODS_NAME,
							trailStatus: '拖车待出发'
						});
					} else {
						$state.go("takephoto", {
							woNo: $scope.RscWOInfo.WO_NO,
							svcItem: $scope.RscWOInfo.GOODS_NAME
						});
					}
				} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
					try {
						window.plugins.toast.showShortCenter("点击失败！" + data.ErrCode);
					} catch(e) {
						alert("点击失败！" + data.ErrCode);
					}
				}

			})
			.error(function(data) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showShortCenter("点击失败！" + data);
				} catch(e) {
					alert("点击失败！" + data);
				}
			});
	}

	//起始位置
	$scope.StartPoint = function(type) {
		$ionicLoading.show({
		    template: '获取当前位置信息...'
		});
		var map = new BMap.Map("divMapArea");
		var point = new BMap.Point("");
		map.centerAndZoom(point, 15);
		var geolocation = new BMap.Geolocation();
		geolocation.getCurrentPosition(function(r) {
			if(this.getStatus() == BMAP_STATUS_SUCCESS) {
                $ionicLoading.hide();
				var mk = new BMap.Marker(r.point);
				map.addOverlay(mk);
				map.panTo(r.point);
				BasicService.ShowOnBMap(new BMap.Point(r.point.lng, r.point.lat), "start");
			} else {
				alert('failed' + this.getStatus());
			}
		}, {
			enableHighAccuracy: true
		})
		//      if ($scope.RscWOInfo.CAR_START_LNG == null
		//      || $scope.RscWOInfo.CAR_START_LNG == ''
		//      || $scope.RscWOInfo.CAR_START_LNG == 'undefined'
		//      || $scope.RscWOInfo.CAR_START_LAT == null
		//      || $scope.RscWOInfo.CAR_START_LAT == ''
		//      || $scope.RscWOInfo.CAR_START_LAT == 'undefined') {
		//          BasicService.GetGeoLocation(function (bdPoint) {
		//              //var markers = [{ loc: bdPoint }];
		//              //angularBMap.drawMarkers(markers, "start");
		//              BasicService.ShowOnBMap(bdPoint, "start");
		//              if (panToEnd) {
		//                  setTimeout(function () {
		//                      $scope.EndPoint();
		//                  }, 500);
		//              }
		//          }, function () {
		//              window.plugins.toast.showShortCenter('获取位置失败，请打开GPS及网络重试！');
		//          });
		//
		//          $ionicLoading.hide();
		//      }
		//      else {
		//          $ionicLoading.hide();
		//          var markers = [{
		//          //    loc: {
		//          //        lng: Number($scope.RscWOInfo.CAR_START_LNG),
		//          //        lat: Number($scope.RscWOInfo.CAR_START_LAT)
		//          //    }
		//          //}];
		//
		//          //var gpsPoint = new BMap.Point($scope.RscWOInfo.CAR_START_LNG, $scope.RscWOInfo.CAR_START_LAT);
		//          BasicService.ShowOnBMap(new BMap.Point($scope.RscWOInfo.CAR_START_LNG, $scope.RscWOInfo.CAR_START_LAT), "start");
		//
		//          if (panToEnd) {
		//              setTimeout(function () {
		//                  $scope.EndPoint();
		//              }, 500);
		//          }
		//      }
	}

	//终点
	$scope.EndPoint = function(type) {
		var markers = {
			loc: {
				lng: Number($scope.RscWOInfo.FROM_ADDR_LNG),
				lat: Number($scope.RscWOInfo.FROM_ADDR_LAT)
			}
		};

		BasicService.ShowOnBMap("", "end", $scope.RscWOInfo.FROM_ADDR_LNG, $scope.RscWOInfo.FROM_ADDR_LAT);
		//angularBMap.drawMarkers(markers, "end");

		if(type == "click") {
			try {
				window.plugins.toast.showLongCenter($scope.RscWOInfo.FROM_ADDR);
			} catch(e) {
				alert($scope.RscWOInfo.FROM_ADDR);
			}
		}
	}

	//拨打电话
	$scope.MakeCall = function() {
		RscService.UpdateCallbackDate($stateParams.woNo);
	}
});
//proc-拍照
controllers.controller('TakePhotoCtrl', function($scope, $rootScope, $state, $stateParams, $ionicPopup, BasicService, LoginService, RscService, CheckService, $ionicLoading, $cordovaImagePicker, $cordovaCamera, $ionicModal, $cordovaFile, $filter, $timeout) {

	$scope.lastLongitude = 0;
	$scope.lastLatitude = 0;
	$scope.address = "";
	$scope.imagesList = [];

	var imageObject = {
		uri: "",
		upload: false,
		saveid: "",
		folderName: ""
	}; //初始化照片对象

	//从localstorage取出当前工单的照片列表
	if(localStorage.WOImagesList) {
		var ObjectWOImagesList = angular.fromJson(localStorage.WOImagesList)
		angular.forEach(ObjectWOImagesList, function(woi, index) {
			if(woi.woNo == $stateParams.woNo) {
				$scope.imagesList = woi.imagesList;
				$scope.tipsImgIndex = (woi.imagesList.length < 0 ? 0 : woi.imagesList.length);
			}
		});
	}

	// if ($rootScope.RSC_PHOTO_LIST) {
	// $scope.imagesList = $rootScope.RSC_PHOTO_LIST;
	// }

	$scope.svcType = '救援'; //服务类型：拖车、困境、救援  默认值-救援
	if($stateParams.svcItem == "事故拖车" || $stateParams.svcItem == "拖车牵引" || $stateParams.svcItem == "酒后代拖") {
		$scope.svcType = '拖车';
	} else if($stateParams.svcItem == "吊装救援" || $stateParams.svcItem == "地库拖车" || $stateParams.svcItem == "加辅助轮拖车") {
		$scope.svcType = '困境'; // 此类救援当前不推APP
	} else if($stateParams.svcItem == "取消有空驶")
		$scope.svcType = "取消有空驶";
	else {
		$scope.svcType = '救援';
	}

	//是否需要拖车
	$scope.needTrailer = false;
	if($scope.svcType == "拖车") {
		$scope.needTrailer = true;
		$scope.trailStatus = $stateParams.trailStatus;
	}

	//取消
	$scope.Cancel = function() {
		// if ($scope.imagesList.length > 0) {
		//$rootScope.RSC_PHOTO_LIST = $scope.imagesList;
		$state.go('tab.list');
		// }
		// else {
		// $state.go('tab.list');
		// }
	}

	var isAuto;

	//拖车视图
	$scope.gotoTrailer = function() {
		//$rootScope.RSC_PHOTO_LIST = $scope.imagesList;
		$state.go('trailer', {
			woNo: $stateParams.woNo,
			svcItem: $stateParams.svcItem,
			trail: $scope.trailStatus
		});
	}

	//上传完两张图片时，判断是否拖车，如果是拖车倒计时5分钟（300000毫秒）自动进入拖车视图
	//鉴于事故拖车的特殊性，事故拖车不自动出发
	//测试时设为5秒
	function GotoTrailerAuto() {
		if($scope.imagesList.length == 2 && $scope.needTrailer && $stateParams.svcItem != "事故拖车") {
			isAuto = $timeout(function() {
				//isAuto = 1;
				$scope.gotoTrailer();
			}, 5000);
		}
	}

	//拍两张照片后自动拖车出发
	function TrailStart() {
		RscService.UpdateRscWorkerOption($stateParams.woNo, '拖车出发')
			.success(function(data) {
				$ionicLoading.hide();
				if(data.IsSuccess) {
					//更新位点信息
					BasicService.GetGeoLocation(function(bdPoint) {
						RscService.UpdateMySite(bdPoint.lng, bdPoint.lat, 'TS');
					});
				} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
					try {
						window.plugins.toast.showShortCenter("自动出发失败，请手动出发！" + data.ErrCode);
					} catch(e) {
						alert("自动出发失败，请手动出发！" + data.ErrCode);
					}
				}
			})
			.error(function(data) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showShortCenter("点击失败！" + data);
				} catch(e) {
					alert("点击失败！" + data);
				}
			});
	}

	//删除
	$scope.Delete = function(img) {
		$scope.imagesList.splice($scope.imagesList.indexOf(img), 1);

		//更新localstorage
		$scope.UpdateWOImagesList($stateParams.woNo, $scope.imagesList);
	}

	//提交按钮事件
	$scope.SubmitInfo = function(isIgnore) {
		//是否跳过
		if(isIgnore) {
			var confirmPopup = $ionicPopup.confirm({
				title: '跳过拍照确认',
				template: '<div class="text-center">是否确定跳过拍照，由此可能产生的纠纷将由您承担</div>',
				okText: '跳过',
				okType: 'confirm-ok',
				cancelText: '不跳过',
				cancelType: 'confirm-cancel'
			});

			confirmPopup.then(function(res) {
				if(res) {
					$scope.SaveRscPhotoList();
				}
			});
		} else {
			if($scope.svcType == "拖车") {
				// 至少4张 拖车
				if($scope.imagesList.length < 4) {
					try {
						window.plugins.toast.showShortCenter("请至少上传4张照片！");
					} catch(e) {
						alert("请至少上传4张照片！");
					}
					return;
				}
				//拖车
				if($stateParams.trailStatus != '拖车已到达') {
					try {
						window.plugins.toast.showShortCenter("请确认拖车是否到达目的地！");
					} catch(e) {
						alert("请确认拖车是否到达目的地！");
					}
					return;
				}
			} else if($scope.svcType == "困境") {
				//至少4张  困境
				if($scope.imagesList.length < 4) {
					try {
						window.plugins.toast.showShortCenter("请至少上传4张照片！");
					} catch(e) {
						alert("请至少上传4张照片！");
					}
					return;
				}
			} else if($scope.svcType == "取消有空驶") {
				//至少2张  一张路，一张工单
				if($scope.imagesList.length < 2) {
					try {
						window.plugins.toast.showShortCenter("请至少上传2张照片！");
					} catch(e) {
						alert("请至少上传2张照片！");
					}
					return;
				}
			} else {
				//至少3张 救援
				if($scope.imagesList.length < 3) {
					try {
						window.plugins.toast.showShortCenter("请至少上传3张照片！");
					} catch(e) {
						alert("请至少上传3张照片！");
					}
					return;
				}
			}
			$scope.SaveRscPhotoList();
		}
	};

	$scope.SaveRscPhotoList = function() {
		//检查是否所有图片都上传成功
		for(var i = 0; i < $scope.imagesList.length; i++) {
			var obj = $scope.imagesList[i];
			if(!obj.upload) {
				try {
					window.plugins.toast.showShortCenter("有图片未上传成功，请点击图片右上角红色图标重试！");
				} catch(e) {
					alert("有图片未上传成功，请点击图片右上角红色图标重试！");
				}
				break;
			};
			if(i == $scope.imagesList.length - 1) {
				//保存图片信息
				RscService.SaveRscPhotoInfo($stateParams.woNo, $scope.imagesList)
					.success(function(data) {
						if(data.IsSuccess) {

							//$rootScope.RSC_PHOTO_LIST = null;
							$scope.UpdateWOImagesList($stateParams.woNo, $scope.imagesList, true);

							if(data.iTotalCnt > 0) {
								try {
									window.plugins.toast.showShortCenter("您成功上传【" + data.iTotalCnt + "】张照片");
								} catch(e) {
									alert("上传失败，请重试");
								}
							} else
								window.plugins.toast.showShortCenter("跳过拍照");
							debugger;
							if($scope.svcType == "取消有空驶")
								$state.go("tab.list", {
									woNo: localStorage.FRTAUTO_RSCAPP_WO_NO
								});
							else
								$state.go("cusconfirm", {
									woNo: $stateParams.woNo
								});
						} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
							try {
								window.plugins.toast.showShortCenter("照片上传失败！" + data.ErrCode);
							} catch(e) {
								alert("照片上传失败！" + data.ErrCode);
							}
						}
					})
					.error(function(data) {
						try {
							window.plugins.toast.showShortCenter("数据更新失败！" + data);
						} catch(e) {
							alert("数据更新失败！" + data);
						}
						BasicService.CaptureExpLog(JSON.stringify(data), "照片上传");
					});
			};
		};
	};

	/////////////////////////////////////////////
	// 图片选择  从相机 or 从相册
	/////////////////////////////////////////////
	$ionicModal.fromTemplateUrl('templates/modal.html', {
		scope: $scope,
		animation: 'slide-in-down'
	}).then(function(modal) {
		$scope.modal = modal;
	});

	//当我们用完模型时，清除它！
	$scope.$on('$destroy', function() {
		$scope.modal.remove();
		//.then(function () {
		//    $scope.modal = null;
		//});
	});
	// 当隐藏模型时执行动作
	$scope.$on('modal.hidden', function() {
		// 执行动作
	});
	// 当移动模型时执行动作
	$scope.$on('modal.removed', function() {
		// 执行动作
	});

	$scope.tipsImg = [{
			title: '整车照',
			img: 'img/phototips1.jpg'
		},
		{
			title: '施救照',
			img: 'img/phototips2.jpg'
		},
		{
			title: '拖车照',
			img: 'img/phototips3.jpg'
		},
		{
			title: '救援工单照',
			img: 'img/phototips4.jpg'
		},
		{
			title: '路牌照',
			img: 'img/phototips5.jpg'
		}
	];

	$scope.OpenTips = function() {

		if($stateParams.svcItem == "事故拖车") {
			if($scope.imagesList.length >= 20) {
				try {
					window.plugins.toast.showShortCenter("亲，事故救援最多上传20张照片！");
				} catch(e) {
					alert("亲，事故救援最多上传20张照片！");
				}
				return;
			}
		} else if($scope.imagesList.length >= 6) {
			try {
				window.plugins.toast.showShortCenter("亲，最多上传6张照片！");
			} catch(e) {
				alert("亲，最多上传6张照片！");
			}
			return;
		}

		if($scope.imagesList.length <= 0) {
			$scope.tipsImgIndex = 0;
			if($scope.svcType == "取消有空驶") {
				$scope.tipsImgIndex = 4; //取消有空驶
			}
		} else if($scope.imagesList.length == 1) {
			if($scope.svcType == "拖车") {
				$scope.tipsImgIndex = 2; //拖车照
			} else if($scope.svcType == "取消有空驶") {
				$scope.tipsImgIndex = 3; //取消有空驶 救援工单照
			} else if($stateParams.svcItem == "事故拖车") {
				$scope.tipsImgIndex = 0;
			} else {
				$scope.tipsImgIndex = 1; //施救照
			}
		} else if($scope.imagesList.length == 2) {
			if($scope.svcType == "拖车") {
				$scope.tipsImgIndex = 2; //拖车照

				if($stateParams.trailStatus != '拖车已到达') {
					try {
						window.plugins.toast.showShortCenter("亲，请确认拖车已到达！");
					} catch(e) {}
					return;
				}
			} else if($scope.svcType == "困境") {
				$scope.tipsImgIndex = 1; //施救照
			} else {
				$scope.tipsImgIndex = 3; //救援工单照
			}
		} else if($scope.imagesList.length == 3) {
			if($scope.svcType == "拖车" || $scope.svcType == "困境") {
				$scope.tipsImgIndex = 3; //救援工单照（拖车、困境）
			} else {
				$scope.tipsImgIndex = 1; //施救照
			}
		} else {
			$scope.tipsImgIndex = 1; //施救照
		}

		$scope.modal.show();
	}

	//更新localstorage.WOImagesList，更新逻辑很简单，删掉当前工单信息然后重新添加
	$scope.UpdateWOImagesList = function(woNo, imagesList, isRemove) { //imagesList是当前工单所有图片
		var WOImagesList = []; //所有的工单及图片

		if(!localStorage.WOImagesList)
			localStorage.WOImagesList = [];
		else {
			//如果localStorage.WOImagesList异常，则清空
			try {
				WOImagesList = angular.fromJson(localStorage.WOImagesList); //从localStorage载入所有的工单及图片
			} catch(err) {
				localStorage.WOImagesList = "";
			}
		}

		var WOImage = {
			"woNo": "",
			"imagesList": []
		}; //初始化工单及照片列表类

		if(WOImagesList.length > 0) {
			angular.forEach(WOImagesList, function(woi, i) { //轮询所有工单
				//找到当前工单
				if(woi.woNo == $stateParams.woNo) {
					WOImage = woi;
					//从数组中去除，后面重新添加
					WOImagesList.splice(i, 1);
				}

				WOImage.imagesList = imagesList;

			});

			//如果没查到当前工单
			if(!WOImage.woNo) {
				WOImage.woNo = $stateParams.woNo;
				WOImage.imagesList = imagesList;
			}

			//如果isRemove为false，则添加回去
			if(!isRemove) {
				WOImagesList.push(WOImage);
			}

			localStorage.WOImagesList = angular.toJson(WOImagesList);
		} else {
			WOImage.woNo = $stateParams.woNo;
			WOImage.imagesList = imagesList;
			WOImagesList.push(WOImage);
			localStorage.WOImagesList = angular.toJson(WOImagesList);
		}

		//每次处理完，要重新生成对象，每次生成的对象有唯一的hash key
		imageObject = {
			uri: "",
			upload: false,
			saveid: "",
			folderName: ""
		};

		//拖车工单，定时自动进入拖车操作页面
		if(WOImage.imagesList.length == 2 && $scope.svcType == "拖车") {
			TrailStart();
		}
	}

	$scope.FromCamera = function() {
		$scope.modal.hide();
		//经纬度逆解析
		if($scope.lastLongitude != localStorage.longitude || $scope.lastLatitude != localStorage.latitude) {
			$scope.lastLongitude = localStorage.longitude;
			$scope.lastLatitude = localStorage.latitude

			var geoc = new BMap.Geocoder();
			var bdPoint = new BMap.Point(localStorage.longitude, localStorage.latitude);
			//var bdPoint = {lng: localStorage.longitude, lat: localStorage.latitude};

			geoc.getLocation(bdPoint, function(rs) {
				var addComp = rs.addressComponents;
				$scope.address = addComp.province + addComp.city + addComp.district + addComp.street + addComp.streetNumber;
				appendByCamera();
			});
		} else
			appendByCamera();
	}

	$scope.FromAlbum = function() {
		$scope.modal.hide();
		pickImage();
	}

	//From Album
	function pickImage() {
		//相册
		var options = {
			quality: 60,
			destinationType: Camera.DestinationType.FILE_URI,
			sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
			//sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM, //从相册中选取
			allowEdit: false,
			encodingType: Camera.EncodingType.JPEG,
			//mediatype: Camera.MediaType.PICTURE,
			//popoverOptions: CameraPopoverOptions,
			targetWidth: 768,
			targetHeight: 1024,
			saveToPhotoAlbum: false,
			correctOrientation: true
		};

		//获取成功
		function cameraSuccess(imageUri) {
			if(imageUri.indexOf("blob") == 0) {
				imageObject.uri = Date.parse(new Date()) + "ITKingTest.jpg"
				$scope.SubmitSingleImage(imageObject);
			} else {
				var index = imageUri.lastIndexOf('?');
				if(index > 0) {
					imageUri = imageUri.substr(0, index);
				}

				imageObject.uri = imageUri;
				$scope.SubmitSingleImage(imageObject);
			}

		}

		//获取失败
		function cameraError(error) {
			error = JSON.stringify(error);
			if(ionic.Platform.isIOS()) {
				if(error.indexOf('no image selected') >= 0) {
					//cancel
				} else if(error.indexOf("has no access to assets") >= 0) {
					window.plugins.toast.showLongCenter("访问您的相册失败，请检查您的权限设置！");
					BasicService.CaptureExpLog(error, "FromAlbum");
				} else {
					window.plugins.toast.showLongCenter("访问您的相册失败。" + JSON.stringify(error));
					BasicService.CaptureExpLog(error, "FromAlbum");
				}
			} else {
				if(error.indexOf('Selection cancelled') >= 0) {
					//cancel
				} else if(error.indexOf('20') >= 0) {
					window.plugins.toast.showLongCenter("访问您的相册失败，请检查您的权限设置！");
					BasicService.CaptureExpLog(error, "FromAlbum");
				} else {
					window.plugins.toast.showLongCenter("访问您的相册失败！" + JSON.stringify(error));
					BasicService.CaptureExpLog(error, "FromAlbum");
				}
			}
		}

		//navigator.camera.getPicture(cameraSuccess, cameraError, options);
		$cordovaCamera.getPicture(options).then(cameraSuccess, cameraError);
	}

	//From Camera
	function appendByCamera() {

		var options = {
			quality: 40,
			destinationType: Camera.DestinationType.FILE_URI,
			sourceType: Camera.PictureSourceType.CAMERA, //拍照
			allowEdit: false,
			encodingType: Camera.EncodingType.JPEG,
			//mediatype: Camera.MediaType.PICTURE,
			//popoverOptions: CameraPopoverOptions,
			targetWidth: 600,
			targetHeight: 800,
			//saveToPhotoAlbum: true,
			saveToPhotoAlbum: false,
			correctOrientation: true
		};

		//获取成功
		function cameraSuccess(imageUri) {
			//alert(imageUri);
			var fileName = imageUri.split('/')[imageUri.split('/').length - 1];
			var deviceDir = cordova.file.externalRootDirectory + "RscFile/Images/";
			$cordovaFile.checkDir(cordova.file.externalRootDirectory, "RscFile").then(function(success) {
				// success
			}, function(error) {
				// error
				deviceDir = cordova.file.externalRootDirectory;
			});
			try {
				$cordovaFile.moveFile(cordova.file.externalCacheDirectory, fileName, deviceDir, fileName)
					.then(function(success) {

						var text = "拍摄地：" + $scope.address + "<br>拍摄时间：" + $filter('date')(new Date(), "yyyy-MM-dd HH:mm:ss");

						BasicService.AddTextToImage(deviceDir, text, fileName)
							.then(function(success) {
								imageObject.uri = success.nativeURL;

								$scope.SubmitSingleImage(imageObject);
							}, function(error) {
								alert(error);
							});
						//alert(JSON.stringify(success));
					}, function(error) {
						alert("fail!:" + JSON.stringify(error));
						BasicService.CaptureExpLog(JSON.stringify(error), "拍照movefile");
					})
			} catch(e) {
				alert("fail! :" + JSON.stringify(e));
				BasicService.CaptureExpLog(JSON.stringify(e), "拍照movefile2");
			}
		}

		//获取失败
		function cameraError(error) {
			error = JSON.stringify(error);
			if(ionic.Platform.isIOS()) {
				if(error.indexOf('no image selected') >= 0) {
					//cancel
				} else if(error.indexOf('has no access to camera') >= 0) {
					window.plugins.toast.showLongCenter("访问您的相机失败，请检查您的权限设置！");
					BasicService.CaptureExpLog(error, "拍照获取失败");
				} else {
					window.plugins.toast.showLongCenter("拍照未成功！" + JSON.stringify(error));
					BasicService.CaptureExpLog(error, "拍照获取失败");
				}
			} else {
				if(error.indexOf('Camera cancelled') >= 0) {
					//cancel
					window.plugins.toast.showLongCenter("拍照已取消！");
				} else if(error.indexOf('20') >= 0) {
					window.plugins.toast.showLongCenter("访问您的相册失败，请检查您的权限设置！");
					BasicService.CaptureExpLog(error, "拍照获取失败");
				} else {
					window.plugins.toast.showLongCenter("访问您的相机失败！" + JSON.stringify(error));
					BasicService.CaptureExpLog(error, "拍照获取失败");
				}
			}
		}

		navigator.camera.getPicture(cameraSuccess, cameraError, options);
		//$cordovaCamera.getPicture(options).then(cameraSuccess, cameraError);
	}

	// 上传
	$scope.SubmitSingleImage = function(imageObject, isReupload) {
		$ionicLoading.show({
			template: '照片上传中...'
		});

		function win(r) {
			//$rootScope.RSC_PHOTO_LIST = $scope.imagesList;
			$ionicLoading.hide();
			var result = JSON.parse(r.response);

			imageObject.upload = true;
			imageObject.saveid = result.saveid;
			imageObject.folderName = result.folderName;

			if(!isReupload) //是否重新上传
				$scope.imagesList.push(imageObject);

			//更新localstorage
			$scope.UpdateWOImagesList($stateParams.woNo, $scope.imagesList);
		}

		function fail(error) {
			$ionicLoading.hide();
			//window.plugins.toast.showLongCenter("上传失败！" + error.code);
			//BasicService.CaptureExpLog(JSON.stringify(error), "图片上传失败");

			if(!isReupload) //是否重新上传
				$scope.imagesList.push(imageObject);

			//更新localstorage
			$scope.UpdateWOImagesList($stateParams.woNo, $scope.imagesList);
		}

		if(imageObject.uri == undefined || imageObject.uri == null || imageObject.uri == "") {
			try {
				window.plugins.toast.showLongCenter("空！");
			} catch(e) {
				alert("空！");
			}
		} else {
			if(imageObject.uri.indexOf("ITKingTest.jpg") >= 0) //本地调试上传照片专用逻辑，模拟上传完成
			{
				win({
					response: "{\"saveid\": " + Date.parse(new Date()) + ", \"folderName\": \"\"}"
				});
			} else {
				var filePath = imageObject.uri;
				var uri = encodeURI(COMM.GetEnvConfig().UPLOAD_URL);
				//var uri = encodeURI(BasicService.File_Upload_Url());
				var extensionAllow = "jpg,jpeg,png,bmp,gif";
				var extension = filePath.substr(filePath.lastIndexOf('.') + 1).toLocaleLowerCase();

				if(extensionAllow.indexOf(extension) < 0) {
					try {
						window.plugins.toast.showShortCenter("文件格式(" + extension + ")不支持！");
					} catch(e) {
						alert("文件格式(" + extension + ")不支持！");
					}
					$ionicLoading.hide();
					return;
				}

				var options = new FileUploadOptions();
				options.fileKey = "file";
				options.fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
				options.mimeType = "text/" + extension;
				var headers = {
					'headerParam': 'headerValue'
				};
				options.headers = headers;
				var ft = new FileTransfer();
				ft.upload(filePath, uri, win, fail, options);
			}
		}
	}

});
//proc-拖车
controllers.controller('TrailerCtrl', function($scope, $rootScope, $state, $stateParams, $ionicLoading, $cordovaGeolocation, $ionicPopup, BasicService, LoginService, RscService, CheckService, BasicService, $timeout) {

	//model变量
	$scope.RscWOInfo = {};

	$scope.bTrailStart = false; //出发按钮
	$scope.bTrailEnd = false; //到达按钮
	$scope.bTrailClose = false; //关闭

	var trailStatus = $stateParams.trail;
	var isAuto = $stateParams.isAuto; //是否自动进入
	//window.plugins.insomnia.keepAwake();//保持屏幕亮屏

	if($stateParams.trail == '拖车待出发') { //拖车待出发
		$scope.bTrailStart = true; //出发按钮
		$scope.bTrailEnd = false; //到达按钮
		$scope.bTrailClose = false; //关闭
	} else if($stateParams.trail == '拖车已出发') { //拖车已出发
		$timeout.cancel(isAuto); //如果是拖车已出发状态，不再自动出发，把前面的定时器取消
		$scope.bTrailStart = false; //出发按钮
		$scope.bTrailEnd = true; //到达按钮
		$scope.bTrailClose = false; //关闭
	} else { //拖车已到达
		$scope.bTrailStart = false; //出发按钮
		$scope.bTrailEnd = false; //到达按钮
		$scope.bTrailClose = true; //关闭
	}

	//取消
	$scope.Cancel = function() {
		$state.go("takephoto", {
			woNo: $stateParams.woNo,
			svcItem: $stateParams.svcItem,
			trailStatus: trailStatus
		});
	}

	//拖车出发
	$scope.TrailStart = function() {
		$timeout.cancel(isAuto); //不管是否手动出发，把前面的定时器取消
		$ionicLoading.show({
			template: '数据更新中...'
		});

		RscService.UpdateRscWorkerOption($stateParams.woNo, '拖车出发')
			.success(function(data) {
				$ionicLoading.hide();
				if(data.IsSuccess) {

					trailStatus = "拖车已出发";
					//更改显示
					$scope.bTrailStart = false; //出发按钮
					$scope.bTrailEnd = true; //到达按钮
					$scope.bTrailClose = false; //关闭

					//更新位点信息
					BasicService.GetGeoLocation(function(bdPoint) {
						RscService.UpdateMySite(bdPoint.lng, bdPoint.lat, 'TS');
					});

					try {
						window.plugins.toast.showShortCenter("拖车已出发，请前往目的地！");
					} catch(e) {
						alert("拖车已出发，请前往目的地！");
					}
				} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
					try {
						window.plugins.toast.showShortCenter("点击失败！" + data.ErrCode);
					} catch(e) {
						alert("点击失败！" + data.ErrCode);
					}
				}
			})
			.error(function(data) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showShortCenter("点击失败！" + data);
				} catch(e) {
					alert("点击失败！" + data);
				}
			});
	}

	//拖车到达
	$scope.TrailEnd = function() {
		$ionicLoading.show({
			template: '数据更新中...'
		});

		RscService.UpdateRscWorkerOption($stateParams.woNo, '拖车到达')
			.success(function(data) {
				$ionicLoading.hide();

				if(data.IsSuccess) {

					trailStatus = "拖车已到达";
					//更改显示
					$scope.bTrailStart = false; //出发按钮
					$scope.bTrailEnd = false; //到达按钮
					$scope.bTrailClose = true; //关闭

					//更新位点
					BasicService.GetGeoLocation(function(bdPoint) {
						RscService.UpdateMySite(bdPoint.lng, bdPoint.lat, 'TE');
					});

					try {
						window.plugins.toast.showShortCenter("拖车到达目的地！");
					} catch(e) {
						alert("拖车到达目的地！");
					}
				} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
					try {
						window.plugins.toast.showShortCenter("点击失败！" + data.ErrCode);
					} catch(e) {
						alert("点击失败！" + data.ErrCode);
					}
				}

			})
			.error(function(data) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showShortCenter("点击失败！" + data);
				} catch(e) {
					alert("点击失败！" + data);
				}
			});
	}

	//拖车起始位置
	$scope.StartPoint = function(type) {
		var markers = {
			loc: {
				lng: Number($scope.RscWOInfo.FROM_ADDR_LNG),
				lat: Number($scope.RscWOInfo.FROM_ADDR_LAT)
			}
		};
		BasicService.ShowOnBMap("", "trail-s", $scope.RscWOInfo.FROM_ADDR_LNG, $scope.RscWOInfo.FROM_ADDR_LAT);
	}

	//拖车终点位置
	$scope.EndPoint = function(type) {
		var markers = {
			loc: {
				lng: Number($scope.RscWOInfo.TO_ADDR_LNG),
				lat: Number($scope.RscWOInfo.TO_ADDR_LAT)
			}
		};
		//angularBMap.drawMarkers(markers, "trail-e");

		BasicService.ShowOnBMap("", "trail-e", $scope.RscWOInfo.TO_ADDR_LNG, $scope.RscWOInfo.TO_ADDR_LAT);
	}

	$scope.BaiduNav = function() {
		BasicService.BaiduNav($scope.RscWOInfo.TO_ADDR);
	}
	//获取工单信息
	$ionicLoading.show({
		template: '数据加载中...'
	});
	RscService.GetRscWOMstrByWoNo($stateParams.woNo)
		.success(function(data) {
			$ionicLoading.hide();
			if(data.IsSuccess) {
				$scope.RscWOInfo = data.DataList[0];

				$scope.StartPoint();
				$scope.EndPoint();

				//如果是自动进入，则自动出发
				if(isAuto && $stateParams.trail == '拖车待出发')
					$scope.TrailStart();
			} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
				try {
					window.plugins.toast.showLongCenter("获取救援工单信息失败" + data.ErrCode);
				} catch(e) {
					alert("获取救援工单信息失败" + data.ErrCode);
				}
			}
		})
		.error(function(error) {
			$ionicLoading.hide();
			try {
				window.plugins.toast.showLongCenter("获取救援工单信息失败");
			} catch(e) {
				alert("获取救援工单信息失败");
			}
		});
});

//proc-客户确认
controllers.controller('CusConfirmCtrl', function($scope, $rootScope, $state, $stateParams, $ionicPopup, $ionicLoading, LoginService, BasicService, RscService, CheckService, $ionicModal, $interval, $cordovaFile
	//, $cordovaGeolocation, $cordovaMedia
) {
	//工单信息
	$scope.RscWOInfo = {};
	$ionicLoading.show({
		template: '数据加载中...'
	});
	$scope.toPay = 0;
	// 获取工单信息
	RscService.GetRscWOMstrByWoNo($stateParams.woNo)
		.success(function(data) {
			$ionicLoading.hide();
			if(data.IsSuccess) {
				$scope.RscWOInfo = data.DataList[0];
				$scope.RscWOInfo.DISPATCH_DATE = moment($scope.RscWOInfo.DISPATCH_DATE).format("YYYY-MM-DD HH:mm:ss");
				$scope.RscWOInfo.ACT_ARRIVE_DATE = moment($scope.RscWOInfo.ACT_ARRIVE_DATE).format("YYYY-MM-DD HH:mm:ss");
				//判断是否需要支付
				if($scope.RscWOInfo.IS_INCIDENT == 1) {
					$ionicLoading.show({
						template: '事故救援：获取支付金额...'
					});
					RscService.GetAmount($stateParams.woNo)
						.success(function(data) {
							$ionicLoading.hide();
							if(data.IsSuccess) {
								$scope.toPay = data.DataList[0].Amount;
								$scope.totalAmount = data.DataList[0].TotalAmount;
								$scope.paidAmount = data.DataList[0].PaidAmount;
							}
						})
						.error(function(data) {
							$ionicLoading.hide();
							try {
								window.plugins.toast.showShortCenter("获取支付金额失败！网络不给力哦！");
							} catch(e) {
								alert("获取支付金额失败！网络不给力哦！");
							}
						})
				}

				localStorage.FRTAUTO_RSCAPP_WO_NO = $scope.RscWOInfo.WO_NO;
				localStorage.FRTAUTO_RSCAPP_WO_FROM = $scope.RscWOInfo.WO_FROM;
				localStorage.FRTAUTO_RSCAPP_OUT_NO = $scope.RscWOInfo.OUT_SOURCE_NO;

				$scope.needTrailer = false; //服务类型：拖车、困境、救援  默认值 - 不需要拖车
				if($stateParams.svcItem == "事故拖车" || $stateParams.svcItem == "拖车牵引" || $stateParams.svcItem == "酒后代拖") {
					$scope.needTrailer = true;
				}
				//else if ($stateParams.svcItem == "吊装救援" || $stateParams.svcItem == "地库拖车" || $stateParams.svcItem == "加辅助轮拖车") {
				//    $scope.svcType = '困境'; // 此类救援当前不推APP
				//}
				else {
					$scope.needTrailer = false;
				}
			} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
				try {
					window.plugins.toast.showShortCenter("获取工单信息失败！" + data.ErrCode);
				} catch(e) {
					alert("获取工单信息失败！" + data.ErrCode);
				}
			}
		})
		.error(function(data) {
			$ionicLoading.hide();
			try {
				window.plugins.toast.showShortCenter("获取工单信息失败！网络不给力哦！");
			} catch(e) {
				alert("获取工单信息失败！网络不给力哦！");
			}
		});

	$scope.Cancel = function() {
		$state.go('tab.list');
	}

	///修改里程数 暂不开放
	$scope.ModifyMiles = function(type) {

		$scope.data = {
			miles: 0
		};

		if(type == 1) {
			$scope.data.miles = $scope.RscWOInfo.ARRIVE_MILEAGE;
		} else {
			$scope.data.miles = $scope.RscWOInfo.TRAILER_MILEAGE;
		}
		// 自定义弹窗
		var template = '<div style="margin: -5px -10px;">' +
			'<label class="row item-line"><span style="width:120px; padding: 5px; line-height: 26px;">里程数:</span><input type="number" class="item-input" placeholder="" ng-model="data.miles"></label></div>'
		var myPopup = $ionicPopup.show({
			template: template,
			title: '里程数修改',
			scope: $scope,
			buttons: [{
					text: '取消',
					type: 'confirm-cancel',
				},
				{
					text: '保存',
					type: 'confirm-ok',
					onTap: function(e) {
						if(!$scope.data.miles || $scope.data.miles == '' || $scope.data.miles < 0) {
							// 不允许用户关闭，除非输入值
							try {
								window.plugins.toast.showShortCenter("请输入有效值！");
							} catch(e) {
								alert('请输入有效值');
							}

							e.preventDefault();
						} else {

							if(type == 1) {
								if($scope.data.miles == $scope.RscWOInfo.ARRIVE_MILEAGE) {
									try {
										window.plugins.toast.showShortCenter("请输入有效值！");
									} catch(e) {
										alert('请输入有效值');
									}
									e.preventDefault();
								} else {
									$scope.RscWOInfo.ARRIVE_MILEAGE = $scope.data.miles;
								}
							} else {
								if($scope.data.miles == $scope.RscWOInfo.TRAILER_MILEAGE) {
									try {
										window.plugins.toast.showShortCenter("请输入有效值！");
									} catch(e) {
										alert('请输入有效值');
									}
									e.preventDefault();
								} else {
									$scope.RscWOInfo.TRAILER_MILEAGE = $scope.data.miles;
								}
							}

						}
					}
				},
			]
		});
		myPopup.then(function(res) {
			console.log('modify mile success!', res);
		});
	}

	/////////////////////////////////////////
	//评价
	$scope.CurrIndex = 0;
	$scope.IconList = [{
			value: 0,
			tips: '请对本次服务给予评价'
		},
		{
			value: 1,
			icon: 'ion-ios-star-outline',
			tips: '极不满意'
		},
		{
			value: 2,
			icon: 'ion-ios-star-outline',
			tips: '不满意'
		},
		{
			value: 3,
			icon: 'ion-ios-star-outline',
			tips: '一般'
		},
		{
			value: 4,
			icon: 'ion-ios-star-outline',
			tips: '满意'
		},
		{
			value: 5,
			icon: 'ion-ios-star-outline',
			tips: '非常满意'
		}
	];
	$scope.HitEval = function(index) {
		$scope.CurrIndex = index;
		for(var i = 1; i <= index; i++) {
			$scope.IconList[i].icon = 'ion-ios-star';
		}
		for(var i = index + 1; i <= 5; i++) {
			$scope.IconList[i].icon = 'ion-ios-star-outline';
		}
	}

	//前往录音
	$scope.Record = function() {
		//APP中评价无意义
		//if ($scope.CurrIndex < 1) {
		//    try {
		//        window.plugins.toast.showShortCenter("请发表您的满意度评价！");
		//    } catch (e) {
		//        alert("请发表您的满意度评价！");
		//    }
		//    return;
		//}

		if($scope.toPay > 0) {
			var confirmPopup = $ionicPopup.confirm({
				title: '支付确认',
				template: '<div class="text-center">工单未支付完成，确认前往录音?</div>',
				okText: '确认',
				okType: 'confirm-ok',
				cancelText: '取消',
				cancelType: 'confirm-cancel'
			});
			confirmPopup.then(function(res) {
				if(res) {
					$scope.record_modal.show();
				}
			});
		} else
			$scope.record_modal.show();
	}
	//取消录音
	$scope.CancelRecord = function() {

		if($scope.bRecording) {
			try {
				window.plugins.toast.showShortCenter("您正在录音！");
			} catch(e) {
				alert("您正在录音！");
			}
		} else {
			$scope.record_modal.hide();
		}
	}

	/////////////////////////////////////////
	// 录音确认 弹出框
	$ionicModal.fromTemplateUrl('templates/record-modal.html', {
		scope: $scope,
		animation: 'slide-in-left'
	}).then(function(record_modal) {
		$scope.record_modal = record_modal;
	});

	/////////////////////////////////////////
	// 支付 弹出框
	$ionicModal.fromTemplateUrl('templates/pay-modal.html', {
		scope: $scope,
		animation: 'slide-in-left'
	}).then(function(pay_modal) {
		$scope.pay_modal = pay_modal;
	});

	//当我们用完模型时，清除它！
	$scope.$on('$destroy', function() {
		if($scope.record_modal)
			$scope.record_modal.remove();
		if($scope.pay_modal)
			$scope.pay_modal.remove();
	});
	/////////////////////////////////////////

	/////////////////////////////////////////
	//录音插件
	var mediaRec = null;
	var newFileName = "";
	$scope.recordstart = function() {

		$("#imgRec").attr("src", "img/rec.gif");
		$scope.bRecording = true;
		CountDown();

		var deviceDir = cordova.file.externalRootDirectory + "RscFile/Audios/"; // for Android

		$cordovaFile.checkDir(cordova.file.externalRootDirectory, "RscFile").then(function(success) {
			// success
		}, function(error) {
			// error
			deviceDir = cordova.file.externalRootDirectory;
		});

		newFileName = deviceDir + BasicService.GetRecNameWithTime("m4a"); //new audio name

		mediaRec = new Media(newFileName,
			// success callback
			function(a, b, c, d, e) {
				if($scope.replay = "回放中")
					$scope.replay = "回放";
				console.log("recordAudio():Audio Success");
			},

			// error callback
			function(err) {
				console.log("recordAudio():Audio Error: " + err);
				$scope.bRecording = false;
				$("#imgRec").attr("src", "img/rec.jpg");
				try {
					$interval.cancel($scope.RecCountTimer);
				} catch(e) {}

				alert('获取录音权限失败，请授予录音权限！');

				BasicService.CaptureExpLog(JSON.stringify(err), "start ko");

				return false;
			});

		// Record audio
		mediaRec.startRecord();

		// Stop recording after 120 seconds
		//最多录120秒
		setTimeout(function() {
			mediaRec.stopRecord();
		}, 120000);

	}
	//录音停止
	$scope.recordstop = function(bSave) {

		$scope.bRecording = false;
		$("#imgRec").attr("src", "img/rec.jpg");
		try {
			$interval.cancel($scope.RecCountTimer);
		} catch(e) {}

		if(mediaRec) {
			try {
				mediaRec.stopRecord();

				SubmitConfirm(newFileName, bSave);
			} catch(e) {
				alert("record-copyFile err:" + JSON.stringify(e));
				BasicService.CaptureExpLog(JSON.stringify(e), "录音copyfile err");
			}
		}

	}
	//录音回放
	$scope.PlayBack = function() {
		$scope.replay = "回放中";
		mediaRec.play();
		// window.plugins.audioRecorderAPI.playback(function (msg) {
		// $scope.replay = "回放";
		// }, function (msg) {
		// $scope.replay = "回放";
		// });
	}

	$scope.replay = "回放";
	$scope.recTimeDown = 120; //倒计时
	$scope.recTime = 0; //录音时长
	$scope.bRecording = false; //是否录音中
	var upload_audio_src = ""; //上传服务器保存文件名称

	//录音操作（开始/停止）
	$scope.DoRecord = function(bSave) {
		if(!$scope.bRecording) { //触发开始录音
			if($scope.recTime > 0) {
				var confirmPopup = $ionicPopup.confirm({
					title: '放弃录音文件',
					template: '<div class="text-center">已经存在录音评价，确定重新录入？</div>',
					okText: '确定',
					okType: 'confirm-ok',
					cancelText: '取消',
					cancelType: 'confirm-cancel'
				});
				confirmPopup.then(function(res) {
					if(res) {
						$scope.recordstart();
					}
				});
			} else {
				$scope.recordstart();
			}
		} else { //触发结束录音
			if($scope.recTime < 2) { //给一个最短时间限制 2秒
				try {
					window.plugins.toast.showShortCenter("录音时间不能太短！");
				} catch(e) {}
				return;
			}
			$scope.recordstop(bSave);
		}
	}

	//录音倒计时
	function CountDown() {
		//120秒 倒计时
		$scope.recTimeDown = 120;
        $scope.recTime = 0;

		function timer() {
			$scope.recTimeDown--;
			$scope.recTime = 120 - $scope.recTimeDown;
			if($scope.recTimeDown <= 0) {
				try {
					$interval.cancel($scope.RecCountTimer);
				} catch(e) {}
				$scope.DoRecord();
			}
		}

		$scope.RecCountTimer = $interval(function() {
			timer()
		}, 1000); //120秒 倒计时
	}

	//上传确认框
	function SubmitConfirm(src, bSave) {
		var confirmPopup = $ionicPopup.confirm({
			title: '录音确认',
			template: '<div class="text-center">确定保存该录音?</div>',
			okText: '保存',
			okType: 'confirm-ok',
			cancelText: '放弃',
			cancelType: 'confirm-cancel'
		});
		confirmPopup.then(function(res) {
			if(res) {
				SubmitRec(src, bSave);
			} else {
				upload_audio_src = "";
				$scope.recTime = 0;
				$scope.recTimeDown = 120;
			}
		});
	}

	//上传录音文件
	function SubmitRec(rec_file, bSave) {

		function onSuccess(r) {
			$ionicLoading.hide();
			window.plugins.toast.showShortCenter("已成功上传录音！");

			var result = JSON.parse(r.response);
			upload_audio_src = result.saveid;

			if(bSave) {
				SaveEvaInfo();
			}
		}

		function onError(error) {
			$ionicLoading.hide();
			window.plugins.toast.showShortCenter("上传录音发生错误：Code=" + error.code + ",Message:" + error.message);

			$scope.recTime = 0;
			$scope.recTimeDown = 120;

			BasicService.CaptureExpLog(JSON.stringify(error), "录音上传");
		}

		$ionicLoading.show({
			template: '录音上传中...'
		});

		if(rec_file == null || rec_file == 'undefined') {
			window.plugins.toast.showShortCenter("录音文件为空！");
		} else {
			var filePath = rec_file;
			var uri = encodeURI(COMM.GetEnvConfig().UPLOAD_URL);
			var options = new FileUploadOptions();
			options.fileKey = "file";
			options.fileName = filePath.substr(filePath.lastIndexOf('/') + 1);

			var extension = filePath.substr(filePath.lastIndexOf('.') + 1).toLocaleLowerCase();
			switch(extension) {
				case 'wav':
					options.mimeType = "audio/x-wav";
					break;
				case 'm4a':
					options.mimeType = "audio/mp4a-latm";
					break;
				default:
					options.mimeType = "audio/mpeg";
					break;
			}

			var headers = {
				'headerParam': 'headerValue'
			};
			options.headers = headers;
			//var params = {};
			//params.basePath = "~/Upload/Rescue/Audios/";
			//options.params = params;
			var ft = new FileTransfer();
			//alert(filePath);
			ft.upload(filePath, uri, onSuccess, onError, options);
		}
	}

	//保存评价和录音信息
	$scope.SaveEvaluate = function(isIgnore) {
		//APP中评价无意义，但由于太保有相关回传接口，故先保留
		if($scope.CurrIndex < 1) {
			try {
				window.plugins.toast.showShortCenter("请发表您的满意度评价！");
			} catch(e) {
				alert("请发表您的满意度评价！");
			}
			$scope.record_modal.hide();
			return;
		} else {
			//是否跳过
			if(isIgnore) {
				var confirmPopup = $ionicPopup.confirm({
					title: '跳过录音确认',
					template: '<div class="text-center">是否确定跳过录音，由此可能产生的纠纷将由您承担</div>',
					okText: '跳过',
					okType: 'confirm-ok',
					cancelText: '不跳过',
					cancelType: 'confirm-cancel'
				});

				confirmPopup.then(function(res) {
					if(res) {
						SaveEvaInfo();
					}
				});
			} else {
				if($scope.recTime <= 0 && !$scope.bRecording) { //
					try {
						window.plugins.toast.showShortCenter("请先上传您的录音评价！");
					} catch(e) {
						alert("请先上传您的录音评价！");
					}
					return;
				} else if($scope.bRecording) { //
					$scope.DoRecord(true);
				} else { //有录音文件
					SaveEvaInfo();
				}
			}
		}
	}
	//保存信息操作
	function SaveEvaInfo() {
		RscService.SaveEvaluateInfo($stateParams.woNo, $scope.CurrIndex, upload_audio_src, $scope.RscWOInfo)
			.success(function(data) {
				if(data.IsSuccess) {
					//try {
					//    window.plugins.toast.showShortCenter("谢谢您的评价！");
					//} catch (e) {
					//    alert("谢谢您的评价！");
					//}
					localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().ONLINE; //在线待命中
					//更新状态
					LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);

					//更新位点
					BasicService.GetGeoLocation(function(bdPoint) {
						RscService.UpdateMySite(bdPoint.lng, bdPoint.lat, 'F')
							.success(function(data) {})
							.error(function(data) {});
					}, function(err) {});

					//清空
					localStorage.FRTAUTO_RSCAPP_WO_NO = '';
					localStorage.FRTAUTO_RSCAPP_WO_FROM = '';
					localStorage.FRTAUTO_RSCAPP_OUT_NO = '';

					$state.go("tab.home");
				} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
					try {
						window.plugins.toast.showShortCenter("数据更新失败！" + data.ErrCode);
					} catch(e) {
						alert("数据更新失败！" + data.ErrCode);
					}
				}
			})
			.error(function(error) {
				try {
					window.plugins.toast.showShortCenter("数据更新失败！" + error);
				} catch(e) {
					alert("数据更新失败！" + error);
				}
			});
	}

	////支付相关开始
	//弹出支付方式选择
	$scope.GetPayQRPopup = function() {
		$scope.pay_modal.show();
	}

	//取消支付
	$scope.CancelPay = function() {
		$scope.pay_modal.hide();
	}

	$scope.channelNO = "";
	$scope.payQRCodeURL = "";
	//获取支付二维码
	$scope.GetPayQRCode = function(channelNO) {
		$scope.channelNO = "";
		$scope.payQRCodeURL = "";
		$ionicLoading.show({
			template: '支付二维码请求中...'
		});
		RscService.GetPayQRCode(channelNO, $stateParams.woNo)
			.success(function(data) {
				$ionicLoading.hide();
				if(data.IsSuccess) {
					var payInfo = data.DataList[0];
					if(payInfo.successFlag == "true") {
						$scope.payQRCodeURL = payInfo.url;
						$scope.toPay = payInfo.Amount;
						$scope.channelNO = channelNO;
						localStorage.paymentID = payInfo.paymentId
					} else {
						try {
							window.plugins.toast.showShortCenter(payInfo.errorMsg);
						} catch(e) {
							alert(payInfo.errorMsg);
						}
					}
				} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
					try {
						window.plugins.toast.showShortCenter("获取支付二维码失败！" + data.ErrCode);
					} catch(e) {
						alert("获取支付二维码失败！" + data.ErrCode);
					}
				}
			})
			.error(function(data) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showShortCenter("获取支付二维码失败！网络不给力哦！");
				} catch(e) {
					alert("获取支付二维码失败！网络不给力哦！");
				}
			});
	}

	//支付完成
	$scope.PayOff = function() {
		$ionicLoading.show({
			template: '数据请求中...'
		});
		RscService.PayOff(localStorage.paymentID)
			.success(function(data) {
				$ionicLoading.hide();
				if(data.successFlag) {
					var result = data.status;
					$scope.toPay = 0;
					$scope.pay_modal.hide();
					try {
						window.plugins.toast.showShortCenter(data.status);
					} catch(e) {
						alert(data.status);
					}
				} else {
					try {
						window.plugins.toast.showShortCenter("获取支付状态失败，请重试：" + data.ErrCode);
					} catch(e) {
						alert("获取支付状态失败，请重试：" + data.ErrCode);
					}
				}
			})
			.error(function(data) {
				$ionicLoading.hide();
				try {
					window.plugins.toast.showShortCenter("获取支付状态失败，请重试!");
				} catch(e) {
					alert("获取支付状态失败，请重试！");
				}
			});
	}
	////支付相关结束
});

//tab 列表
controllers.controller('ListCtrl', function($scope, $rootScope, $state, $stateParams, $ionicLoading, LoginService, RscService, BasicService, $ionicPopup, $ionicModal, CheckService) {

	$scope.$on('$ionicView.beforeEnter', function() {
		//判断是否登录
		if(localStorage.FRTAUTO_RSCAPP_LOGINSTATE != 1) {
			$state.go("login");
		}
		var sel = $rootScope.gTabIndex ? $rootScope.gTabIndex : 0;
		$scope.hasSelect(sel);
	})

	$scope.RscWoList = [];
	$scope.param = {};

	//下拉刷新
	$scope.doRefresh = function() {
		$scope.param.curPage = 0;
		$scope.param.hasMore = false;

		RscService.GetRscWoMstrListByPage($scope, 0);
		//Stop the ion-refresher from spinning
		$scope.$broadcast('scroll.refreshComplete');
	}

	//是否有更多数据
	$scope.moreData = function() {
		return $scope.param.hasMore;
	}

	//上拉加载
	$scope.loadMore = function() {

		if(!$scope.param.hasMore) {
			$scope.$broadcast('scroll.infiniteScrollComplete');
			return;
		}

		RscService.GetRscWoMstrListByPage($scope, -1)
			.success(function(data) {
				$scope.$broadcast('scroll.infiniteScrollComplete');
			})
			.error(function(data) {
				$scope.$broadcast('scroll.infiniteScrollComplete');
			})
	}

	//tab 选择
	$scope.arrayTab = [{
			label: '救援中',
			value: '已接单,手工派单,预约任务,已出发,已到达,已拍照,拖车出发,拖车到达'
		},
		{
			label: '已完结',
			value: '已完成,已取消'
		}
	];

	$scope.hasSelect = function(index) {
		if(index == undefined) return;
		$scope.btnTabCls = ['button-outline', 'button-outline'];
		$scope.btnTabCls[index] = '';
		$rootScope.gTabIndex = index;
		$scope.param.tabValue = $scope.arrayTab[index].value;

		$scope.init(null);
	}

	//进入当前工单救援状态详情页（maplocation/takephoto/cuscomfirm/listdetail）
	$scope.DoTrack = function(item, type) {
		if(type == "detail") {
			$state.go("listdetail", {
				woNo: item.WO_NO
			});
		} else if(item.IDLE_FLAG == '待完成') {
			var confirmPopup = $ionicPopup.confirm({
				title: '工单恢复',
				template: '<div class="text-center">您确定继续完成该救援工单？</div>',
				okText: '确定',
				okType: 'confirm-ok',
				cancelText: '取消',
				cancelType: 'confirm-cancel'
			});
			confirmPopup.then(function(res) {
				if(res) {
					DoChangeWOToDo(item, '继续完成', true);
				} else {
					return;
				}
			});
		} else if(item.RSC_STEP == '手工派单') {
			StartOff(item);
		} else
			GoToSubPage(item);
	}

	//接单即出发
	function StartOff(item) {

		var confirmPopup = $ionicPopup.confirm({
			title: '出发',
			template: '<div class="text-center">确认立即出发 ???</div>',
			okText: '确定',
			okType: 'confirm-ok',
			cancelText: '取消',
			cancelType: 'confirm-cancel'
		});
		confirmPopup.then(function(res) {
			if(res) {
				GoToSubPage(item);
			}
		});
	}

	//待完成
	$scope.ToDo = function(item) {

		if(item.RSC_STEP == '预约任务') {
			try {
				window.plugins.toast.showShortCenter("预约任务不可修改救援状态！");
			} catch(e) {
				alert("预约任务不可修改救援状态！");
			}
			return;
		}
		var title;
		var nextOpt;
		var template;

		$scope.selectedValues = {};
		$scope.options = [{
			value: 'value1',
			name: 'name1'
		}, {
			value: 'value2',
			name: 'name2'
		}]
		if(item.IDLE_FLAG == '待完成') {
			title = '工单恢复';
			nextOpt = '继续完成';
			template = '<div class="text-center">您确定继续完成该救援工单？</div>';
		} else {
			title = '工单待完成';
			nextOpt = '待完成';
			template = '<div class="text-center">您确定修改该救援工单的救援状态为<br/>【待完成】？</div>';
		}

		var confirmPopup = $ionicPopup.confirm({
			title: title,
			template: template,
			okText: '确定',
			okType: 'confirm-ok',
			cancelText: '取消',
			cancelType: 'confirm-cancel'
		});
		confirmPopup.then(function(res) {
			if(res) {
				DoChangeWOToDo(item, nextOpt)
			}
		});
	}

	function GoToSubPage(item) {
		if(item.RSC_STEP == "已接单") {
			localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY;
			LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
			$state.go("maplocation", {
				status: 'accept',
				woNo: item.WO_NO
			});
		} else if(item.RSC_STEP == "手工派单" || item.RSC_STEP == "预约任务") { //手工派单
			localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY;
			LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
			$state.go("maplocation", {
				status: 'accept',
				woNo: item.WO_NO
			});
		} else if(item.RSC_STEP == "已出发") {
			//更新状态
			localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY;
			LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
			$state.go("maplocation", {
				status: 'startoff',
				woNo: item.WO_NO
			});
		} else if(item.RSC_STEP == "已到达" || item.RSC_STEP == "拖车出发" || item.RSC_STEP == "拖车到达") {
			//更新状态
			localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY;
			LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);

			localStorage.FRTAUTO_RSCAPP_WO_NO = item.WO_NO;
			localStorage.FRTAUTO_RSCAPP_WO_FROM = item.WO_FROM;
			localStorage.FRTAUTO_RSCAPP_OUT_NO = item.OUT_SOURCE_NO;

			if(item.RSC_STEP == "拖车出发") { //拖车出发
				$state.go("takephoto", {
					woNo: item.WO_NO,
					svcItem: item.GOODS_NAME,
					trailStatus: '拖车已出发'
				});
			} else if(item.RSC_STEP == "拖车到达") { //拖车到达
				$state.go("takephoto", {
					woNo: item.WO_NO,
					svcItem: item.GOODS_NAME,
					trailStatus: '拖车已到达'
				});
			} else { //待出发
				$state.go("takephoto", {
					woNo: item.WO_NO,
					svcItem: item.GOODS_NAME,
					trailStatus: '拖车待出发'
				});
			}
		} else if(item.RSC_STEP == "已拍照") {
			//更新状态
			localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY;
			LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
			$state.go("cusconfirm", {
				woNo: item.WO_NO
			});
		} else {
			$state.go("listdetail", {
				woNo: item.WO_NO
			});
		}
	}

	function DoChangeWOToDo(item, nextOpt, isDo) {
		RscService.UpdateRscWOToPend(item.WO_NO, nextOpt)
			.success(function(data) {
				if(data.IsSuccess) {

					if(nextOpt == '待完成') {
						//更新状态
						localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().ONLINE;
						LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
						//清空
						localStorage.FRTAUTO_RSCAPP_WO_NO = '';
						localStorage.FRTAUTO_RSCAPP_WO_FROM = '';
						localStorage.FRTAUTO_RSCAPP_OUT_NO = '';

						try {
							window.plugins.toast.showShortCenter("请在今天之前处理完该订单！");
						} catch(e) {
							alert("请在今天之前处理完该订单！");
						}
					} else {
						try {
							window.plugins.toast.showShortCenter("请在及时处理该订单！");
						} catch(e) {
							alert("请在及时处理该订单！");
						}
						if(isDo) {
							GoToSubPage(item);
							return;
						} else {
							localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY;
							LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
						}
					}
				} else if(!CheckService.CheckErrCode(data.ErrCode, true)) {
					try {
						window.plugins.toast.showShortCenter("点击失败！" + data.ErrCode);
					} catch(e) {
						alert("点击失败！" + data.ErrCode);
					}
				}

				$scope.hasSelect($rootScope.gTabIndex ? $rootScope.gTabIndex : 0);

			})
			.error(function(err) {
				try {
					window.plugins.toast.showShortCenter("您的操作失败。" + err);
				} catch(e) {
					alert("您的操作失败。" + err);
				}
			})
	}

	//列表中 取消/退回 按钮
	$scope.OrderCancel = function(item) {

		$scope.data = {
			item: item,
			reason: ''
		};

		$scope.selectList = [{
				text: '无法执行救援项目',
				value: '无法执行救援项目'
			},
			{
				text: '无法联系到客户',
				value: '无法联系到客户'
			},
			{
				text: '救援车辆出现故障',
				value: '救援车辆出现故障'
			},
			{
				text: '到客户救援地点超过1小时',
				value: '到客户救援地点超过1小时'
			},
			{
				text: '客户取消救援',
				value: '客户取消救援'
			}
		];

		/////////////////////////////////////////////
		// 取消救援工单modal
		/////////////////////////////////////////////
		$ionicModal.fromTemplateUrl('templates/cancel.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.cancel = modal;
			$scope.cancel.show();
		});
		//当我们用完模型时，清除它！
		$scope.$on('$destroy', function() {
			$scope.cancel.remove();
		});
		// 当隐藏模型时执行动作
		$scope.$on('modal.hidden', function() {
			// 执行动作
			//          console.log('cancel.hidden');
		});
		// 当移动模型时执行动作
		$scope.$on('modal.removed', function() {
			// 执行动作
			//          console.log('cancel.removed');
		});
	}
	//取消订单
	$scope.CancelRscWo = function() {
		var confirmPopup = $ionicPopup.confirm({
			title: (($scope.data.reason == '客户取消救援') ? '取消订单' : '订单退回'),
			template: '<div class="text-center">您确定' + (($scope.data.reason == '客户取消救援') ? '取消' : '退回') + '该救援工单？</div>',
			okText: '确定',
			okType: 'confirm-ok',
			cancelText: '取消',
			cancelType: 'confirm-cancel'
		});
		confirmPopup.then(function(res) {
			if(res) {
                $scope.cancel.hide();
                if (true) {
                    $ionicLoading.show({
                        template: '取消中...'
                    });
                //退回
                RscService.CancelRscWoMstr($scope.data.item.WO_NO, $scope.data.reason)
                    .success(function (data) {
                        $ionicLoading.hide();
                        if (data.IsSuccess) {
                            //更新状态
                            localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().ONLINE;
                            LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
                            $scope.RscWoList.splice($scope.RscWoList.indexOf($scope.data.item), 1);

                            //清空
                            localStorage.FRTAUTO_RSCAPP_WO_NO = '';
                            localStorage.FRTAUTO_RSCAPP_WO_FROM = '';
                            localStorage.FRTAUTO_RSCAPP_OUT_NO = '';

                            try {
                                window.plugins.toast.showShortCenter("您已成功" + (($scope.data.reason == '客户取消救援') ? '取消' : '退回') + "该订单");
                            } catch (e) {
                                alert("您已成功" + (($scope.data.reason == '客户取消救援') ? '取消' : '退回') + "该订单");
                            }
                        } else if (!CheckService.CheckErrCode(data.ErrCode, true, null, $scope, true)) {
                            try {
                                window.plugins.toast.showLongCenter("您的操作失败" + data.ErrCode);
                            } catch (e) {
                                alert("您的操作失败" + data.ErrCode);
                            }
                        }
                    })
                    .error(function (err) {
                        try {
                            window.plugins.toast.showShortCenter("您的操作失败。" + err);
                        } catch (e) {
                            alert("您的操作失败。" + err);
                        }
                    })
            }

			} else {
				$scope.cancel.hide();
			}
		});
	};

	//若传入工单号，则跳转到取消工单
	if($stateParams.woNo) {
		var item = {};
		item.WO_NO = $stateParams.woNo;

		$scope.OrderCancel(item);
	}

	//初始化
	$scope.init = function(search) {
		//默认值 初始化
		$scope.RscWoList = [];
		$scope.param.curPage = 0; //页码
		$scope.param.perPage = 5; //每页最多项
		$scope.param.hasMore = false; //是否存在更多项目
		$scope.param.search = search;
		$scope.lastItem = null;

		$scope.bRefresh = true;
		RscService.GetRscWoMstrListByPage($scope, 0)
			.success(function(data) {
				$scope.bRefresh = false;
			})
			.error(function(data) {
				$scope.bRefresh = false
			})
	}

});
//列表项详情
controllers.controller('ListDetailCtrl', function($scope, $rootScope, $state, $stateParams, RscService, $ionicPopup, BasicService) {

	$scope.gotoBack = function() {
		$state.go('tab.list');
	};
	$scope.RscWOInfo = {};

	$scope.bRefresh = true;
	// 获取工单信息
	RscService.GetRscWOMstrByWoNo($stateParams.woNo)
		.success(function(data) {
			$scope.bRefresh = false;
			if(data.IsSuccess) {
				$scope.RscWOInfo = data.DataList[0];
				if($scope.RscWOInfo.APPOINTMENT_DATE) {
					$scope.RscWOInfo.APPOINTMENT_DATE = moment($scope.RscWOInfo.APPOINTMENT_DATE).format("YYYY-MM-DD HH:mm:ss");
				}
				$scope.RscWOInfo.WO_DATE = moment($scope.RscWOInfo.WO_DATE).format("YYYY-MM-DD HH:mm:ss");
				$scope.RscWOInfo.WO_TAKE_DATE = moment($scope.RscWOInfo.WO_TAKE_DATE).format("YYYY-MM-DD HH:mm:ss");
				$scope.RscWOInfo.DISPATCH_DATE = moment($scope.RscWOInfo.DISPATCH_DATE).format("YYYY-MM-DD HH:mm:ss");
				$scope.RscWOInfo.RE_CONNECT_DATE = moment($scope.RscWOInfo.RE_CONNECT_DATE).format("YYYY-MM-DD HH:mm:ss");
				$scope.RscWOInfo.ACT_ARRIVE_DATE = moment($scope.RscWOInfo.ACT_ARRIVE_DATE).format("YYYY-MM-DD HH:mm:ss");
				$scope.RscWOInfo.ACT_FINISH_DATE = moment($scope.RscWOInfo.ACT_FINISH_DATE).format("YYYY-MM-DD HH:mm:ss");
				$scope.RscWOInfo.EST_ARRIVE_DATE = moment($scope.RscWOInfo.EST_ARRIVE_DATE).format("YYYY-MM-DD HH:mm:ss");

                //获取到达里程
                var geolocation = new BMap.Geolocation();
                geolocation.getCurrentPosition(function(r) {
                    var reach = BasicService.GetMapDistance(r.point.lng, r.point.lat, start.loc.lng, start.loc.lat);
                    $scope.RscWOInfo.ARRIVE_MILEAGE = (reach * 0.001).toFixed(2);
                }, {
                    enableHighAccuracy: true
                })

				//获取拖车里程
				var start = {loc: {lng: Number($scope.RscWOInfo.TO_ADDR_LNG),lat: Number($scope.RscWOInfo.TO_ADDR_LAT)}};
				var end = {loc: {lng: Number($scope.RscWOInfo.FROM_ADDR_LNG),lat: Number($scope.RscWOInfo.FROM_ADDR_LAT)}};
				var trailer = BasicService.GetMapDistance(start.loc.lng, start.loc.lat, end.loc.lng, end.loc.lat);
				$scope.RscWOInfo.TRAILER_MILEAGE = (trailer * 0.001).toFixed(2);

			} else {
				try {
					window.plugins.toast.showLongCenter("获取工单信息失败！" + data.ErrCode);
				} catch(e) {
					alert("获取工单信息失败！" + data.ErrCode);
				}
			}
		})
		.error(function(data) {
			$scope.bRefresh = false;
			try {
				window.plugins.toast.showLongCenter("获取工单信息失败！" + data);
			} catch(e) {
				alert("获取工单信息失败！" + data);
			}
		});

	$scope.ShowDetail = function() {
		$state.go("showphoto", {
			woNo: $stateParams.woNo
		});
	};

	$scope.StartOff = function() {
		var confirmPopup = $ionicPopup.confirm({
			title: '出发',
			template: '<div class="text-center">确认立即出发 ???</div>',
			okText: '确定',
			okType: 'confirm-ok',
			cancelText: '取消',
			cancelType: 'confirm-cancel'
		});
		confirmPopup.then(function(res) {
			if(res) {
				$state.go("maplocation", {
					status: 'accept',
					woNo: $stateParams.woNo
				});
                $scope.StartPoint();
			}

		});
	}

});
//图片查看
controllers.controller('ShowPhotoCtrl', function($scope, $rootScope, $state, $stateParams, $ionicLoading, RscService, $ionicSlideBoxDelegate) {

	$scope.gotoBack = function() {
		//$state.go('tab.list');
		$state.go("listdetail", {
			woNo: $stateParams.woNo
		});
	};

	//$scope.RscWOInfo = {};
	$scope.svcUrl = COMM.GetEnvConfig().PLATFORM_URL;

	$ionicLoading.show({
		template: '正在获取照片信息...'
	})
	// 获取工单信息
	RscService.GetRscWOFileList($stateParams.woNo, "图片")
		.success(function(data) {
			$ionicLoading.hide();
			if(data.IsSuccess) {
				$scope.PhotoList = data.DataList;

				$ionicSlideBoxDelegate.update(); //更新ionic SlideBox
				//$ionicSlideBoxDelegate.$getByHandle("slideimgs").loop(true);
			} else {
				try {
					window.plugins.toast.showLongCenter("获取照片信息失败！" + data.ErrCode);
				} catch(e) {
					alert("获取照片信息失败！" + data.ErrCode);
				}
			}
		})
		.error(function(data) {
			$ionicLoading.hide();
			try {
				window.plugins.toast.showLongCenter("获取照片信息失败！" + data);
			} catch(e) {
				alert("获取照片信息失败！" + data);
			}
		});

	//$scope.myActiveSlide = 1;
});

//tab 我
controllers.controller('MineCtrl', function($scope, $rootScope, $state, RscService, $cordovaToast) {

	$scope.$on('$ionicView.beforeEnter', function() {
		if(localStorage.FRTAUTO_RSCAPP_LOGINSTATE != 1) {
			$state.go("login");
		}
		//列表页标签重置
		//$rootScope.gTabIndex = 0;
	});

	if(localStorage.FRTAUTO_RSCAPP_ALLUSRINFO == null ||
		localStorage.FRTAUTO_RSCAPP_ALLUSRINFO == '' ||
		localStorage.FRTAUTO_RSCAPP_ALLUSRINFO == 'undefined') {
		localStorage.FRTAUTO_RSCAPP_LOGINSTATE = 0;
		$state.go("login");
	}
	$scope.currentUser = JSON.parse(localStorage.FRTAUTO_RSCAPP_ALLUSRINFO);

	$scope.aboutUs = function() {
		$state.go("about");
	}

	$scope.gotoUserInfo = function() {
		$state.go("userinfo");
	}

	$scope.gotoGSetting = function() {
		$state.go("gsetting");
	}

	$scope.gotoError = function() {
		$state.go("error");
	}

	$scope.gotoHelp = function() {
		$state.go("help", {
			prev: "tab.mine"
		})
	}

	//$scope.gotoSetting = function () {
	//    $state.go('mainsetting');
	//}

});
//我的资料信息
controllers.controller('UserInfoCtrl', function($scope, $state, RscService, BasicService, $ionicModal) {
	$scope.i = 0;
	$scope.isShow = false;
	$scope.gotoBack = function() {
		$state.go("tab.mine");
	}

	if(localStorage.FRTAUTO_RSCAPP_ALLUSRINFO != undefined ||
		localStorage.FRTAUTO_RSCAPP_ALLUSRINFO != '') {
		$scope.currentUser = JSON.parse(localStorage.FRTAUTO_RSCAPP_ALLUSRINFO);
	} else {
		RscService.GetUserInfoByKey()
			.success(function(data) {
				if(data.IsSuccess) {
					$scope.currentUser = data.DataList[0];
					$scope.currentUser.CREATE_DATE = moment($scope.currentUser.CREATE_DATE).format("YYYY-MM-DD HH:mm:ss");
				} else {
					try {
						window.plugins.toast.showShortCenter("亲，获取账号账号信息失败！" + data.ErrCode);
					} catch(e) {}
				}
			})
			.error(function(data) {
				try {
					window.plugins.toast.showShortCenter("亲，获取账号账号信息失败哦！" + data);
				} catch(e) {}
			});
	}

	$scope.logout = function() {

		localStorage.removeItem("FRTAUTO_RSCAPP_USRID"); //用户USR_NO
		//localStorage.removeItem("FRTAUTO_RSCAPP_USRNAME");
		localStorage.removeItem("FRTAUTO_RSCAPP_USRORGID"); //用户ORG_NO
		localStorage.removeItem("FRTAUTO_RSCAPP_ALLUSRINFO"); //用户完整信息
		localStorage.removeItem("FRTAUTO_RSCAPP_LOGINSTATE"); //登录状态
		localStorage.removeItem("FRTAUTO_RSCAPP_EMPSTATE"); //救援工状态

		$state.go("login");
	}

	$scope.editInfo = function() {
		$scope.user = {
			USR_REAL_NAME: $scope.currentUser.USR_REAL_NAME,
			ORG_NAME: $scope.currentUser.ORG_NAME,
			USR_EMAIL: $scope.currentUser.USR_EMAIL,
		};
		$scope.modal.show();
	}
	$ionicModal.fromTemplateUrl('templates/modal.html', {
		scope: $scope
	}).then(function(modal) {
		$scope.modal = modal;
	});

	$scope.updateInfo = function(info) {
		$scope.currentUser = {
			USR_REAL_NAME: info.USR_REAL_NAME,
			ORG_NAME: info.ORG_NAME,
			USR_EMAIL: info.USR_EMAIL
		}
		$scope.modal.hide();
	};

	//当我们用完模型时，清除它！
	$scope.$on('$destroy', function() {
		$scope.modal.remove();
	});
	// 当隐藏模型时执行动作
	$scope.$on('modal.hidden', function() {
		// 执行动作
	});
	// 当移动模型时执行动作
	$scope.$on('modal.removed', function() {
		// 执行动作
	});

	$scope.showMyPosition = function() {
		$scope.i++;
		$scope.isShow = false;
		if($scope.i == 3) {
			$scope.i = 0;
			$scope.isShow = true;
			BasicService.GetGeoLocation(function(bdPoint) {
				//var markers = [{ loc: bdPoint }];
				//angularBMap.drawMarkers(markers, "start");

				BasicService.ShowOnBMap(bdPoint, "start");
			});
		}
	};

});
//关于
controllers.controller('AboutCtrl', function($scope, $rootScope, $state, $ionicLoading, $ionicPopup, $cordovaFileTransfer, $cordovaFileOpener2, $timeout, BasicService) {

	$scope.gotoBack = function() {
		$state.go("tab.mine");
	}

	//公司简介
	$scope.gotoProfile = function() {
		$state.go("corpprofile");
	}

	$scope.isAndroid = false;
	if(ionic.Platform.isAndroid()) {
		$scope.isAndroid = true;
	}

	//当前环境版本
	if(COMM.GetEnvConfig().IS_PRODUCT)
		$scope.environment = '正式环境版本';
	else
		$scope.environment = '测试环境版本';

	$scope.appVersion = localStorage.FRTAUTO_RSCAPP_VERSION;
	$scope.serverAppVersion = "";
	var versionLastest;
	var isForce;

	// 检查更新 start
	$scope.checkUpdate = function() {

		$ionicLoading.show({
			template: "检查最新版本..."
		});

		BasicService.GetSysVersionNoteLatest()
			.success(function(data) {
				$ionicLoading.hide();
				if(data.IsSuccess) {
					BasicService.ShowUpdateWindow(data.DataList[0], true);

				} else {
					window.plugins.toast.showShortCenter("亲，获取最新版本信息失败！" + data.ErrCode);
				}
			})
			.error(function(data) {
				$ionicLoading.hide();
				window.plugins.toast.showShortCenter("亲，获取最新版本信息失败！" + data);
			});

	}
});
//公司介绍
controllers.controller('CorpProfileCtrl', function($scope, $state) {

	$scope.gotoBack = function() {
		$state.go("about");
	}
});
//通用设置信息
controllers.controller('GSettingCtrl', function($scope, $rootScope, $state, $ionicPopup, $ionicLoading, LoginService, $cordovaFile) {

	$scope.gotoBack = function() {
		$state.go("tab.mine");
	}

	$scope.ChangePassword = function() {
		$scope.pwd = {
			pwdOld: '',
			pwdNew1: '',
			pwdNew2: ''
		};
		// 自定义弹窗
		var template = '<div style="margin: -5px -10px;">' +
			'<label class="row item-line"><input type="password" class="item-input" placeholder="当前密码" ng-model="pwd.pwdOld"></label>' +
			'<label class="row item-line"><input type="password" class="item-input" placeholder="输入新密码" ng-model="pwd.pwdNew1"></label>' +
			'<label class="row item-line"><input type="password" class="item-input" placeholder="确认新密码" ng-model="pwd.pwdNew2"></label></div>'
		var myPopup = $ionicPopup.show({
			template: template,
			title: '修改密码',
			scope: $scope,
			buttons: [{
					text: '取消',
					type: 'confirm-cancel',
				},
				{
					text: '保存',
					type: 'confirm-ok',
					onTap: function(e) {
						if(!$scope.pwd.pwdOld ||
							!$scope.pwd.pwdNew1 ||
							!$scope.pwd.pwdNew2) {
							// 不允许用户关闭，除非输入 wifi 密码
							try {
								window.plugins.toast.showShortCenter("请输入密码！");
							} catch(e) {}

							e.preventDefault();
						} else {

							//if ($scope.pwd.pwdOld != localStorage.FRTAUTO_RSCAPP_USRPWD) {
							//    try {
							//        window.plugins.toast.showShortCenter("密码不正确！");
							//    } catch (e) {
							//        var alertPopup = $ionicPopup.alert({
							//            title: '修改密码',
							//            template: '密码不正确!',
							//            okType: 'alert-ok'
							//        });
							//    }
							//    e.preventDefault();
							//}
							//else
							if($scope.pwd.pwdNew1.length < 6) {
								try {
									window.plugins.toast.showShortCenter("新密码长度最少为6位！");
								} catch(e) {
									var alertPopup = $ionicPopup.alert({
										title: '修改密码',
										template: '新密码长度最少为6位！',
										okType: 'alert-ok'
									});
								}
								e.preventDefault();
							} else if($scope.pwd.pwdOld == $scope.pwd.pwdNew1) {
								try {
									window.plugins.toast.showShortCenter("新旧密码相同，请重新输入！");
								} catch(e) {
									var alertPopup = $ionicPopup.alert({
										title: '修改密码',
										template: '新旧密码相同，请重新输入！',
										okType: 'alert-ok'
									});
								}
								e.preventDefault();
							} else if($scope.pwd.pwdNew1.indexOf('#') >= 0 ||
								$scope.pwd.pwdNew1.indexOf('+') >= 0 ||
								$scope.pwd.pwdNew1.indexOf('#') >= 0 ||
								$scope.pwd.pwdNew1.indexOf('+') >= 0) {
								try {
									window.plugins.toast.showShortCenter("亲，密码中不能含有一下特殊字符哦！如：'#','+',...");
								} catch(e) {
									var alertPopup = $ionicPopup.alert({
										title: "修改密码",
										template: "<div class='text-center'>亲，密码中不能含有一下特殊字符哦！如：'#','+',...</div>",
										okType: 'alert-ok'
									});
								}
								e.preventDefault();
							} else if($scope.pwd.pwdNew1 != $scope.pwd.pwdNew2) {
								try {
									window.plugins.toast.showShortCenter("两次输入的新密码不一样！");
								} catch(e) {
									var alertPopup = $ionicPopup.alert({
										title: '修改密码',
										template: '两次输入的新密码不一样!',
										okType: 'alert-ok'
									});
								}
								e.preventDefault();
							} else {
								$ionicLoading.show({
									template: '正在修改密码信息...'
								})
								//修改密码
								LoginService.ResetPassword($scope.pwd)
									.success(function(data) {
										$ionicLoading.hide();
										if(data.IsSuccess) {
											localStorage.FRTAUTO_RSCAPP_USRPWD = $scope.pwd.pwdNew1;

											try {
												window.plugins.toast.showShortCenter("密码修改成功，请妥善保管！");
											} catch(e) {
												var alertPopup = $ionicPopup.alert({
													title: '修改密码',
													template: '密码修改成功，请妥善保管！',
													okType: 'alert-ok'
												});
											}
										} else {
											try {
												window.plugins.toast.showShortCenter("密码修改失败！" + data.ErrCode);
											} catch(e) {
												var alertPopup = $ionicPopup.alert({
													title: '修改密码',
													template: '密码修改失败！' + data.ErrCode,
													okType: 'alert-ok'
												});
											}
										}
									}).error(function(data) {
										$ionicLoading.hide();

										try {
											window.plugins.toast.showShortCenter(data);
										} catch(e) {
											var alertPopup = $ionicPopup.alert({
												title: '修改密码',
												template: data,
												okType: 'alert-ok'
											});
										}
									});
							}
						}
					}
				},
			]
		});
		myPopup.then(function(res) {
			console.log('Reset Password success!', res);
		});
		//$timeout(function() {
		//    myPopup.close(); // 20秒后关闭弹窗
		//}, 20000);
	}

	$scope.ClearCache = function() {

		var confirmPopup = $ionicPopup.confirm({
			title: "清除缓存",
			template: "该操作将会清除存储在本地的救援照片和录音信息，是否继续？",
			okText: '继续',
			okType: 'confirm-ok',
			cancelText: '取消',
			cancelType: 'confirm-cancel'
		});
		confirmPopup.then(function(res) {
			if(res) {
				DoClear();
			}
		});
	}

	function DoClear() {
		$ionicLoading.show({
			template: '清除缓存...'
		});

		var nClear = 5;
		// REMOVE
		$cordovaFile.removeRecursively(cordova.file.applicationStorageDirectory, "cache/").then(function(success) {
			// success
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		}, function(error) {
			// error
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		});

		//$cordovaFile.removeRecursively(cordova.file.applicationStorageDirectory, "files/").then(function (success) {
		//    // success
		//    if (--nClear <= 0) {
		//        $ionicLoading.hide();
		//    }
		//}, function (error) {
		//    // error
		//});

		$cordovaFile.removeRecursively(cordova.file.externalApplicationStorageDirectory, "cache/").then(function(success) {
			// success
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		}, function(error) {
			// error
			//alert(JSON.stringify(error));
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		});

		$cordovaFile.removeRecursively(cordova.file.externalApplicationStorageDirectory, "files/").then(function(success) {
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		}, function(error) {
			// error
			//alert(JSON.stringify(error));
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		});

		$cordovaFile.removeRecursively(cordova.file.externalRootDirectory, "RscFile/Images").then(function(success) {
			// success
			$cordovaFile.createDir(cordova.file.externalRootDirectory, "RscFile/Images", true);
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		}, function(error) {
			// error
			//alert(JSON.stringify(error));
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		});

		$cordovaFile.removeRecursively(cordova.file.externalRootDirectory, "RscFile/Audios").then(function(success) {
			// success
			$cordovaFile.createDir(cordova.file.externalRootDirectory, "RscFile/Audios", true);
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		}, function(error) {
			// error
			//alert(JSON.stringify(error));
			if(--nClear <= 0) {
				$ionicLoading.hide();
			}
		});
	}

	$scope.OpenNativeSetting = function() {
		window.cordova.plugins.settings.open("application_details", function() {
				console.log('opened settings');
			},
			function() {
				console.log('打开设置失败');
			}
		)
	}

});

//帮助页面
controllers.controller('HelpCtrl', function($scope, $stateParams, $rootScope, $state) {
	$scope.gotoBack = function() {
		if($stateParams.prev) {
			$state.go($stateParams.prev);
		} else {
			$state.go("tab.mine");
		}
	}

	$scope.gotoWorkFlow = function() {
		if($stateParams.prev) {
			$state.go("workflow", {
				prev: $stateParams.prev
			});
		} else {
			$state.go("workflow");
		}
	}

	$scope.gotoQA = function() {
		if($stateParams.prev) {
			$state.go("faq", {
				prev: $stateParams.prev
			});
		} else {
			$state.go("faq");
		}
	}
});
//帮助页面-操作流程
controllers.controller('WorkFlowCtrl', function($scope, $stateParams, $rootScope, $state) {
	$scope.gotoBack = function() {
		if($stateParams.prev) {
			$state.go("help", {
				prev: $stateParams.prev
			});
		} else {
			$state.go("help");
		}
	}
});
//帮助页面-问题问答
controllers.controller('FAQCtrl', function($scope, $stateParams, $rootScope, $state) {
	$scope.gotoBack = function() {
		if($stateParams.prev) {
			$state.go("help", {
				prev: $stateParams.prev
			});
		} else {
			$state.go("help");
		}
	}
});

//error page for test
controllers.controller('ErrorInfoCtrl', function($scope, $rootScope, $state) {

	$scope.gotoBack = function() {
		$state.go("tab.home");
	}
});