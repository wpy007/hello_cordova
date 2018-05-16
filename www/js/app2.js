// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'rescue' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'rescue.services' is found in services.js
// 'rescue.controllers' is found in controllers.js
var app = angular.module('rescue', ['ionic', 'ui.router', 'ngCordova', 'rescue.controllers', 'rescue.services']);

app.run(function ($ionicPlatform, $rootScope, $location, $ionicHistory, $timeout, $cordovaNetwork, $interval, $state, $stateParams,
                  BasicService, RscService, LoginService, $ionicPopup, $cordovaDevice, $ionicLoading, $cordovaMedia, $cordovaGeolocation, $cordovaSQLite, $cordovaFile) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            //StatusBar.styleDefault();
            StatusBar.overlaysWebView(true);
        }

        try {
            //获取当前版本信息
            cordova.getAppVersion.getVersionNumber(function (version) {
                localStorage.FRTAUTO_RSCAPP_VERSION = version;//"1.3.3"; //
                if (ionic.Platform.isAndroid()) {
                    //检测更新
                    checkUpdate();
                }
            }, function (e) {
                localStorage.FRTAUTO_RSCAPP_VERSION = "2.0.0";
            });
        }
        catch (e) {
            //localStorage.FRTAUTO_RSCAPP_VERSION = "Unknown Version";
            localStorage.FRTAUTO_RSCAPP_VERSION = "2.0.0";
        }

        // 检查更新
        function checkUpdate() {
            BasicService.GetSysVersionNoteLatest()
                .success(function (data) {
                    if (data.IsSuccess) {
                        BasicService.ShowUpdateWindow(data.DataList[0], false);
                    }
                });
        }

        ///////////////////////////////////////////////
        //员工状态 初始值: OFFLINE
        localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().OFFLINE;

        ///////////////////////////////////////////////
        /// $cordovaGeolocation 定位插件 start
		var gpsErrorController = 0;
		var networkErrorController = 0;
		
        function GeoSuccess(position) {
            //var gpsPoint = new BMap.Point(position.coords.longitude, position.coords.latitude);
            //BMap.Convertor.translate(gpsPoint, 0, function (point) {
                //坐标转换完之后的回调函数
                var option = (localStorage.FRTAUTO_RSCAPP_WO_NO == null || localStorage.FRTAUTO_RSCAPP_WO_NO == '' || localStorage.FRTAUTO_RSCAPP_WO_NO == undefined) ? '' : 'R';
                RscService.UpdateMySite(position.lng, position.lat, option);
                //alert("转化为百度坐标为：" + point.lng + "," + point.lat);
                //$rootScope.ErrorInfo += ("(" + point.lng + "," + point.lat + ")" + "\n " );
            //});
			
			gpsErrorController = 0	//定位成功重置0
			//BasicService.PlayAudio("www/audio/GPSSuccess.mp3", true);
        };
        function GeoError(err) {
            //$rootScope.ErrorInfo += err + "\n ";
			gpsErrorController++;
			if(gpsErrorController > 1 && ((gpsErrorController & (gpsErrorController - 1)) == 0)) 	//判断是否2的n次方幂,至少连续2次定位失败才提醒，后续按2的n次方幂时间延迟提醒，以免过多声音提醒
				BasicService.PlayAudio("www/audio/GPSError.mp3", true);
        };
        var glocSkip = 0;
        //var posOptions = {timeout: 10000, enableHighAccuracy: true};
        $interval(function () {
			if(localStorage.NetworkState == "none"){
				networkErrorController++;
				if(networkErrorController > 1 && ((networkErrorController & (networkErrorController - 1)) == 0)) 	//判断是否2的n次方幂,至少连续2次网络异常才提醒，后续按2的n次方幂时间延迟提醒，以免过多声音提醒
					BasicService.PlayAudio("www/audio/NetworkError.mp3", true);
			}
			else if (localStorage.FRTAUTO_RSCAPP_LOGINSTATE == 1 && localStorage.NetworkState != "none") {
				networkErrorController = 0	//重置0
				glocSkip++;
                if (localStorage.FRTAUTO_RSCAPP_EMPSTATE == BasicService.Emp_State_List().READY
                    && glocSkip >= 2) {//待命状态每分钟更新点位
					glocSkip = 0;
                    //$cordovaGeolocation.getCurrentPosition(posOptions).then(GeoSuccess, GeoError);
                    BasicService.GetGeoLocation(GeoSuccess, GeoError);
                }
				else if(localStorage.FRTAUTO_RSCAPP_EMPSTATE == BasicService.Emp_State_List().ONLINE
                    && glocSkip >= 4){//在线状态，每两分钟更新点位
                    glocSkip = 0;
                    //$cordovaGeolocation.getCurrentPosition(posOptions).then(GeoSuccess, GeoError);
                    BasicService.GetGeoLocation(GeoSuccess, GeoError);
				}
                else if (localStorage.FRTAUTO_RSCAPP_EMPSTATE == BasicService.Emp_State_List().BUSY) {	//繁忙状态，每半分钟更新点位
                    //$cordovaGeolocation.getCurrentPosition(posOptions).then(GeoSuccess, GeoError);
                    BasicService.GetGeoLocation(GeoSuccess, GeoError);
                }
            }
        }, 30000);

        /////////////////////////////////////////////////
        //更新状态
        $interval(function () {
            if (localStorage.FRTAUTO_RSCAPP_LOGINSTATE == 1 && localStorage.NetworkState != "none") {
                LoginService.GetUserCurrStatus()
                    .success(function (data) {
                        if (data != -1 && data != localStorage.FRTAUTO_RSCAPP_EMPSTATE) {
                            LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
                        }
                    });
            }
        }, 50000);  //1mins 50s

        ///////////////////////////////////////////////
        /// 轮询新任务 start
        function Listening(type) {
            if (localStorage.NetworkState != "none")
            {
				LoginService.heartBeat();
                if (type == 1) { //自动派工
                    RscService.ListenAutoRscWO()
                        .success(function (data) {
                            if (data.IsSuccess) { //true - 有新任务
                             // BasicService.PlayAlarm(true);
                                var result = data.DataList[0];
                                //等待回复状态 不接新单子
                                localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY;
                                //更新状态
                                LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
                                //跳转 地图导航页
                                $state.go("maplocation", { status: 'push', woNo: result.WO_NO });
                            }
                        });
                }
                else { //手工派工
                    RscService.ListenManualRscWO()
                        .success(function (data) {
                            if (data.IsSuccess) { // true - 有新任务
                             // BasicService.PlayAlarm(true);
                                var result = data.DataList[0];
                                //更新工单推送状态
                                RscService.SetRscWOPushFlag(result.WO_NO);
                                var alertTemplate;
                                var okText;
                                if (result.RSC_STEP == "手工派单") {
                                    alertTemplate = '你有一条' + result.RSC_STEP + '，请及时处理！';
                                    okText = '立即查看';
                                }
                                else {
                                	alertTemplate = '你有一条' + result.RSC_STEP + '，请准时处理！';
                                    okText = '查看详情';
                                }

                                var confirmPopup = $ionicPopup.confirm({
                                    title: result.RSC_STEP,
                                    template: alertTemplate,
                                    okText: okText,
                                    okType: 'confirm-ok',
                                    cancelText: '稍后查看',
                                    cancelType: 'confirm-cancel'
                                });
                                confirmPopup.then(function (res) {
                                    if (!ionic.Platform.isIOS()) { //ios
                                     // BasicService.PlayAlarm(false);
                                    }

                                    if (result.RSC_STEP == "手工派单") {
                                        localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().BUSY;
                                        LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);//更新状态

                                        if (res) {
                                            //跳转 地图导航页
                                              $state.go("maplocation", {status: 'push', woNo: result.WO_NO});
//                                          $state.go("listdetail", { woNo: result.WO_NO });
                                        }
                                    }
                                    else if (result.RSC_STEP == "预约任务") {
                                        if (res) {
                                            //跳转 工单详情页
                                            $state.go("listdetail", { woNo: result.WO_NO });
                                        }
                                    }
                                });

                            }
                        });
                }
            }
        }

        //轮询  获取任务信息
        var askSkip = 0;
        //var askTimer =
        $interval(function () {
//          BasicService.PlayAudio("www/audio/msg.wav", true);
            //自动派工
            if (localStorage.FRTAUTO_RSCAPP_LOGINSTATE == 1
                && localStorage.FRTAUTO_RSCAPP_EMPSTATE == BasicService.Emp_State_List().READY) {
                //console.log("Listening !!!");
                Listening(1);
            }
            //手工派工
            if (localStorage.FRTAUTO_RSCAPP_LOGINSTATE == 1
                && ++askSkip >= 15) {
                console.log("Listening 2!!!");
                askSkip = 0;
                Listening(2);
            }
        }, 4000);//2s=>4s
        /// 轮询新任务 end
        ///////////////////////////////////////////////

        ///////////////////////////////////////////////
        /// 心跳 start	心跳并入Listening方法，减少定时器，省电？
        //var beatTimer =
        // $interval(function () {
            // if (localStorage.FRTAUTO_RSCAPP_LOGINSTATE == 1) {
                // console.log("beats! beats! beats!");
                // LoginService.heartBeat();
            // }
        // }, 10000);  //10s
        ///////////////////////////////////////////////
    });

    // 创建文件目录
    function CreateSpecSpace() {
        var baseDir = cordova.file.externalRootDirectory;       //Android File System Layout:  <sdcard>/

        // 创建主目录
        $cordovaFile.createDir(baseDir, "RscFile", true)
            .then(function (success) {
                //alert(JSON.stringify(success));
                // 创建子目录
                $cordovaFile.createDir(baseDir, "RscFile/Images", true);
                $cordovaFile.createDir(baseDir, "RscFile/Audios", true);
            }, function (error) {
                //alert(JSON.stringify(error));
                // 创建子目录
                $cordovaFile.createDir(baseDir, "RscFile/Images", true);
                $cordovaFile.createDir(baseDir, "RscFile/Audios", true);
            });
    }

    //数据库
    //var db = null;
    document.addEventListener('deviceready', function ($rootScope) {
        console.log(FileTransfer);      //文件传输
        console.log(navigator.camera);  //Camera
        //console.log(Media);             //Media

        // listen for Online/Offline event
        localStorage.NetworkState = navigator.connection.type;
        document.addEventListener("offline", onOffline, false);
        document.addEventListener("online", onOnline, false);
		
        function onOnline() {
            window.plugins.toast.showShortBottom('网络已恢复！');
            localStorage.NetworkState = navigator.connection.type;//wifi
        }

        function onOffline() {
            localStorage.NetworkState = navigator.connection.type;//wifi
            window.plugins.toast.showShortBottom('当前网络不可用，请检查您的网络设置！');
        }

        localStorage.DEVICE_UUID = $cordovaDevice.getUUID(); //UUID

        //是否模拟器
        if (window.parent.ripple)
            localStorage.DEVICE_UUID = "ripple";
        //for exp analyze
        localStorage.DEVICE_INFO = JSON.stringify($cordovaDevice.getDevice())

        //平台是否是IOS
        if (ionic.Platform.isIOS())
            localStorage.IS_IOS = true;
        else
            localStorage.IS_IOS = false;

        //创建目录
        CreateSpecSpace();

		cordova.plugins.backgroundMode.setDefaults({
			title: "壹骥救援APP",
			text: "后台运行中",
			resume: true,
			hidden: false,
			bigText: true
		})
		
        cordova.plugins.backgroundMode.on('activate', function () {
            cordova.plugins.backgroundMode.disableWebViewOptimizations();
        });
        // Enable background mode
        cordova.plugins.backgroundMode.enable();
        //$rootScope.ErrorInfo += "backgroundMode end\n ";//log

        //This acquires a partial wakelock, allowing the screen to be dimmed.
        //window.powerManagement.dim(function () {
        //    console.log('Wakelock acquired');
        //}, function () {
        //    console.log('Failed to acquire wakelock');
        //});
        //$rootScope.ErrorInfo += "deviceready end\n ";//log
    }, false);

    ///////////////////////////////////////////////
    //双击退出 start
    $ionicPlatform.registerBackButtonAction(function (e) {
        //$rootScope.ErrorInfo += "registerBackButtonAction\n "; //log
        //判断处于哪个页面时双击退出
        if ($location.path() == '/login' || $location.path() == '/vehselect'
            || $location.path() == '/tab/home'
            || $location.path() == '/tab/list'
            || $location.path() == '/tab/mine') {
            if ($rootScope.backButtonPressedOnceToExit) {
                ionic.Platform.exitApp();
            } else {
                $rootScope.backButtonPressedOnceToExit = true;
                window.plugins.toast.showShortBottom('再按一次退出系统');
                setTimeout(function () {
                    $rootScope.backButtonPressedOnceToExit = false;
                }, 2000);
            }
        }
        //此处遗留一个bug(禁掉后退功能) 待修改
        //else if ($ionicHistory.backView()) {
        //    $rootScope.ErrorInfo += "双击退出 else if\n ";
        //    $ionicHistory.goBack();
        //}
        else {
            if ($rootScope.backButtonPressedOnceToExit) {
                ionic.Platform.exitApp();
            }
            else {
                $rootScope.backButtonPressedOnceToExit = true;
                window.plugins.toast.showShortBottom('再按一次退出系统');
                setTimeout(function () {
                    $rootScope.backButtonPressedOnceToExit = false;
                }, 2000);
            }
        }
        e.preventDefault();
        return false;
    }, 101);
    //双击退出 end
    ///////////////////////////////////////////////

});

