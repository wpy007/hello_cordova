var services = angular.module('rescue.services', []);

services.factory('BasicService', function ($q, $http, $cordovaMedia, $ionicLoading, $ionicPopup, $cordovaFile, $cordovaFileTransfer, $cordovaFileOpener2, $timeout, $interval) {

    //安装包名称
    var RSCAPP_SYSTEM = "rscapp";

    //员工状态列表
    var EMP_STATE_LIST = {
        OFFLINE: 0,             //离线
        ONLINE: 1,              //在线
        READY: 2,               //待命
        BREAK: 3,               //离开
        BUSY: 4                 //繁忙
    };

    var alarmTimer;

    return {
        //员工状态列表
        Emp_State_List: function () {
            return EMP_STATE_LIST;
        },

        //生成以当前时间为名的名称
        GetRecNameWithTime: function (extension) {
            var myDate = new Date();
            var year = myDate.getFullYear();        //年
            var month = myDate.getMonth() + 1;      //月
            var day = myDate.getDate();             //日
            var hh = myDate.getHours();             //时
            var mm = myDate.getMinutes();           //分
            var ss = myDate.getSeconds();           //秒

            var recName = "RSC_";

            recName += year;

            if (month < 10) recName += "0";
            recName += month;

            if (day < 10) recName += "0";
            recName += day + "_";

            if (hh < 10) recName += "0";
            recName += hh;

            if (mm < 10) recName += '0';
            recName += mm;

            if (ss < 10) recName += '0';
            recName += ss;

            recName += '.' + extension;

            return (recName);
        },

        //获取系统版本信息
        GetSysVersionNoteLatest: function () {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var mCheck = $.md5(RSCAPP_SYSTEM + COMM.GetMd5Cipher());//加密暗文

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/GetSysVersionNoteLatest"
                + "?verSystem=" + RSCAPP_SYSTEM
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },

        //显示下载更新提示框
        ShowUpdateWindow: function (versionLastest, isAlarm) {

            var localAppVersion = localStorage.FRTAUTO_RSCAPP_VERSION;
            var serverAppVersion = versionLastest.VERSION_NO;

            ////版本比较
            if (localAppVersion && serverAppVersion) {
                var serverVersion = serverAppVersion.split('.');
                var baseVersion = localAppVersion.split('.');
                if (serverVersion.length == 3) {
                    for (var i = 0; i < baseVersion.length; i++) {
                        if (baseVersion[i] > serverVersion[i]) {
                            if (isAlarm) {
                                window.plugins.toast.showShortCenter("亲，已经是最新版本啦！");
                            }
                            return;//无需升级，直接返回
                        }
                        else if (serverVersion[i] == baseVersion[i]) {
                            if (i == 2) {
                                if (isAlarm) {
                                    window.plugins.toast.showShortCenter("亲，已经是最新版本啦！");
                                }
                                return;//无需升级，直接返回
                            }
                            else {
                                continue;
                            }
                        }
                        else {
                            break;//升级
                        }
                    }
                }
                else {
                    //版本号规范修改，升级
                }
            }
            else {
                if (isAlarm) {
                    window.plugins.toast.showShortCenter("亲，已经是最新版本啦！");
                }
                return;//获取服务器版本空，无需升级，直接返回
            }

            var isForce = versionLastest.IS_FORCE;
            if (isForce && isForce == 1) {
                ShowUpdateAlert();
            }
            else {
                ShowUpdateConfirm();
            }

            // 显示是否更新对话框
            function ShowUpdateConfirm() {
                var confirmPopup = $ionicPopup.confirm({
                    title: '版本升级',
                    template: '最新版本：<span style="color:#555;">' + versionLastest.VERSION_NO + '</span><br/>'
                    + '版本大小：<span style="color:#555;">' + versionLastest.UDF1 + '</span><br/>'
                    + '发布时间：<span style="color:#555;">' + moment(versionLastest.VERSION_PUBLISH_DATE).format('YYYY年M月D日') + '</span><br/>'
                    + '更新内容<br/><span style="color:#555; font-size:smaller;">' + versionLastest.VERSION_CONTENT + '</span><br/>',
                    okText: '升级',
                    okType: 'confirm-ok',
                    cancelText: '取消',
                    cancelType: 'confirm-cancel'
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        AppDownload();
                    } else {
                        // 取消更新
                    }
                });
            }

            // 显示更新对话框 alert
            function ShowUpdateAlert() {
                var alertPopup = $ionicPopup.alert({
                    title: '版本升级（重要）',
                    template: '最新版本：<span style="color:#555;">' + versionLastest.VERSION_NO + '</span><br/>'
                    + '版本大小：<span style="color:#555;">' + versionLastest.UDF1 + '</span><br/>'
                    + '发布时间：<span style="color:#555;">' + moment(versionLastest.VERSION_PUBLISH_DATE).format('YYYY年M月D日') + '</span><br/>'
                    + '更新内容<br/><span style="color:#555; font-size:smaller;">' + versionLastest.VERSION_CONTENT + '</span><br/>',
                    okText: '确定',
                    okType: 'alert-ok'
                });
                alertPopup.then(function (res) {
                    AppDownload();
                });
            }

            // 下载APP package
            function AppDownload() {

                $ionicLoading.show({
                    template: "已经下载：0%"
                });

                UpdateVersionDownloadCnt(versionLastest.VN_ID);

                var dir = cordova.file.externalRootDirectory + "RscFile/";
                $cordovaFile.checkDir(cordova.file.externalRootDirectory, "RscFile").then(function (success) {
                    // success
                }, function (error) {
                    // error
                    dir = cordova.file.externalRootDirectory;
                });

                var url = versionLastest.VERSION_PACKAGE_URL; //可以从服务端获取更新APP的路径
                //var targetPath = dir + "rscapp.apk"; //APP下载存放的路径，可以使用cordova file插件进行相关配置
                var targetPath = dir + "rscapp-"+ versionLastest.VERSION_NO +".apk"; //APP下载存放的路径，可以使用cordova file插件进行相关配置
                //var trustHosts = true;
                var options = {};
                $cordovaFileTransfer.download(url, targetPath, options, true).then(function (result) {

                    // 打开下载下来的APP
                    $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive'
                    ).then(function () {
                            // 成功
                        }, function (err) {
                            // 错误
                        });
                    $ionicLoading.hide();
                }, function (err) {
                    //alert('下载失败');
                    window.plugins.toast.showShortCenter('下载失败');
                }, function (progress) {
                    //进度，这里使用文字显示下载百分比
                    $timeout(function () {
                        var downloadProgress = (progress.loaded / progress.total) * 100;
                        $ionicLoading.show({
                            template: "已经下载：" + Math.floor(downloadProgress) + "%"
                        });
                        if (downloadProgress > 99) {
                            $ionicLoading.hide();
                        }
                    })
                });
            }

            // 更新下载次数
            function UpdateVersionDownloadCnt(verKey) {
                var deferred = $q.defer();
                var promise = deferred.promise;

                //修改
                var param = [{
                    name: "verKey",
                    value: (verKey ? verKey : "")
                }];

                var strParam = JSON.stringify(param);
                var mCheck = $.md5(strParam + COMM.GetMd5Cipher());//加密暗文

                var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/UpdateVersionDownloadCnt"
                    + "?param=" + strParam
                    + "&token=" + mCheck
                    + "&callback=JSON_CALLBACK";

                $http.jsonp(url)
                    .success(function (response) {
                        //deferred.resolve(response);
                    })
                    .error(function (error) {
                        //deferred.reject(error);
                    });

                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function (fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            }
        },

        //记录异常信息
        CaptureExpLog: function (info, opt) {

            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "info",
                value: (info ? info : "")
            }, {
                name: "opt",
                value: opt
            }, {
                name: "rmk",
                value: localStorage.DEVICE_INFO
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "woNo",
                value: (localStorage.FRTAUTO_RSCAPP_WO_NO ? localStorage.FRTAUTO_RSCAPP_WO_NO : "")
            }];

            var strParam = JSON.stringify(param);
            //var mCheck = $.md5(strParam + COMM.GetMd5Cipher());//加密暗文
            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher());//加密暗文

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/CaptureExpLog"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";
            $http.jsonp(url);

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },

        AddTextToImage: function (deviceDir, text, fileName) {
            var that = this;
            var deferred = $q.defer();
            try {
                var circle_canvas = document.createElement('canvas');
                var context = circle_canvas.getContext("2d");

                // Draw Image function
                var img = new Image();
                img.src = deviceDir + fileName;
                img.onload = function () {
                    circle_canvas.width = img.width;
                    circle_canvas.height = img.height;
                    context.drawImage(img, 0, 0);
                    context.lineWidth = 1;
                    context.fillStyle = "#CC00FF";
                    context.lineStyle = "#ffff00";
                    context.font = "40px serif";
                    var textLine = text.split("<br>")
                    angular.forEach(textLine, function (t, i) {
                        context.fillText(t, 5, 40 + (i*50), img.width - 10);
                    });                    
                    var data = that.DataURItoBlob(circle_canvas.toDataURL('image/jpeg'));
                    that.savebase64AsImageFile(deviceDir, fileName, data).then(function (filePath) {
                        deferred.resolve(filePath);
                    }, function (e) {
                        deferred.resolve(e);
                    });
                }
            } catch (e) {
                deferred.resolve(e);
            }
            return deferred.promise;
        },

        DataURItoBlob: function(dataURI) {
            // convert base64/URLEncoded data component to raw binary data held in a string
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);
 
            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
 
            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
 
            return new Blob([ia], {
                type: mimeString
            });
        },

        /**
         * Create a Image file according to its database64 content only.
         * 
         * @param folderpath {String} The folder where the file will be created
         * @param filename {String} The name of the file that will be created
         * @param content {Base64 String} Important : The content can't contain the following string (data:image/png[or any other format];base64,). Only the base64 string is expected.
         */
        savebase64AsImageFile: function (deviceDir, filename, DataBlob) {
            var deferred = $q.defer();
            try {
                window.resolveLocalFileSystemURL(deviceDir, function (dir) {
                    dir.getFile(filename, { create: true }, function (file) {
                        file.createWriter(function (fileWriter) {
                            fileWriter.onwriteend = function (f) {
                                deferred.resolve(file);
                            };
                            fileWriter.onerror = function (e) {
                                deferred.resolve(e);
                            };
                            fileWriter.write(DataBlob);                            
                        }, function (e) {
                            deferred.resolve(e);
                        });
                    });
                });
            } catch (e) {
                deferred.resolve(e);
            }

            return deferred.promise;
        },

        //获取地理位置，取到的是百度加密坐标bd09ll，只能在百度地图中精确显示
        GetGeoLocation: function (success, error) {
            if (localStorage.DEVICE_UUID != "ripple") {
//              baidumap_location.getCurrentPosition(
//                  function (position, extra) {
//                      //取点位有可能有异常，经纬度异常 4.94065645841247E-32
//                      if (position.longitude > 0.01 && position.longitude > 0.01) {
//                          localStorage.longitude = position.longitude;
//                          localStorage.latitude = position.latitude;
//                          var bdPoint = new BMap.Point(position.longitude, position.latitude);
//                          if (success)
//                              success(bdPoint);
//                      }
//                  },
//                  function (err) {
//                      window.plugins.toast.showLongCenter("定位失败，请在室外空旷处重试并确认已授权获取位置信息。");
//                      if (error)
//                          error(err);
//                  },
//                  { 
//						//超时时间，单位毫秒，默认为0
//						timeout: 10000, 
//						//是否使用高精度设备，如GPS。默认是true
//						enableHighAccuracy: true, 
//						//坐标系
//						coorType: 'bd09ll', 
//						//使用设置时间内的缓存数据，单位毫秒
//						//默认为0，即始终请求新数据
//						//如设为Infinity，则始终使用缓存数据
//						maximumAge: 20000 }
//              )
            }
            else {
                var bdPoint = new BMap.Point(31.211309000000000, 121.465750999999997);
                if (success)
                    success(bdPoint);
            }
        },
        //在地图上显示图标
        ShowOnBMap: function (bdPoint, iconFlag, longitude, latitude) {

            var icon = null;

            if(!bdPoint)
                bdPoint = new BMap.Point(longitude, latitude);//34.7534880000,113.6313490000

            switch (iconFlag) {
                case "start":
                case "trail-s":
                    icon = new BMap.Icon("img/site1.png", new BMap.Size(30, 45), {
                        anchor: new BMap.Size(15, 45)//这句表示图片相对于所加的点的位置
                    });
                    break;
                case "end":
                case "trail-e":
                    icon = new BMap.Icon("img/site2.png", new BMap.Size(30, 45), {
                        anchor: new BMap.Size(15, 45)//这句表示图片相对于所加的点的位置
                    });
                    break;
                default:
                    break;
            }
			
            var map = new BMap.Map("divMapArea");

            map.centerAndZoom(bdPoint, 15);
            var marker = new BMap.Marker(bdPoint, { icon: icon });  // 创建标注
            map.addOverlay(marker);               // 将标注添加到地图中
        },
		GetMapDistance: function(point1Lng, point1Lat, point2Lng, point2Lat){
			if(point1Lng && point1Lat && point2Lng && point2Lat)
			{
//				直线距离
				var point1 = new BMap.Point(point1Lng, point1Lat);
				var point2 = new BMap.Point(point2Lng, point2Lat);
				return new BMap.Map().getDistance(point1, point2);
			}
			else
				return 0;
			
		},
		BaiduNavi: function(destination, destination_lng, destination_lat, success, fail){
			var uri="";
			if(destination)
				uri="bdapp://map/navi?query=" + destination;

			if(destination_lng && destination_lat)		
				uri="bdapp://map/navi?location=" + destination_lat + "," + destination_lng;
            var sApp = startApp.set({ /* params */
				"action":"ACTION_VIEW",    
		　　　　"category":"CATEGORY_DEFAULT",    
		　　　　"type":"text/css",    
		　　　　"package":"com.baidu.BaiduMap",    
		//　　　　"uri":,
		　　　　"uri": uri,
		　　　　"flags":["FLAG_ACTIVITY_CLEAR_TOP","FLAG_ACTIVITY_CLEAR_TASK"],    
		　　　　// "component": ["com.android.GoBallistic","com.android.GoBallistic.Activity"],    
		　　　　"intentstart":"startActivity",    
				}, { /* extras */    
				"EXTRA_STREAM":"extraValue1",    
				"extraKey2":"extraValue2"    
				});
				sApp.start(function() { /* success */
					if(success)
						success;
				}, function(error) { /* fail */   
					if(fail)
						fail;
					alert("调用百度地图失败，请确认已安装百度地图！");
				});
		},
        PlayAlarm: function (flag) {
        	var that=this;
			// that.PlayAudio("www/audio/msg.wav", flag, 3000, 3 );
               if (flag)
               {
                   //播放提示音
                   var src = cordova.file.applicationDirectory + "www/audio/msg.wav";
                   alert(src);
                   var media = $cordovaMedia.newMedia(src);
                   alarmTimer = $interval(function () {
                       media.play(); // Android
                   }, 3000, 2);
                   media.play(); // Android
               }
               else
               {
                   try {
                       $interval.cancel(alarmTimer);
                   }
                   catch (e) {
                   }
               }
        },
		PlayAudio: function(audioPath, flag, delay, times){
			//delay, times为空，默认播放一次
			if(!delay)
				delay == 100;
			
			//默认播放一次，若指定则先减1次
			if(!times)
				times = 1;
			else
				times = times - 1;
			
            if (flag)
            {
				//播放提示音
				var src = cordova.file.applicationDirectory + audioPath;
				var media = $cordovaMedia.newMedia(src);
				media.play();
				if(times > 1){
					alarmTimer = $interval(function () {
						media.play(); // Android
					}, delay, times);
				}
            }
            else
            {
                try {
                    $interval.cancel(alarmTimer);
                }
                catch (e) {
                }
            }
		},
		//仅支持一级对象
		GetObjectFromLocalStorage: function(lsName, keyName, keyValue, fnCallback){
			var ObjectList = angular.fromJson(localStorage[lsName])
			if(ObjectList.length > 1 && keyName && keyValue && fnCallback){
				angular.forEach(objectList, function(obj, index){
						for(var pName in obj){
							if(pName == keyName){
								if(obj[keyName] == keyValue){
									fnCallback(obj);
									return 999;									
								}
							}
						}
						return 1
					});
			}
			else{
				return 0;
			}
		},
		//仅支持一级对象
		DeleteObjectFromLocalStorage: function(objectList, keyName, keyValue){
			if(objectList.length > 1 && keyName && keyValue && fnCallback){
				angular.forEach(objectList, function(obj, index){
						for(var pName in obj){
							if(pName == keyName){
								if(obj[keyName] == keyValue)
									fnCallback(obj);
									return 1;
							}	
						}
					});
				return 0;
			}
			else{
				return -1;
			}
		}
    };

});

