cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "com.lampa.startapp.startapp",
    "file": "plugins/com.lampa.startapp/www/startApp.js",
    "pluginId": "com.lampa.startapp",
    "merges": [
      "startApp"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-whitelist": "1.3.3",
  "com.lampa.startapp": "0.1.4"
};
// BOTTOM OF METADATA
});