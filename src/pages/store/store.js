const app = getApp();
let setSign = require("../../utils/util.js");
let commonJs = require("../../utils/common.js");

let payCount = 0,
    jumpCount = 0,
    temTagList = [],
    originalTagList = [];
Page({
  data: {
    currentTab : 0,
    tagList: [],
    cardList : [],
    loadingShow : true,
    authorizeShow : false,
    isLoginTemplate : true,
    index : 1,
    listId : 0,
    listName : "",
  },
  async onShow(){
    payCount = 0;
    jumpCount = 0;
    temTagList = [];
    originalTagList = [];
    this.setData({
      tagList : [],
      cardList : [],
      index : 1,
      loadingShow : true,
      authorizeShow : false
    })
    try{
      await app.authorizeJudge();
      let tagData = await app.getStoreTag();
      originalTagList = JSON.parse(JSON.stringify(tagData));
      console.log('初始化tagData', originalTagList);
      //读取缓存
      let tagInStorage = wx.getStorageSync('storeTagList');
      if(tagInStorage){
        console.log('初始：', JSON.parse(tagInStorage));
        for(let el of tagData){
          for(let dom of JSON.parse(tagInStorage)){
            if(el.name == dom.name){
              if(el.newtip !== 0 && el.newtip == dom.newtip){
                el.newtip = 0;
              }
            }
          }
        }
      }
      //记录分类tag点击位置，重入页面时加载对应数据
      let hasTagData = false;
      for(let el of tagData){
        if(el.name == this.data.listName){
          this.data.listId = el.categoryId;
          hasTagData = true;
        }
      }
      //加载对应数据
      let listData;
      if(hasTagData){
        listData = await app.getStoreList(this.data.listId);
      }else {
        listData = await app.getStoreList(tagData[0].categoryId);
        this.data.listId = tagData[0].categoryId;
        this.data.listName = tagData[0].name;
      }
      this.setData({
        tagList : tagData,
        cardList : listData,
        listId : this.data.listId,
        listName : this.data.listName
      })
      //保存初始数据
      temTagList = JSON.parse(JSON.stringify(tagData));
      console.log('tagData', tagData);
      console.log('listData', listData);
    }catch(e){
      console.log(e);
    }
    this.setData({
      loadingShow : false
    })
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title : '素材商店'
    });
  },
  onReady: function () {

  },
  async swichTag(e){
    let cur = e.currentTarget.dataset.current,
        thisId = e.currentTarget.dataset.id,
        thisName = e.currentTarget.dataset.name;
    if (this.data.currentTab == cur) { return false; }
    else {
      this.setData({
        currentTab: cur,
        loadingShow : true,
        cardList : []
      })
      let listData = await app.getStoreList(thisId);
      let tagTemData = temTagList;
      //赋值缓存
      let tagInStorage = wx.getStorageSync('storeTagList'),
          temTag = [tagTemData[0]],
          canPush = true;
      if(tagInStorage){
        let thisTag = JSON.parse(tagInStorage);
        //有重复的则无需添加,且第一条数据必须更新
        temTag = thisTag;
        temTag[0].newtip = originalTagList[0].newtip;
        thisTag.forEach((el, num)=>{
          if(el.name == tagTemData[cur].name){
            originalTagList.forEach((dom,count)=>{
              if(dom.name == tagTemData[cur].name){
                el.newtip = dom.newtip;
              }
            })
            canPush = false;
          }
        })
        if(canPush){
          temTag.push(tagTemData[cur])
        }
      }else {
        temTag[0].newtip = originalTagList[0].newtip;
        temTag.push(tagTemData[cur]);
      }
      temTag = JSON.stringify(temTag);
      wx.setStorageSync('storeTagList', temTag);
      tagTemData[0].newtip = 0;
      tagTemData[cur].newtip = 0;
      this.setData({
        cardList : listData,
        loadingShow : false,
        listId : thisId,
        listName : thisName,
        tagList : tagTemData
      });
    }
  },
  async pageListPay(id, json, index){
    if(!app.globalData.hasLogin){
      this.setData({
        authorizeShow : true
      })
    }else {
      payCount++;
      if(payCount == 1){
        try{
          await app.authorizeJudge();
          app.eventApi('order', '素材商店', id);
          await app.buyItem(id);
          this.data.cardList[index].isUnlock = "1";
          this.setData({
            cardList : this.data.cardList
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
  async tagClick(e){
    jumpCount++;
    if(jumpCount == 1){
      let json = e.currentTarget.dataset.json,
          type = e.currentTarget.dataset.type,
          itemPackageId = e.currentTarget.dataset.package,
          itemProductId = e.currentTarget.dataset.product,
          isUnlock = e.currentTarget.dataset.lock,
          thisIndex = e.currentTarget.dataset.index;
      console.log(itemPackageId, itemProductId);
      if(isUnlock == "1"){
        this.goToEditor();
      }else {
        if(type == "1" || type == "2"){
          //先进行上报解锁
          if(await app.postStoreUnlock(itemPackageId)){
            this.goToEditor();
          }else {
            app.globalData.hasLogin = false;
            this.setData({
              authorizeShow : true
            })
          }
        }else if(type == "3"){
          payCount = 0;
          await this.pageListPay(itemProductId, json, thisIndex);
        }
      }
      jumpCount = 0;
    }
  },
  goToEditor : function(json){
    app.globalData.itemJson = json ? JSON.stringify(json) : "";
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
  async onReachBottom(e){
    this.data.index++;
    let listData = await app.getStoreList(this.data.listId, this.data.index);
    if(listData.length == 0){
      commonJs.msgTips(`${this.data.listName}素材已全部加载`);
    }else {
      let newData = this.data.cardList.concat(listData);
      this.setData({
        cardList : newData
      });
    }
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