services.factory('LoginService', function ($q, $http, BasicService) {

    return {
        //登录
        login: function (name, pwd) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            //修改
            var param = [{
                name: "userName",
                value: ((name == null || name == undefined) ? "" : name)
            }, {
                name: "userPassword",
                value: ((pwd == null || pwd == undefined) ? "" : pwd)
            }, {
                name: "uuid",
                value: localStorage.DEVICE_UUID
            }, {
                name: "loginFrom",
                value: 'rscapp'
            }, {
                name: "version",
                value: localStorage.FRTAUTO_RSCAPP_VERSION
            }, {
                name: "clientOS",
                value: ionic.Platform.platform().toUpperCase()
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(strParam + COMM.GetMd5Cipher());//加密暗文

            var url = COMM.GetEnvConfig().API_URL + "/IDS_Host.svc/CAALogon"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";


            //$http.jsonp(url, {userName:((name == null || name == "undefined") ? "" : name), userPassword:((pwd == null || pwd == "undefined") ? "" : pwd), cache:false})
            $http.jsonp(url)
                .success(function (response) {
                    if (response.IsSuccess && response.iTotalCnt > 0) {
                        //登录成功
                        loginResult = response.DataList[0];
                        if (loginResult != null && loginResult != 'undefined') {
                            //localStorage.FRTAUTO_RSCAPP_SIGNTOKEN = loginResult.SignToken;

                            if (localStorage.FRTAUTO_RSCAPP_USRID != loginResult.USR_ID) {
                                localStorage.removeItem("FRTAUTO_RSCAPP_EMP_CARNO");    //清空
                                localStorage.removeItem("FRTAUTO_RSCAPP_EMP_CARTYPE");  //清空
                            }

                            //保存用户基本信息
                            localStorage.FRTAUTO_RSCAPP_USRID = loginResult.USR_ID; //用户USR_NO
                            localStorage.FRTAUTO_RSCAPP_USRNAME = loginResult.USR_NAME; //用户名
                            localStorage.FRTAUTO_RSCAPP_USRPWD = pwd; //用户密码

                            localStorage.FRTAUTO_RSCAPP_USREMPNO = loginResult.USR_EMP_NO; //员工编号名
                            localStorage.FRTAUTO_RSCAPP_USRMOBILE = loginResult.EMP_PHONE; //员工手机号
                            localStorage.FRTAUTO_RSCAPP_USRREALNAME = loginResult.EMP_NAME; //用户真实姓名

                            localStorage.FRTAUTO_RSCAPP_USRORGNO = loginResult.ORG_NO; //用户ORG_NO
                            localStorage.FRTAUTO_RSCAPP_SUP_NO = loginResult.SUP_NO;//服务商代码
                            localStorage.FRTAUTO_RSCAPP_SUP_NAME = loginResult.SUP_NAME;//服务商名称
                            localStorage.FRTAUTO_RSCAPP_SUP_MOBILE = loginResult.SUP_MOBILE;//服务商电话
                            localStorage.FRTAUTO_RSCAPP_SUP_MANAGE_USRID = loginResult.SUP_MANAGE_USRID;//服务商主管理者USRID
                            localStorage.FRTAUTO_RSCAPP_SUP_MANAGE_EMPNO = loginResult.SUP_MANAGE_EMPNO;//服务商主管理者EMPNO

                            if (loginResult.USR_AVATAR_PATH == undefined || loginResult.USR_AVATAR_PATH == "") {
                                loginResult.USR_AVATAR_PATH = COMM.GetEnvConfig().PLATFORM_URL + loginResult.USR_AVATAR_PATH;
                            }
                            // 用户登录状态
                            localStorage.FRTAUTO_RSCAPP_LOGINSTATE = 1;
                            localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().ONLINE; //在线
                            // 保存完整信息
                            localStorage.FRTAUTO_RSCAPP_ALLUSRINFO = JSON.stringify(loginResult);

                            //清空
                            localStorage.FRTAUTO_RSCAPP_WO_NO = '';       //当前救援单号
                            localStorage.FRTAUTO_RSCAPP_WO_FROM = '';     //业务来源
                            localStorage.FRTAUTO_RSCAPP_OUT_NO = '';  //子单号

                        }
                        //deferred.resolve({state: localStorage.loginState , errCode: response.ErrCode});
                    }
                    else {
                        //登录失败
                        //清除用户基本信息
                        localStorage.removeItem("FRTAUTO_RSCAPP_USRORGNO");//用户ORG_NO
                        localStorage.removeItem("FRTAUTO_RSCAPP_ALLUSRINFO");//用户信息 完整
                        localStorage.FRTAUTO_RSCAPP_LOGINSTATE = 0; //用户登录状态
                    }
                    deferred.resolve(response.ErrCode);
                    //deferred.resolve(response);
                })
                .error(function (a, b, c, d, e, f) {
                    deferred.resolve();
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //心跳
        heartBeat: function () {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var url = COMM.GetEnvConfig().API_URL + "/IDS_Host.svc/HeartBeat"
                + "?usrId=" + localStorage.FRTAUTO_RSCAPP_USRID
                + "&token=" + $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher())//加密暗文
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url);

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //重设密码
        ResetPassword: function (pwd) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            //修改
            var param = [{
                name: "usrPwdOld",
                value: ((pwd.pwdOld == null || pwd.pwdOld == undefined) ? "" : pwd.pwdOld)
            }, {
                name: "usrPwdNew",
                value: ((pwd.pwdNew1 == null || pwd.pwdNew1 == undefined) ? "" : pwd.pwdNew1)
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(strParam + COMM.GetMd5Cipher());//加密暗文

            var url = COMM.GetEnvConfig().API_URL + "/IDS_Host.svc/ResetPassword"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //更新当前状态
        UpdateCurrStatus: function (status) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "status",
                value: (status ? status : "")
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(strParam + COMM.GetMd5Cipher());//加密暗文  + 单号

            var url = COMM.GetEnvConfig().API_URL + "/IDS_Host.svc/UpdateCurrStatus"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //获取当前状态
        GetUserCurrStatus: function () {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher());//加密暗文  + 单号
            var url = COMM.GetEnvConfig().API_URL + "/IDS_Host.svc/GetUserCurrStatus"
                + "?usrId=" + localStorage.FRTAUTO_RSCAPP_USRID
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        }
    }
});

//救援
services.service('RscService', function ($q, $http, $cordovaToast) {

    return {
        //获取用户相关信息
        GetUserInfoByKey: function () {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher());//加密暗文

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/GetUserInfoByKey"
                + "?usrId=" + localStorage.FRTAUTO_RSCAPP_USRID
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },

        //发送位置信息
        UpdateMySite: function (lng, lat, option, place) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "lng",
                value: (lng ? lng : "")
            }, {
                name: "lat",
                value: (lat ? lat : "")
            }, {
                name: "carNo",
                value: localStorage.FRTAUTO_RSCAPP_EMP_CARNO
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "usrOrgId",
                value: localStorage.FRTAUTO_RSCAPP_USRORGNO
            }, {
                name: "woNo",
                value: (localStorage.FRTAUTO_RSCAPP_WO_NO ? localStorage.FRTAUTO_RSCAPP_WO_NO : "")
            }, {
                name: "woFrom",
                value: (localStorage.FRTAUTO_RSCAPP_WO_FROM ? localStorage.FRTAUTO_RSCAPP_WO_FROM : "")
            }, {
                name: "option",
                value: (option ? option : "")
            }, {
                name: "place",
                value: (place ? place : "")
            }, {
                name: "outNo",
                value: (localStorage.FRTAUTO_RSCAPP_OUT_NO ? localStorage.FRTAUTO_RSCAPP_OUT_NO : "")
            }, {
                name: "usrName",
                value: localStorage.FRTAUTO_RSCAPP_USRNAME
            }, {
                name: "empNo",
                value: (localStorage.FRTAUTO_RSCAPP_USREMPNO ? localStorage.FRTAUTO_RSCAPP_USREMPNO : "")
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher());//加密暗文

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/UpdateMySite"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";
            $http.jsonp(url)
                .success(function (response) {
                    //预留的bug，配合平安触发的接口
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },

        //获取服务商车辆信息列表
        GetRscSPCarList: function () {

            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "supNo",
                value: localStorage.FRTAUTO_RSCAPP_SUP_NO
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_SUP_NO + COMM.GetMd5Cipher());//加密暗文

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/GetRscSPCarListbySPNo"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (data) {
                    deferred.resolve(data);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //保存救援工和救援车辆关系
        SaveVehToWKR: function () {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "carNo",
                value: localStorage.FRTAUTO_RSCAPP_EMP_CARNO
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher());//�����ַ�

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/SaveVehToWkr"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                    //console.log("save OK!!!!!!");
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },

        //获取救援中工单情况
        GetRscDoingCnt: function () {

            var deferred = $q.defer();
            var promise = deferred.promise;

            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher());//加密暗文
            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/GetRscDoingCnt"
                + "?usrId=" + localStorage.FRTAUTO_RSCAPP_USRID
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //获取工单总数
        GetRscWOTotalCnt: function () {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher());//加密暗文
            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/GetRscWOTotalCnt"
                + "?usrId=" + localStorage.FRTAUTO_RSCAPP_USRID
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },

        //获取新任务信息 按（工单号）获取
        GetRscWOMstrByWoNo: function (woNo) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var mCheck = $.md5(woNo + COMM.GetMd5Cipher());//加密暗文
            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/GetRscWOMstrByWoNo"
                + "?woNo=" + (woNo ? woNo : "")
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //获取救援工单列表 按（页）获取
        GetRscWoMstrListByPage: function ($scope, start) {

            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "usrOrgId",
                value: localStorage.FRTAUTO_RSCAPP_USRORGNO
            }, {
                name: "search",
                value: (($scope.param && $scope.param.search) ? $scope.param.search : "")
            }, {
                name: "timestamp",
                value: (($scope.lastItem && $scope.lastItem.UPDATE_DATE) ? $scope.lastItem.UPDATE_DATE : "")
            }, {
                name: "start",
                value: ((start == 0 || start == 1) ? "0" : ($scope.param.curPage * $scope.param.perPage))
            }, {
                name: "length",
                value: $scope.param.perPage
            }, {
                name: "sColumns",
                value: "WO_NO,CREATE_DATE,CAR_NO,RSC_CAR_NO,WO_STATUS"
            }, {
                name: "iSortCol",
                value: 1
            }, {
                name: "sSortMode",
                value: "desc"
            }, {
                name: "PARAMS_EQU_RSC_STEP",
                value: (($scope.param && $scope.param.tabValue) ? $scope.param.tabValue : "")
            }];

            //var encryWord = ((start == 0 || start == 1) ? "0" : ($scope.param.curPage * $scope.param.perPage));
            var strParam = JSON.stringify(param);
            var mCheck = "";//$.md5(encryWord + COMM.getMd5Pwd());//加密字符

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/GetRscWoMstrListByPage"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (data) {

                    if (data.IsSuccess) {
                        $scope.param.hasMore = data.HasMore;
                        $scope.param.curPage++;

                        if (start == 0) {
                            $scope.RscWoList = data.DataList;
                            $scope.lastItem = data.DataList[0];
                        }
                        else if (start == 1) {
                            if ($scope.lastItem.CREATE_DATE != data.DataList[0].CREATE_DATE) {
                                $scope.RscWoList = data.DataList;
                            }
                        }
                        else {
                            for (var i = 0; i < data.DataList.length; i++) {
                                $scope.RscWoList.push(data.DataList[i]);
                            }
                        }

                        //for (var i = 0; i < $scope.RscWoList.length; i++) {
                        //    //var cus_mobile_cipher = $scope.taskList[i].cus_mobile;//手机号密文
                        //    //if (cus_mobile_cipher.length >= 7) {
                        //    //    cus_mobile_cipher = cus_mobile_cipher.substr(0, 3) + '****' + cus_mobile_cipher.substr(7);
                        //    //}
                        //    //$scope.taskList[i].cus_mobile_cipher = cus_mobile_cipher;
                        //
                        //    $scope.RscWoList[i].CREATE_DATE = moment($scope.RscWoList[i].CREATE_DATE).format("YYYY-MM-DD HH:mm:ss");
                        //}
                    }

                    deferred.resolve(data);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //获取照片列表信息
        GetRscWOFileList: function (woNo, fileClass) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "woNo",
                value: woNo
            }, {
                name: "fileClass",
                value: fileClass
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(strParam + COMM.GetMd5Cipher());//加密暗文

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/GetRscWOFileList"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },

        //询问自动分配任务
        ListenAutoRscWO: function () {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher());//加密暗文
            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/ListenAutoRscWO"
                + "?param=" + localStorage.FRTAUTO_RSCAPP_USRID
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //询问手工分配任务
        ListenManualRscWO: function () {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var mCheck = $.md5(localStorage.FRTAUTO_RSCAPP_USRID + COMM.GetMd5Cipher());//加密暗文
            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/ListenManualRscWO"
                + "?param=" + localStorage.FRTAUTO_RSCAPP_USRID
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
		
		////支付相关开始
		//获取支付金额
		GetAmount: function(woNO){
			var deferred = $q.defer();
            var promise = deferred.promise;

			var mCheck = $.md5(woNO + COMM.GetMd5Cipher());//加密字符
			
            var param = [{
                name: "TRANSACTION_NO",
                value: woNO
            }];
			
			var strParam = JSON.stringify(param);
			
            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/GetAmountByTransactionNo"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
		},
		//获取付款二维码
		GetPayQRCode: function(channelNo, woNO){
            var deferred = $q.defer();
            var promise = deferred.promise;

			var mCheck = $.md5(woNO + COMM.GetMd5Cipher());//加密字符
			
            var param = [{
                name: "CHANNEL_NO",
                value: channelNo
            }, {
                name: "TRANSACTION_NO",
                value: woNO
            }, {
                name: "PAYMENT_SCENE",
                value: "NATIVE"
			}];
			
			var strParam = JSON.stringify(param);
			
            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/Payment"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
		},
		
		PayOff: function(paymentID){
            var deferred = $q.defer();
            var promise = deferred.promise;

			//var mCheck = $.md5(paymentID + COMM.GetMd5Cipher());//加密字符
			
            var param = "{\"paymentId\": \"" + paymentID + "\"}";
			
			//var strParam = JSON.stringify(param);
			
            var url = COMM.GetEnvConfig().PAYCENTER_URL + "/GetStatus"

			$http({
				method:'post',
				url:url,
				data:param
			}).success(function(response){
				deferred.resolve(response);
			}).error(function (error) {
                    deferred.reject(error);
                });
            
			// $http.jsonp(url)
                // .success(function (response) {
                    // deferred.resolve(response);
                // })
                // .error(function (error) {
                    // deferred.reject(error);
                // });

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
		},
		////支付相关结束
		
        //////////////////////////工单信息修改
        //更新工单推送与否状态
        SetRscWOPushFlag: function (woNo) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var mCheck = $.md5(woNo + COMM.GetMd5Cipher());//加密暗文  + 单号
            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/SetRscWOPushFlag"
                + "?param=" + woNo
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    //deferred.resolve(response);
                })
                .error(function (error) {
                    //deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //回复工单分配状态
        ReplyForRscWOMstr: function (woNo, reply, reason) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "woNo",
                value: (woNo ? woNo : "")
            }, {
                name: "reply",
                value: (reply ? reply : 0)
            }, {
                name: "reason",
                value: (reason ? reason : "")
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "usrOrgId",
                value: localStorage.FRTAUTO_RSCAPP_USRORGNO
            }, {
                name: "usrName",
                value: localStorage.FRTAUTO_RSCAPP_USRNAME
            }, {
                name: "usrMobile",
                value: localStorage.FRTAUTO_RSCAPP_USRMOBILE
            }, {
                name: "supNo",
                value: localStorage.FRTAUTO_RSCAPP_SUP_NO
            }, {
                name: "supName",
                value: localStorage.FRTAUTO_RSCAPP_SUP_NAME
            }, {
                name: "supMobile",
                value: localStorage.FRTAUTO_RSCAPP_SUP_MOBILE
            }, {
                name: "supManageUsrId",
                value: localStorage.FRTAUTO_RSCAPP_SUP_MANAGE_USRID
            }, {
                name: "supManageEmpNo",
                value: localStorage.FRTAUTO_RSCAPP_SUP_MANAGE_EMPNO
            }, {
                name: "usrRealName",
                value: (localStorage.FRTAUTO_RSCAPP_USRREALNAME ? localStorage.FRTAUTO_RSCAPP_USRREALNAME : "")
            }, {
                name: "empNo",
                value: (localStorage.FRTAUTO_RSCAPP_USREMPNO ? localStorage.FRTAUTO_RSCAPP_USREMPNO : "")
            }, {
                name: "carNo",
                value: (localStorage.FRTAUTO_RSCAPP_EMP_CARNO ? localStorage.FRTAUTO_RSCAPP_EMP_CARNO : "")
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(woNo + COMM.GetMd5Cipher());//加密暗文  + 单号

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/ReplyForRscWOMstr"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //取消or退回 工单
        CancelRscWoMstr: function (woNo, reason) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "woNo",
                value: (woNo ? woNo : "")
            }, {
                name: "reason",
                value: (reason ? reason : "")
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "usrOrgId",
                value: localStorage.FRTAUTO_RSCAPP_USRORGNO
            }, {
                name: "usrName",
                value: localStorage.FRTAUTO_RSCAPP_USRNAME
            }, {
                name: "usrRealName",
                value: (localStorage.FRTAUTO_RSCAPP_USRREALNAME ? localStorage.FRTAUTO_RSCAPP_USRREALNAME : "")
            }, {
                name: "empNo",
                value: (localStorage.FRTAUTO_RSCAPP_USREMPNO ? localStorage.FRTAUTO_RSCAPP_USREMPNO : "")
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(woNo + COMM.GetMd5Cipher());//加密暗文  + 单号

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/CancelRscWoMstr"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //更新回拨时间
        UpdateCallbackDate: function (woNo) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "woNo",
                value: woNo
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "usrOrgId",
                value: localStorage.FRTAUTO_RSCAPP_USRORGNO
            }, {
                name: "usrName",
                value: localStorage.FRTAUTO_RSCAPP_USRNAME
            }, {
                name: "usrRealName",
                value: (localStorage.FRTAUTO_RSCAPP_USRREALNAME ? localStorage.FRTAUTO_RSCAPP_USRREALNAME : "")
            }, {
                name: "empNo",
                value: (localStorage.FRTAUTO_RSCAPP_USREMPNO ? localStorage.FRTAUTO_RSCAPP_USREMPNO : "")
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(woNo + COMM.GetMd5Cipher());//加密字符

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/UpdateCallbackDate"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (data) {
                    deferred.resolve(data);
                })

            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //更新工单中救援工操作状态（出发、到达、拖车出发、拖车到达）
        UpdateRscWorkerOption: function (woNo, option) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "woNo",
                value: (woNo ? woNo : "")
            }, {
                name: "option",
                value: (option ? option : "")
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "usrOrgId",
                value: localStorage.FRTAUTO_RSCAPP_USRORGNO
            }, {
                name: "usrName",
                value: localStorage.FRTAUTO_RSCAPP_USRNAME
            }, {
                name: "usrRealName",
                value: (localStorage.FRTAUTO_RSCAPP_USRREALNAME ? localStorage.FRTAUTO_RSCAPP_USRREALNAME : "")
            }, {
                name: "empNo",
                value: (localStorage.FRTAUTO_RSCAPP_USREMPNO ? localStorage.FRTAUTO_RSCAPP_USREMPNO : "")
            }, {
                name: "carNo",
                value: localStorage.FRTAUTO_RSCAPP_EMP_CARNO
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(woNo + COMM.GetMd5Cipher());//加密暗文  + 单号

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/UpdateRscWorkerOption"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //修改工单救援状态
        UpdateRscWOToPend: function (woNo, option) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "woNo",
                value: (woNo ? woNo : "")
            }, {
                name: "option",
                value: (option ? option : "")
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "usrOrgId",
                value: localStorage.FRTAUTO_RSCAPP_USRORGNO
            }, {
                name: "usrName",
                value: localStorage.FRTAUTO_RSCAPP_USRNAME
            }, {
                name: "usrRealName",
                value: (localStorage.FRTAUTO_RSCAPP_USRREALNAME ? localStorage.FRTAUTO_RSCAPP_USRREALNAME : "")
            }, {
                name: "empNo",
                value: (localStorage.FRTAUTO_RSCAPP_USREMPNO ? localStorage.FRTAUTO_RSCAPP_USREMPNO : "")
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(woNo + COMM.GetMd5Cipher());//加密暗文  + 单号

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/UpdateRscWOToPend"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //保存图片信息
        SaveRscPhotoInfo: function (woNo, imagesList) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "woNo",
                value: (woNo ? woNo : "")
            }, {
                name: "photos",
                value: (imagesList ? imagesList : "")
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "usrOrgId",
                value: localStorage.FRTAUTO_RSCAPP_USRORGNO
            }, {
                name: "usrName",
                value: localStorage.FRTAUTO_RSCAPP_USRNAME
            }, {
                name: "usrRealName",
                value: (localStorage.FRTAUTO_RSCAPP_USRREALNAME ? localStorage.FRTAUTO_RSCAPP_USRREALNAME : "")
            }, {
                name: "empNo",
                value: (localStorage.FRTAUTO_RSCAPP_USREMPNO ? localStorage.FRTAUTO_RSCAPP_USREMPNO : "")
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(woNo + COMM.GetMd5Cipher());//加密暗文  + 单号

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/SaveRscPhotoInfo"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        },
        //保存客户评价
        SaveEvaluateInfo: function (woNo, evaluate, audio, woInfo) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var param = [{
                name: "woNo",
                value: (woNo ? woNo : "")
            }, {
                name: "evaluate",
                value: (evaluate ? evaluate : "")
            }, {
                name: "audio",
                value: (audio ? audio : "")
            }, {
                name: "arrive_mileage",
                value: (woInfo.ARRIVE_MILEAGE ? woInfo.ARRIVE_MILEAGE : "")
            }, {
                name: "trailer_mileage",
                value: (woInfo.TRAILER_MILEAGE ? woInfo.TRAILER_MILEAGE : "")
            }, {
                name: "usrId",
                value: localStorage.FRTAUTO_RSCAPP_USRID
            }, {
                name: "usrOrgId",
                value: localStorage.FRTAUTO_RSCAPP_USRORGNO
            }, {
                name: "usrName",
                value: localStorage.FRTAUTO_RSCAPP_USRNAME
            }, {
                name: "usrRealName",
                value: (localStorage.FRTAUTO_RSCAPP_USRREALNAME ? localStorage.FRTAUTO_RSCAPP_USRREALNAME : "")
            }, {
                name: "empNo",
                value: (localStorage.FRTAUTO_RSCAPP_USREMPNO ? localStorage.FRTAUTO_RSCAPP_USREMPNO : "")
            }];

            var strParam = JSON.stringify(param);
            var mCheck = $.md5(woNo + COMM.GetMd5Cipher());//加密暗文  + 单号

            var url = COMM.GetEnvConfig().API_URL + "/RSC_Host.svc/SaveEvaluateInfo"
                + "?param=" + strParam
                + "&token=" + mCheck
                + "&callback=JSON_CALLBACK";

            $http.jsonp(url)
                .success(function (response) {
                    deferred.resolve(response);
                })
                .error(function (error) {
                    deferred.reject(error);
                });
            promise.success = function (fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function (fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
        }
        //工单信息修改
    }
});