app.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    $ionicConfigProvider.platform.ios.tabs.style('standard');
    $ionicConfigProvider.platform.ios.tabs.position('bottom');
    $ionicConfigProvider.platform.android.tabs.style('standard');
    $ionicConfigProvider.platform.android.tabs.position('bottom');

    $ionicConfigProvider.platform.ios.navBar.alignTitle('center');
    $ionicConfigProvider.platform.android.navBar.alignTitle('center');

    $ionicConfigProvider.platform.ios.backButton.previousTitleText('').icon('ion-chevron-left');
    $ionicConfigProvider.platform.android.backButton.previousTitleText('').icon('ion-chevron-left');
    //$ionicConfigProvider.platform.android.backButton.previousTitleText('').icon('ion-android-arrow-back');

    $ionicConfigProvider.platform.ios.views.transition('ios');
    $ionicConfigProvider.platform.android.views.transition('android');

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

        // setup an abstract state for the tabs directive
        .state('tab', {
            url: '/tab',
            cache: true,
            abstract: true,
            templateUrl: 'templates/tabs.html'
        })

        ////////////////////////////////////////////////
        // 三个tabs标签页
        // Each tab has its own nav history stack:
        .state('tab.home', {
            url: '/home',
            views: {
                'tab-home': {
                    templateUrl: 'templates/tab-home.html',
                    controller: 'HomeCtrl'
                }
            }
        })
        .state('tab.list', {
            url: '/list/:woNo',
            views: {
                'tab-list': {
                    templateUrl: 'templates/tab-list.html',
                    controller: 'ListCtrl'
                }
            }
        })
        .state('tab.mine', {
            url: '/mine',
            views: {
                'tab-mine': {
                    templateUrl: 'templates/tab-mine.html',
                    controller: 'MineCtrl'
                }
            }
        })

        //登录
        .state('login', {
            url: '/login',
            cache: false,
            templateUrl: 'templates/login.html',
            controller: 'LoginCtrl'
        })
        //车辆选择
        .state('vehselect', {
            url: '/vehselect',
            cache: false,
            templateUrl: 'templates/vehselect.html',
            controller: 'VehSelectCtrl'
        })

        ////////////////////////////////////////////////
        // procs 流程步骤
        //地图
        .state('maplocation', {
            url: '/maplocation/:status,:woNo',
            cache: false,
            templateUrl: 'templates/proc/maplocation.html',
            controller: 'MapLocationCtrl'
        })
        //拍照
        .state('takephoto', {
            url: '/takephoto/:woNo,:svcItem,:trailStatus',
            cache: false,
            templateUrl: 'templates/proc/takephoto.html',
            controller: 'TakePhotoCtrl'
        })
        //客户确认
        .state('cusconfirm', {
            url: '/cusconfirm/:woNo',
            cache: false,
            templateUrl: 'templates/proc/cusconfirm.html',
            controller: 'CusConfirmCtrl'
        })
        //拖车
        .state('trailer', {
            url: '/trailer/:woNo,:svcItem,:trail,:isAuto',
            cache: false,
            templateUrl: 'templates/proc/trailer.html',
            controller: 'TrailerCtrl'
        })

        ////////////////////////////////////////////////
        // lists 详单
        // 工单详情
        .state('listdetail', {
            url: '/listdetail/:woNo',
            cache: false,
            templateUrl: 'templates/list/listdetail.html',
            controller: 'ListDetailCtrl'
        })
        // 工单图片查看
        .state('showphoto', {
            url: '/showphoto/:woNo',
            cache: false,
            templateUrl: 'templates/list/showphoto.html',
            controller: 'ShowPhotoCtrl'
        })

        ////////////////////////////////////////////////
        // 关于我的内容
        //用户信息
        .state('userinfo', {
            url: '/mine/userinfo',
            cache: false,
            templateUrl: 'templates/mine/userinfo.html',
            controller: 'UserInfoCtrl'
        })
        //通用设置
        .state('gsetting', {
            url: '/mine/gsetting',
            cache: false,
            templateUrl: 'templates/mine/gsetting.html',
            controller: 'GSettingCtrl'
        })
        //关于
        .state('about', {
            url: '/mine/about',
            cache: false,
            templateUrl: 'templates/mine/about.html',
            controller: 'AboutCtrl'
        })
        //公司介绍-关于我们
        .state('corpprofile', {
            url: '/mine/corpprofile',
            cache: true,
            templateUrl: 'templates/mine/corpprofile.html',
            controller: 'CorpProfileCtrl'
        })

        //错误信息
        .state('error', {
            url: '/error',
            cache: false,
            templateUrl: 'templates/errorInfo.html',
            controller: 'ErrorInfoCtrl'
        })

        //帮助文档
        .state('help', {
            url: '/help/:prev',
            cache: true,
            templateUrl: 'templates/mine/help.html',
            controller: 'HelpCtrl'
        })

        //操作流程提示页
        .state('workflow', {
            url: '/workflow/:prev',
            cache: true,
            templateUrl: 'templates/mine/workflow.html',
            controller: 'WorkFlowCtrl'
        })
        //问题描述
        .state('faq', {
            url: '/faq/:prev',
            cache: true,
            templateUrl: 'templates/mine/faq.html',
            controller: 'FAQCtrl'
        })
    ;

    $urlRouterProvider.otherwise('/login');
});
