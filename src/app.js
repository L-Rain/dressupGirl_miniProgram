
let commonJs = require("utils/common.js");
let setSign = require("utils/util.js");
//app.js
App({
  async onLaunch() {
    //获取临时登录凭证
    let temCode = await commonJs.userLogin();
    this.globalData.temCode = temCode;
    //获取相册授权
    commonJs.getPhotoAuthorize().then(()=>{
        this.globalData.photoAuthorize = true;
    }).catch((e)=>{
        this.globalData.photoAuthorize = false;
        console.log('reject: ', e);
    });
  },
  async authorizeJudge(){
    if(!!!this.globalData.openId){
        //获取用户授权信息
        let userInfo = await commonJs.getUserInfo();
        if(userInfo == '请先进行登录授权'){
            this.globalData.hasLogin = false;
            return;
        }
        this.globalData.hasLogin = true;
        //wx.request POST指定content-type
        let userToken = await commonJs.getApi(
            '登录',
            'https://hdapi.wecut.com/v1/applet/getToken.php',
            'POST',
            {
                metaJson : JSON.stringify(userInfo),
                sign: setSign.getSign(),
                ts: setSign.getTs(),
                code : this.globalData.temCode,
                appversion : this.globalData.appversion,
                appId : this.globalData.appId,
                osid : this.globalData.osId
            },
            {
                'content-type': 'application/x-www-form-urlencoded'
            },
        );
        this.globalData.token = userToken.token;
        this.globalData.openId = userToken.openId;
    }else {
        return true
    }
  },
  async buyItem(itemId){
    let header = {
      'content-type': 'application/x-www-form-urlencoded'
    };
    if(this.globalData.token){
      header.Authorization = 'Bearer ' + this.globalData.token;
    }
    let payItem = await commonJs.getApi(
        '支付',
        'https://pay.wecut.com/getXcxPay.php',
        'POST',
        {
            sign: setSign.getSign(),
            ts: setSign.getTs(),
            appversion : this.globalData.appversion,
            appId : this.globalData.appId,
            osid : this.globalData.osId,
            openId : this.globalData.openId,
            productId : itemId
        },
        header,
    );
    payItem = JSON.parse(JSON.parse(payItem));
    await new Promise((resolve, reject)=>{
      wx.requestPayment({
        timeStamp : ""+payItem.timeStamp,
        nonceStr : payItem.nonceStr,
        package :  payItem.package,
        signType : "MD5",
        paySign : payItem.paySign,
        success : (res)=>{
          resolve(res)
        },
        fail : (e)=>{
          reject(e.errMsg);
        }
      })
    })
  },
  //限时特惠
  async getDiscountData(name, object){
    let header = {};
    if(this.globalData.token){
      header.Authorization = 'Bearer ' + this.globalData.token;
    }
    let discountData = await commonJs.getApi(
      '限时特惠',
      'https://hdapi.wecut.com/v1/dressupgirl/getSaleDressup.php',
      'GET',
      {
          sign: setSign.getSign(),
          ts: setSign.getTs(),
          appversion : this.globalData.appversion,
          appId : this.globalData.appId,
          osid : this.globalData.osId
      },
      header
    );
    if(discountData[name]){
      let discountList = JSON.stringify(discountData[name]);
      this.globalData.discountTemData = discountList;
      object.setData({
        hasDiscount : true,
        discountIcon : discountData[name].icon
      })
    }else {
      object.setData({
        hasDiscount : false
      })
    };
    return discountData[name]
  },
  //获取贴纸
  async getAllStickers(){
    let header = {};
    if(this.globalData.token){
      header.Authorization = 'Bearer ' + this.globalData.token;
    }
    let newData = await commonJs.getApi(
      '获取贴纸',
      'https://hdapi.wecut.com/v1/dressupgirl/getDressup.php',
      'GET',
      {
        sign: setSign.getSign(),
        ts: setSign.getTs(),
        appId : this.globalData.appId,
        osid : this.globalData.osId,
        appversion : this.globalData.appversion,
      },
      header
    );
    this.globalData.dataList = newData;
    return newData;
  },
  getOsid(){
    let _this = this;
    //获取设备信息
    return new Promise((resolve,reject)=>{
      wx.getSystemInfo({
        success : (res)=>{
          if(res.system.indexOf('Android') > -1){
              _this.globalData.osId = 2;
          }else if(res.system.indexOf('iOS') > -1){
              _this.globalData.osId = 1;
          }else {
              _this.globalData.osId = 3;
          }
          resolve();
        }
      });
    })
  },
  //统计事件
  async eventApi(event, source, itemId){
    let thisEvent = "";
    thisEvent = event == 'show' ? 'pro_info_show' : 'pro_info_order';
    let thisJson = `[{"event" : "${thisEvent}","source" : "${source}","osid" : "${this.globalData.osId}","appver" : "${this.globalData.appversion}"}]`;
    if(itemId){
        thisJson = `[{"event" : "${thisEvent}","source" : "${source}","osid" : "${this.globalData.osId}","appver" : "${this.globalData.appversion}", "sku" : "${itemId}"}]`
    }
    let newData = await commonJs.getApi(
      source + event + '统计',
      'https://hdapi.wecut.com/v1/applet/eventStat.php',
      'GET',
      {
        sign: setSign.getSign(),
        ts: setSign.getTs(),
        appId : this.globalData.appId,
        osid : this.globalData.osId,
        appversion : this.globalData.appversion,
        metaJson : thisJson
      }
    );
  },
  //素材商店获取分类
  async getStoreTag(index = 1,count = 20){
    let tagData = await commonJs.getApi(
      '商店分类',
      'https://hdapi.wecut.com/v1/dressupgirl/getPackageCategory.php',
      'GET',
      {
        sign: setSign.getSign(),
        ts: setSign.getTs(),
        appId : this.globalData.appId,
        osid : this.globalData.osId,
        appversion : this.globalData.appversion,
        index : index,
        count : count
      }
    );
    this.globalData.storeTagList = tagData;
    return tagData;
  },
  //素材商店获取商品列表
  async getStoreList(categoryId, index = 1, count = 20){
    let header = {};
    if(this.globalData.token){
      header.Authorization = 'Bearer ' + this.globalData.token;
    }
    let storeList = await commonJs.getApi(
      '商店列表',
      'https://hdapi.wecut.com/v1/dressupgirl/getPackageList.php',
      'GET',
      {
        sign: setSign.getSign(),
        ts: setSign.getTs(),
        appId : this.globalData.appId,
        osid : this.globalData.osId,
        appversion : this.globalData.appversion,
        categoryId : categoryId,
        index : index,
        count : count
      },
      header
    );
    this.globalData.storeList = storeList;
    return storeList;
  },
  //素材商店上报解锁
  async postStoreUnlock(packageId){
    let header = {};
    if(this.globalData.token){
      header.Authorization = 'Bearer ' + this.globalData.token;
    }else {
        return false
    }
    let storeList = await commonJs.getApi(
      '商店上报',
      'https://hdapi.wecut.com/v1/dressupgirl/reportUnlock.php',
      'GET',
      {
        sign: setSign.getSign(),
        ts: setSign.getTs(),
        appId : this.globalData.appId,
        osid : this.globalData.osId,
        appversion : this.globalData.appversion,
        packageId : packageId
      },
      header
    );
    return true
  },
  globalData: {
    userInfo: null,
    //音频控制
    musicMainControl : false,
    //接口总数据
    dataList : [],
    //精选装扮单个选项对应json
    itemJson : '',
    //精选装扮对应数据数组与翻页
    selectedList : [],
    selectedIndex : 1,
    selectedDownloadAll : false,
    token : "",
    appversion : '1.4.0',
    appId : '10051',
    osId : 0,
    temCode : "",
    openId : "",
    hasLogin : false,
    photoAuthorize : false,
    discountTemData : "",
    addNewTag : false,
    storeTagList : [],
    storeList : [],
  },
})