//检错
services.service('CheckService', function ($state, $ionicPopup, LoginService, BasicService) {

    return {
        //根据错误码提示
        CheckErrCode: function (errCode, woInfoClear, empState, $scope, woListClear) {

            if (errCode == "-100" || errCode == "-101" || errCode == "-102" || errCode == "-110") {
                //更新状态
                if (empState) {
                    localStorage.FRTAUTO_RSCAPP_EMPSTATE = empState;
                    LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
                }
                else {
                    localStorage.FRTAUTO_RSCAPP_EMPSTATE = BasicService.Emp_State_List().ONLINE;
                    LoginService.UpdateCurrStatus(localStorage.FRTAUTO_RSCAPP_EMPSTATE);
                }
                //工单信息清空
                if (woInfoClear) {
                    localStorage.removeItem("FRTAUTO_RSCAPP_WO_NO");
                    localStorage.removeItem("FRTAUTO_RSCAPP_WO_FROM");
                    localStorage.removeItem("FRTAUTO_RSCAPP_OUT_NO");
                }
                //工单列表清除该项
                if (woListClear) {
                    $scope.RscWoList.splice($scope.RscWoList.indexOf($scope.data.item), 1);
                }

                var showMsg = "未知";
                if (errCode == "-100") {//已经完成
                    showMsg = "该救援单已经完成";
                }
                else if (errCode == "-101") {//已经取消
                    showMsg = "该救援单已经取消";
                }
                else if (errCode == "-102") { //已经退回
                    showMsg = "该救援单已经退回";
                }
                else if (errCode == "-110") {
                    showMsg = "该救援单状态已经发生变化，请刷新工单列表";
                }
                $ionicPopup.alert({
                    title: "工单状态",
                    template: "<div class=\"text-center\">" + showMsg + "</div> ",
                    okText: "确定 ",
                    okType: 'alert-ok'
                }).then(function () {
                    $state.go("tab.home");
                });
                return true;
            }
            else
                return false;
        }
    }
});


