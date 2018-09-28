const app = getApp();
let setSign = require("../../utils/util.js");
let commonJs = require("../../utils/common.js");

let payCount = 0,
    jumpCount = 0;
Page({
  data: {
    dressupList: [],
    selectedIndex: 1,
    loadingShow : true,
    authorizeShow : false,
    isLoginTemplate : true
  },
  async onShow(){
    this.setData({
      loadingShow : true,
      authorizeShow : false,
      dressupList: [],
      selectedIndex : 1
    })
    payCount = 0;
    jumpCount= 0;
    await app.authorizeJudge();
    this.getData(1);
    this.setData({
      loadingShow : false
    })
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title : '精选装扮'
    });
  },
  onReady: function () {
    // this.setData({
    //   dressupList: app.globalData.selectedList,
    //   selectedIndex: app.globalData.selectedIndex
    // })
    // this.getData(app.globalData.selectedIndex);

  },
  getData(index){
    let header = {};
    if(app.globalData.token){
      header.Authorization = 'Bearer ' + app.globalData.token;
    }
    wx.request({
      url: 'https://hdapi.wecut.com/v1/dressupgirl/getFeaturedDressup.php',
      data: {
        sign: setSign.getSign(),
        ts: setSign.getTs(),
        count: 6,
        index: index,
        appversion : app.globalData.appversion,
        appId : app.globalData.appId,
        osid : app.globalData.osId
      },
      header : header,
      fail: () => {
        commonJs.msgTips('精选装扮接口请求失败');
      },
      success: (data) => {
        console.log(data.data.data);
        // if(app.globalData.selectedDownloadAll){
        //   commonJs.msgTips('精选装扮已全部加载');
        // }else {
        //   let dataList = data.data.data;
        //   if(dataList.length < 6){
        //     commonJs.msgTips('精选装扮已全部加载');
        //     app.globalData.selectedDownloadAll = true;
        //   }
        //   //缓存精选装扮请求结果
        //   dataList = this.data.dressupList.concat(dataList);
        //   app.globalData.selectedList = dataList;
        //   this.setData({
        //     dressupList: dataList
        //   })
        // }
        let dataList = data.data.data;
        if(dataList.length == 0){
          commonJs.msgTips('精选装扮已全部加载');
        }
        dataList = this.data.dressupList.concat(dataList);
        this.setData({
          dressupList: dataList
        })
      }
    });
  },
  async pageListPay(e){
    if(!app.globalData.hasLogin){
      this.setData({
        authorizeShow : true
      })
    }else {
      payCount++;
      if(payCount == 1){
        let itemId = e.currentTarget.dataset.id,
            itemType = e.currentTarget.dataset.type,
            itemJson = e.currentTarget.dataset.json;
        try{
          await app.authorizeJudge();
          app.eventApi('order', '精选装扮', itemId);
          await app.buyItem(itemId);
          app.globalData.itemJson = JSON.stringify(itemJson);
          app.globalData.addNewTag = true;
          wx.navigateTo({
            url: '../../pages/editor/editor'
          })
        }catch(e){
          console.log("reject: ", e);
          if(e !== 'requestPayment:fail cancel'){
            commonJs.msgTips(e);
            this.onShow();
          }else {
            payCount = 0;
          }
        }
      }
    }
  },
  goToEditor : function(e){
    let json = e.currentTarget.dataset.json;
    app.globalData.itemJson = JSON.stringify(json);
    app.globalData.addNewTag = true;
    wx.navigateTo({
      url: '../../pages/editor/editor'
    })
  },
  onShareAppMessage : function(){
    return {
      title: '治愈系小仙女换装',
      path: 'pages/index/index',
      imageUrl: '../../images/share_bg.png'
    }
  },
  onReachBottom : function(e){
    // app.globalData.selectedIndex++;
    // this.getData(app.globalData.selectedIndex);
    this.data.selectedIndex++;
    this.getData(this.data.selectedIndex);
  },
  //登录控件
  authorizeClose : function(e){
    let hasLogin = e.detail.hasLogin;
    if(hasLogin == undefined || hasLogin == true){
      if(hasLogin){
        app.globalData.hasLogin = true;
        this.onShow();
      }
      this.setData({
        authorizeShow : false
      })
    }
  },
})
