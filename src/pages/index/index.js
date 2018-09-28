//index.js
//获取应用实例
const app = getApp();
let setSign = require("../../utils/util.js");
let commonJs = require("../../utils/common.js");

//防止重复点击付费
let payCount = 0,
    jumpCount = 0,
    iconClick = 0,
    isFromPay = false;
Page({
  data: {
    loadingShow : true,
    authorizeShow : false,
    discountShow : false,
    isLoginTemplate : true,
    hasDiscount : false,
    discountIcon : "",
    discountDetail : "",
    hasBuy : false,
  },
  async onLoad(){
    isFromPay = false;
    wx.setNavigationBarTitle({
      title : '装扮少女'
    });
    //预加载默认图片
    let localImages = [
      "../../images/exam/1/houtoufa1_0_1.png",
      "../../images/exam/3/body_3_3.png",
      "../../images/exam/13/wuguan1_3_13.png",
      "../../images/exam/15/liuhai1_3_15.png",
      "../../images/exam/0/beijing11_5_0.png"
    ];
    localImages.map((el)=>{
      commonJs.getImgOnload(el);
    })
  },
  async onShow(options){
    console.log('onShow', isFromPay);
    if(!isFromPay){
      payCount = 0;
      jumpCount = 0;
      iconClick = 0;
      this.setData({
        hasDiscount : false,
        loadingShow : true,
        hasBuy : false,
        discountShow : false,
        authorizeShow : false
      })
      app.globalData.discountTemData = "";
      try{
        await app.getOsid();
        await app.authorizeJudge();
        let discountData = await app.getDiscountData('dressupHome', this);
        if(discountData){
          if(discountData.isUnlock == '1'){
            this.setData({
              hasBuy : true
            })
          }
        }
      }catch(e){
         console.log("reject: ", e);
      }
      this.setData({
        loadingShow : false
      })
    }
  },
  bindGetUserInfo: function(e) {
    console.log(e.detail.userInfo)
  },
  goToEditor(e){
    app.globalData.itemJson = "";
    isFromPay = false;
    wx.navigateTo({
      url: '../../pages/editor/editor'
    })
  },
  goToStore(){
    app.eventApi('show', '素材装扮');
    isFromPay = false;
    wx.navigateTo({
      url: '../../pages/store/store'
    })
  },
  goToDressup(){
    app.eventApi('show', '精选装扮');
    isFromPay = false;
    wx.navigateTo({
      url: '../../pages/dressList/dressList'
    })
  },
  //加载图片
  getImgOnload(el) {
    wx.getImageInfo({
      src: el,
      success: function (res) {
      },
      fail: function (e) {
      }
    })
  },
  onShareAppMessage : function(){
    return {
      title: '治愈系小仙女换装',
      path: 'pages/index/index',
      imageUrl: '../../images/share_bg.png'
    }
  },
  callUpLogin : function(){
    this.setData({
        authorizeShow : true
      })
    // if(!app.globalData.hasLogin){
    //   this.setData({
    //     authorizeShow : true
    //   })
    // }
    // this.setData({
    //   discountShow : true
    // })
  },
  //授权控件
  async authorizeClose(e){
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
  //限时特惠
  async buyDiscount(){
    let discountItem = JSON.parse(this.data.discountDetail);
    let itemId = discountItem.productId,
        itemJson = discountItem.dressupJson;
    if(this.data.hasBuy){
      jumpCount++;
      if(jumpCount == 1){
        app.globalData.itemJson = JSON.stringify(itemJson);
        app.globalData.addNewTag = false;
        isFromPay = false;
        wx.navigateTo({
          url: '../../pages/editor/editor',
          success : ()=>{
            this.setData({
              discountShow : false,
              hasDiscount : false
            })
          }
        });
      }
      return;
    }
    if(!app.globalData.hasLogin){
      this.setData({
        authorizeShow : true
      })
    }else {
      try{
        payCount++;
        if(payCount == 1){
          await app.authorizeJudge();
          app.eventApi('order', '首页限时卡片', itemId);
          await app.buyItem(itemId);
          app.globalData.itemJson = JSON.stringify(itemJson);
          app.globalData.addNewTag = true;
          isFromPay = true;
          this.setData({
            hasBuy : true
          })
          // wx.navigateTo({
          //   url: '../../pages/editor/editor',
          //   success : ()=>{
          //     this.setData({
          //       discountShow : false
          //     })
          //   }
          // })
        };
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
  },
  discountClick(){
    app.eventApi('show', '首页限时卡片');
    this.setData({
      discountShow : true,
      discountDetail : app.globalData.discountTemData
    })
  },
  async discountClose(e){
    iconClick = 0;
    payCount = 0;
    if(this.data.hasBuy){
      //第二次点击刷新接口
      let discountData = await app.getDiscountData('dressupHome', this);
      if(discountData){
        if(discountData.isUnlock == '1'){
          this.setData({
            hasBuy : true
          })
        }else {
          this.setData({
            hasBuy : false
          })
        }
      }else {
        this.setData({
          hasDiscount : false
        })
      }
    }
    this.setData({
      discountShow : false
    })
  }
})
