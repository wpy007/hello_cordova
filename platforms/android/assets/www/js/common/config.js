/**
 * Created by HUP on 2016/5/6.
 */
var COMM = (window['COMM'] || {});

//MD5 加密字符 暗文
COMM.GetMd5Cipher = function () {
    return "bPm&,Yun!shANg@aPP%$jiAMi;";
};

COMM.GetEnvConfig = function () {
    ////测试环境
    //return {
    //    //API_URL: 'http://121.196.238.132:8071/HostPublic',                      //API接口地址
    //    API_URL: 'http://192.168.1.236/BPM.SDIA/HostPublic/',                   //API接口地址
    //    PLATFORM_URL: 'http://121.196.238.132:8081',                            //基地址
    //    UPLOAD_URL: 'http://121.196.238.132:8081/Handler/rscfileupload.ashx',   //文件上传地址
    //    PORTRAIT_UPLOAD_URL: 'http://121.196.238.132:8081/Handler/ProtraitUpload.ashx',//头像上传地址
    //    IS_PRODUCT: false   //正式环境与否
    //};
    //测试环境
    // return {
    //     API_URL: 'http://121.196.238.132:8071/HostPublic/',                      //API接口地址
    //     //API_URL: 'http://192.168.2.164/BT.BPMLIVE.SDIA/HostPublic/',                   //API接口地址
    //     PLATFORM_URL: 'http://121.196.238.132',                            //基地址
    //     UPLOAD_URL: 'http://121.196.238.132:8081/Handler/rscfileupload.ashx',   //文件上传地址
    //     PORTRAIT_UPLOAD_URL: 'http://121.196.238.132:8081/Handler/ProtraitUpload.ashx',//头像上传地址
		// PAYCENTER_URL: 'http://121.196.238.132:8078/',							//支付中心接口地址
    //     IS_PRODUCT: false   //正式环境与否
    // };

    return {
        API_URL: 'http://118.31.228.108:8071/HostPublic/',               //API接口地址
        PLATFORM_URL: 'http://rescue.1jaa.cn/',              //基地址
        UPLOAD_URL: 'http://rescue.1jaa.cn/Handler/rscfileupload.ashx',   //文件上传地址
        PORTRAIT_UPLOAD_URL: 'http://rescue.1jaa.cn/Handler/ProtraitUpload.ashx',//头像上传地址
        // PAYCENTER_URL: 'http://121.196.238.132:8078/',							//支付中心接口地址
        IS_PRODUCT: true   //正式环境与否
    };
    //正式环境
    //return {
    //    API_URL: 'http://120.27.128.14:8071/HostPublic',                    //API接口地址
    //    PLATFORM_URL: 'http://120.27.128.14:8081',                          //平台地址
    //    UPLOAD_URL: 'http://120.27.128.14:8081/Handler/rscfileupload.ashx', //文件上传地址
    //    PORTRAIT_UPLOAD_URL: 'http://120.27.128.14:8081/Handler/ProtraitUpload.ashx',//头像上传地址
    //    IS_PRODUCT: true
    //};
};