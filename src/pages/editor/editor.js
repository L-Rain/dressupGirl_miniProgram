//index.js
const app = getApp();
let setSign = require("../../utils/util.js");
let commonJs = require("../../utils/common.js");
//记录数据
let temArry = [
  {
    name: "后头发",
    categoryId: "7",
    type: "2",
    layerIndex: "1",
    src: "../../images/exam/1/houtoufa1_0_1.png",
  },
  {
    name: "身体",
    categoryId : "1",
    type: "5",
    layerIndex: "3",
    src: "../../images/exam/3/body_3_3.png",
  },
  {
    name: "五官",
    categoryId: "2",
    type: "6",
    layerIndex: "13",
    src: "../../images/exam/13/wuguan1_3_13.png"
  },
  {
    name: "刘海",
    categoryId: "3",
    type: "7",
    layerIndex: "15",
    src: "../../images/exam/15/liuhai1_3_15.png",
  },
  {
    name: "背景",
    categoryId: "4",
    type: 1,
    layerIndex: 0,
    src: "../../images/exam/0/beijing11_5_0.png",
  },
],dataResult = [];
//缓存数据
let sessionTemArry = [],
    sessionData = [],
    sessionBg = "../../images/exam/0/beijing11_5_0.png";
//页面返回设定新ID
let pageCount = 0;
//图片像素倍率,以两倍页面像素处理canvas
const picIpx = 1;

//音乐控件
let innerAudioContext = "";

let payCount = 0,
jumpCount = 0;

Page({
  data: {
    currentTab: 0, //预设当前项的值,
    //图片数据
    itemList: [],
    //高度
    scrollHeight: 300,
    itemListShow : true,
    //图片选中数组
    itemSelected: temArry,
    bgSelected: "../../images/exam/0/beijing11_5_0.png",
    canvasWidth : "",
    canvasHeight : "",
    canvasHide : false,
    canvasId: 'canvas' + pageCount,
    musicShow : false,
    musicOpen : true,
    loadingShow : true,
    authorizeShow : false,
    discountShow : false,
    isLoginTemplate : true,
    hasDiscount : false,
    discountIcon : "",
    discountDetail : "",
    hasBuy : false,
    isInitial : true,
  },
  async onShow(){
    payCount = 0;
    jumpCount = 0;
    //音频控制
    if (app.globalData.musicMainControl){
      // innerAudioContext.pause();
      this.setData({
        musicOpen: false
      })
    }else {
      // innerAudioContext.play();
      this.setData({
        musicOpen: true
      })
    };

    //canvas控制
    //从缓存获取数据
    let hasJump = wx.getStorageSync('hasJump');
    if (hasJump) {
      //开关canvas，删除旧canvas生成新的canvas并分配新id
      this.setData({
        canvasHide: true
      });
      pageCount++;
      wx.setStorage({
        key: 'hasJump',
        data: false
      });
      this.setData({
        canvasHide: false,
        canvasId: 'canvas' + pageCount
      })
    };
    //非初始状态重复获取接口
    if(!this.data.isInitial){
      this.setData({
        loadingShow : true,
        hasBuy : false,
        isLoginTemplate : true,
        discountShow : false,
        hasDiscount : false,
      })
      try{
        //限时特惠控制
        app.globalData.discountTemData = "";
        await app.authorizeJudge();
        let discountData = await app.getDiscountData('dressupEdit', this);
        if(discountData){
          if(discountData.isUnlock == '1'){
            this.setData({
              hasBuy : true
            })
          }
        }
      }catch(e){
        console.log("reject", e);
      }
      this.setData({
        loadingShow : false
      })
    }
  },
  onHide : function(){
    this.setData({
      isInitial : false
    })
    innerAudioContext.pause();
  },
  onUnload : function(){
    innerAudioContext.pause();
  },
  async onLoad(options) {
    this.setData({
      loadingShow : true
    })
    //加载音乐
    innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.autoplay = true
    innerAudioContext.loop = true
    innerAudioContext.src = 'https://f.wecut.com/xcxmusic/backdrop_music1.m4a';
    innerAudioContext.onError((res) => {
      this.setData({
        musicShow: false
      });
    })
    innerAudioContext.onCanplay(() => {
      this.setData({
        musicShow : true
      })
    })

    var _this = this;
    try {
      await app.authorizeJudge();
      //限时特惠控制
      app.globalData.discountTemData = "";
      let discountData = await app.getDiscountData('dressupEdit', this);
      if(discountData){
        if(discountData.isUnlock == '1'){
          this.setData({
            hasBuy : true
          })
        }
      }
      //获取贴纸接口
      let allStickers = await app.getAllStickers();
      console.log('allStickers', allStickers);
      // for(let el of allStickers[11].dressupList){
      //   if(el.dressupId == '523' || el.dressupId == '895' || el.dressupId == "911" || el.dressupId == '986'){
      //     console.log(el.dressupId, el.type);
      //   }
      // }
      //获取系统信息
      wx.getSystemInfo({
        //获取系统信息成功，将系统窗口的宽高赋给页面的宽高
        success: function (res) {
          _this.canvasWidth = res.windowWidth
          _this.canvasHeight = res.windowHeight
        }
      });
    }catch(e){
      commonJs.msgTips(e);
    }

    await this.jsonCaculate();

    this.setData({
      loadingShow : false
    })
  },
  //点击对应图片
  itemClick: function (e) {
    let dataSet = e.currentTarget.dataset,
        layerIndex = dataSet.layerindex,
        sortIndex = dataSet.sortindex,
        itemSrc = dataSet.src,
        itemType = dataSet.type,
        itemId = dataSet.categoryid,
        itemName = dataSet.name;
    let canPush = true;
    //同类别的替换
    if(temArry.length !== 0){
      for(let item of temArry){
        //同大类下更换地址
        if (item.categoryId == itemId){
          //上衣9 一类不可复选，需替换
          if(itemId == '9'){
            item.src = itemSrc;
            item.type = itemType;
            item.name = itemName;
            item.layerIndex = layerIndex;
            canPush = false;
          }else {
            //同大类下同类别更换地址
            if (item.type == itemType) {
              item.src = itemSrc;
              item.type = itemType;
              item.name = itemName;
              item.layerIndex = layerIndex;
              canPush = false;
            }else {
              //同大类下不同类别添加数组并增加选中
              canPush = true;
            }
          }
          //对原始数据进行遍历，赋值选中状态
          this.setSelect(itemType, sortIndex, itemId);
        }else {
          //非同大类下同类别
          if (item.type == itemType) {
            this.setSelect(itemType, sortIndex, itemId);
            item.src = itemSrc;
            item.categoryId = itemId;
            item.name = itemName;
            item.layerIndex = layerIndex;
            item.type = itemType;
            canPush = false;
          }
        }
        //单独赋值背景
        if (itemId == "4") {
          canPush = false;
          if (item.categoryId == itemId){
            item.src = itemSrc;
            this.setData({
              bgSelected: itemSrc
            });
          }
        }
      }
    }
    //连衣裙categoryid=5，不可与categoryid=9 6 10 11（上衣／裙子／裤子／外套）同时使用
    if (itemId == '9' || itemId == '6'
    || itemId == '10' || itemId == '11'){
      //删除连衣裙
      temArry.forEach((dom,index)=>{
        if (dom.categoryId == '5'){
          temArry.splice(index, 1);
          this.resetAllIcons(dom.categoryId);
        }
      })
    } else if (itemId == '5'){
      //删除上衣／裙子／裤子／外套
      //先还原选中
      temArry.forEach((dom, index) => {
        if (dom.categoryId == '9' || dom.categoryId == '6'
        || dom.categoryId == '10' || dom.categoryId == '11') {
          this.resetAllIcons(dom.categoryId);
        }
      });
      //再删除数组
      for(let i=0, len = temArry.length; i<len;i++){
        if (temArry[i]){
          if (temArry[i].categoryId == '9' || temArry[i].categoryId == '6'
            || temArry[i].categoryId == '10' || temArry[i].categoryId == '11') {
              temArry.splice(i, 1);
              i--;
            }
        }
      }
    };
    if (canPush){
      //对原始数据进行遍历，赋值选中状态
      this.setSelect(itemType, sortIndex, itemId);
      //数组插入选择后的数据
      temArry.push({ name: itemName, categoryId: itemId, layerIndex: layerIndex, src: itemSrc, type: itemType });
    };
    //对选择层级进行排序
    temArry = temArry.sort(this.compare('layerIndex'));
    //绑定操作对象，赋值选中状态
    this.setData({
      itemSelected: temArry,
      itemList: dataResult
    });
    // console.log("切换完成", JSON.parse(JSON.stringify(temArry)));
  },
  //设置选中
  setSelect(type, index, id){
    if(id=="9"){
      for (let el of dataResult[this.data.currentTab].dressupList) {
        el.isSelected = 0;
      }
    }else {
      //同种类type进行替换
      for (let el of dataResult){
        for (let dom of el.dressupList){
          if (type == dom.type) {
            dom.isSelected = 0;
          }
        }
      }
    }
    //对原始数据进行遍历，赋值选中状态
    dataResult[this.data.currentTab].dressupList[index].isSelected = 1;
    //点击后去除new tag
    dataResult[this.data.currentTab].dressupList[index].isNew = 0;
  },
  //删除对应图片
  deleteItem(e) {
    let itemId = e.currentTarget.dataset.categoryid;
    //图片数组删除对应图片
    for (let i = 0, len = temArry.length; i < len; i++) {
      if (temArry[i]) {
        if (temArry[i].categoryId == itemId){
          temArry.splice(i, 1);
          i--;
        }
      }
    }
    //选中样式数组回归默认
    for (let el of dataResult[this.data.currentTab].dressupList){
      el.isSelected = 0;
    }
    this.setData({
      itemSelected: temArry,
      itemList : dataResult
    });
  },
  //有互斥服装则删除对应的选中样式
  resetAllIcons(id){
    dataResult.forEach((el, count) => {
      if (el.categoryId == id) {
        for (let dom of el.dressupList){
          dom.isSelected = 0;
        }
      }
    })
  },
  //还原所有选中数据
  resetAll(){
    wx.showModal({
      content: '是否清空当前所有装扮?',
      confirmColor: '#f0b4cc',
      success: (res)=> {
        if (res.confirm) {
          temArry = JSON.parse(JSON.stringify(sessionTemArry));
          dataResult = JSON.parse(JSON.stringify(sessionData));
          this.setData({
            itemList: dataResult,
            itemSelected: temArry,
            bgSelected: sessionBg
          })
        }
      }
    })
  },
  //音乐开关
  musicControl(){
    this.data.musicOpen = !this.data.musicOpen;
    if(this.data.musicOpen){
      innerAudioContext.play();
      app.globalData.musicMainControl = false;
    }else {
      innerAudioContext.pause();
      app.globalData.musicMainControl = true;
    }
    this.setData({
      musicOpen: this.data.musicOpen
    })
  },
  // 生成图片
  generateImage(){
    if(!app.globalData.photoAuthorize){
      this.setData({
        authorizeShow : true,
        isLoginTemplate : false
      });
      return;
    }
    wx.showLoading({
      title: '图片生成中...',
    });
    let _this = this,
        imgWidth = "",
        imgHeight = "";
    //获取图片在页面内的宽高
    let getImageLayer = new Promise(function (resolve, reject) {
      var query = wx.createSelectorQuery();
      query.select('#model_layout').boundingClientRect()
      query.exec(function (res) {
        imgWidth = res[0].width;
        imgHeight = res[0].height;
        resolve();
      })
    })

    //先加载图片
    let promiseOnload = Promise.all(this.data.itemSelected.map((el) => {
      return this.getImgOnload(el)
    }),getImageLayer);
    promiseOnload.then((res)=>{
      // console.log(res);
      //手动延迟，防止加载本地资源过快导致canvas绘图为空？？？
      setTimeout(()=>{
        //加载图片完成后进行canvas绘图
        let ctx = wx.createCanvasContext(_this.data.canvasId),
          height = _this.canvasHeight,
          width = _this.canvasWidth;
        //遍历数组绘图,居中对齐
        //先绘制背景
        for (let el of res){
          if (el.el.categoryId == "4"){
            let bg = ctx.createPattern(el.res.path, 'repeat');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, width * 4, height * 4);
          }
        };
        //再绘制图片叠加
        for(let el of res){
          if (el.el.categoryId !== "4"){
            ctx.drawImage(el.res.path, (width * picIpx - imgWidth * picIpx) / 2, (height * picIpx - imgWidth * picIpx) / 2, imgHeight * picIpx, imgHeight * picIpx);
          }
        };
        let iconCanvasWidth, picScale;
        picScale = imgHeight / 1242;
        iconCanvasWidth = 362 * picScale;

        // ctx.draw();

      ctx.draw(false, function () {
        //先保存全身像
        wx.canvasToTempFilePath({
          canvasId: _this.data.canvasId,
          success: function (res) {
            var tempFilePath = res.tempFilePath;
            //再保存头像
            wx.canvasToTempFilePath({
              canvasId: _this.data.canvasId,
              x: (width / 2 - iconCanvasWidth / 2) * picIpx,
              y: ((height - imgHeight) / 2 + imgHeight * 108 / 1242) * picIpx,
              width: iconCanvasWidth * picIpx,
              height: iconCanvasWidth * picIpx,
              destWidth: iconCanvasWidth * picIpx,
              destHeight: iconCanvasWidth * picIpx,
              success: function (data) {
                var tempIconFilePath = data.tempFilePath;
                wx.hideLoading();
                wx.showToast({
                  title: '合成成功',
                  icon: 'success',
                  duration: 1000
                });
                //保存全身文件至本地
                wx.saveImageToPhotosAlbum({
                  filePath: tempFilePath,
                  success: () => {

                  },
                  fail: function (e) {
                    _this.failTips('自动保存至本地失败');
                    console.log(e);
                  },
                  complete : function(){
                    //保存数据
                    wx.setStorage({
                      key: 'hasJump',
                      data: true
                    })
                    wx.navigateTo({
                      url: '../result/result?src=' + tempFilePath + '&iconSrc=' + tempIconFilePath + '&picWidth=' + width + '&picHeight=' + height,
                      success: () => {
                        setTimeout(()=>{
                          innerAudioContext.pause();
                          _this.setData({
                            canvasHide: true
                          })
                        },800)
                      }
                    })
                  }
                });
              },
              fail : function(e){
                _this.failTips('图片保存失败');
                console.log(e);
              }
            })
          },
          fail: function (res) {
            _this.failTips('图片加载失败');
            console.log(res);
          }
        })
      });
    },500)
    }).catch((e)=>{
      _this.failTips('图片下载失败');
      console.log(e);
    })
  },
  //失败提示
  failTips(msg){
    wx.hideLoading();
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 1000
    });
  },
  //加载图片
  getImgOnload(el){
    let _this = this;
    return new Promise(function (resolve, reject) {
      wx.getImageInfo({
        src: el.src,
        success: function (res) {
          let thisSrc = el.src;
          if (thisSrc.indexOf('/images/exam/') > -1){
            res.path = '../../' + thisSrc.substring(6,thisSrc.length);
          }
          resolve({
            el: el,
            res: res
          });
        },
        fail: function (e) {
          _this.failTips('加载图片失败');
          console.log(e);
          reject(e);
        }
      })
    })
  },
  // 滚动切换标签样式
  switchTab: function (e) {
    let cur = e.detail.current;
    //去除大类标签new tag
    // let tagTemData = this.data.itemList;
    // tagTemData[0].isNew = 0;
    // tagTemData[cur].isNew = 0;
    this.setData({
      currentTab: cur,
      scrollHeight : 300,
      // itemList : tagTemData
    });
  },
  // 点击标题切换当前页时改变样式
  swichNav: function (e) {
    var cur = e.target.dataset.current;
    if (this.data.currentTab == cur) { return false; }
    else {
      // let tagTemData = this.data.itemList;
      // tagTemData[0].isNew = 0;
      // tagTemData[cur].isNew = 0;
      this.setData({
        currentTab: cur,
        // itemList : tagTemData
      })
    }
  },
  //底部上下移动
  tagUpDown: function (e) {
    if (this.data.scrollHeight) {
      this.setData({
        scrollHeight: 0
      });
    } else {
      this.setData({
        scrollHeight: 300
      });
    };
  },
  compare: function (property) {
    return function (obj1, obj2) {
      var value1 = obj1[property];
      var value2 = obj2[property];
      return value1 - value2;     // 升序
    }
  },
  onShareAppMessage : function(){
    return {
      title: '治愈系小仙女换装',
      path: 'pages/index/index',
      imageUrl: '../../images/share_bg.png'
    }
  },
  //授权控件
  authorizeClose : function(e){
    let hasLogin = e.detail.hasLogin;
    if(hasLogin == undefined || hasLogin == true){
      if(hasLogin){
        app.globalData.hasLogin = true;
        this.setData({
          isInitial : false
        })
        this.onShow();
      }
      this.setData({
        authorizeShow : false
      })
    }else if(hasLogin == false){
      app.globalData.hasLogin = false;
    }
    let hasPhotoAuthorize = e.detail.hasPhotoAuthorize;
    if(hasPhotoAuthorize){
      this.setData({
        authorizeShow : false
      })
      app.globalData.photoAuthorize = true;
    }else {
      app.globalData.photoAuthorize = false;
    }
  },
  //限时特惠
  async discountClose(e){
    this.setData({
      discountShow : false
    })
  },
  discountClick : function(){
    app.eventApi('show', '编辑页限时卡片');
    this.setData({
      discountShow : true,
      discountDetail : app.globalData.discountTemData
    })
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
        app.globalData.addNewTag = true;
        await this.jsonCaculate();
        this.setData({
          discountShow : false,
          hasDiscount : false
        })
        return;
      }
    }
    if(!app.globalData.hasLogin){
      this.setData({
        authorizeShow : true,
        isLoginTemplate : true
      })
    }else {
      payCount++;
      if(payCount == 1){
        let discountItem = JSON.parse(this.data.discountDetail);
        let itemId = discountItem.productId,
            itemJson = discountItem.dressupJson;
        try{
          await app.authorizeJudge();
          app.eventApi('order', '编辑页限时卡片', itemId);
          await app.buyItem(itemId);
          //获取贴纸接口
          await app.getAllStickers();
          app.globalData.itemJson = JSON.stringify(itemJson);
          app.globalData.addNewTag = true;
          await this.jsonCaculate();
          this.setData({
            hasBuy : true,
            discountShow : false,
          })
          payCount = 0;
          //支付完成后刷新限时接口
          let discountData = await app.getDiscountData('dressupEdit', this);
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
        }catch(e){
          console.log("reject: ", e);
          if(e !== 'requestPayment:fail cancel'){
            commonJs.msgTips(e);
            this.onShow();
          }else {
            payCount = 0;
          }
        }
        this.setData({
          discountShow : false,
        })
      }
    }
  },
  //json计算
  async jsonCaculate(){
    //强制初始化数据，防止小程序记录保存缓存
    temArry = [
      {
        name: "后头发",
        categoryId: "7",
        type: "2",
        layerIndex: "1",
        src: "../../images/exam/1/houtoufa1_0_1.png",
      }, {
        name: "身体",
        categoryId: "1",
        type: "5",
        layerIndex: "3",
        src: "../../images/exam/3/body_3_3.png",
      },
      {
        name: "五官",
        categoryId: "2",
        type: "6",
        layerIndex: "13",
        src: "../../images/exam/13/wuguan1_3_13.png"
      },
      {
        name: "刘海",
        categoryId: "3",
        type: "7",
        layerIndex: "15",
        src: "../../images/exam/15/liuhai1_3_15.png",
      },
      {
        name: "背景",
        categoryId: "4",
        type: 1,
        layerIndex: 0,
        src: "../../images/exam/0/beijing11_5_0.png",
      }
    ];
    // for(let el of temArry){
    //   for(let dom of app.globalData.dataList){
    //     if(el.name == dom.name){
    //       el.src = dom.dressupList[0].image;
    //     }
    //   }
    // }
    sessionTemArry = [];
    sessionData = [];
    sessionBg = "../../images/exam/0/beijing11_5_0.png";
    dataResult = JSON.parse(JSON.stringify(app.globalData.dataList));
    let result = dataResult,
      empArry = [],
      bgData = sessionBg;
    //保存初始化数据
    sessionTemArry = JSON.parse(JSON.stringify(temArry));
    sessionData = JSON.parse(JSON.stringify(app.globalData.dataList));
    //若有初始数据项，按已有数据加载
    let json = app.globalData.itemJson;
    let orignalArry = [];
    if (!!json) {
      let thisJson = JSON.parse(json);
      console.log('thisJson', thisJson);
      let temData = {},
          sameCate = false,
          jsonSameCate = "";
      for (let el of thisJson){
        for (let dom of dataResult){
          //先匹配大类
          if (el.categoryId == dom.categoryId){
            //标记新标签
            // if(app.globalData.addNewTag){
            //   dom.isNew = 1;
            //   dom.isCheck = 0;
            // }
            //再获取单个物品的私有信息
            temData = {};
            for (let item of dom.dressupList){
              if (el.dressupId == item.dressupId){
                temData = {
                  name: dom.name,
                  categoryId: dom.categoryId,
                  layerIndex: item.layerIndex,
                  type: item.type,
                  src: item.image,
                  dressupId : item.dressupId
                }
                // if(jsonSameCate !== item.type){
                //   jsonSameCate = item.type;
                //   console.log(jsonSameCate, el.dressupId);
                //   item.isSelected = 1;
                // }
                // if(app.globalData.addNewTag){
                //   item.isNew = 1;
                //   item.isCheck = 0;
                // }
                break;
              }
            }
            sameCate = false;
            //遍历默认数据数组
            for(let ori of orignalArry){
              if (ori.categoryId == el.categoryId){
                //同大类区分type进行替换
                if (temData.type == ori.type){
                  ori.layerIndex = temData.layerIndex;
                  ori.src = temData.src;
                  ori.dressupId = temData.dressupId;
                  sameCate = true;
                //非同大类增加
                }else {
                  sameCate = false;
                }
              }
            }
            if (!sameCate){
              orignalArry.push(temData);
            }
            //赋值背景
            if (el.categoryId == '4') {
              bgData = temData.src;
            }
          }
        }
      };
      //遍历初始数据，若传输数据没有默认数据则增加
      let isOriginal = true;
      for(let el of temArry){
        isOriginal = true;
        for(let dom of orignalArry){
          //单独剔除后头发
          if(el.name == dom.name || el.name == '后头发'){
            isOriginal = false;
          }
        }
        if(isOriginal){
          orignalArry.push(el);
        }
      };
      //设置选中
      for(let el of orignalArry){
        if(el.dressupId){
          for(let dom of dataResult){
            for (let item of dom.dressupList){
              if (el.dressupId == item.dressupId){
                item.isSelected = 1;
              }
            }
          }
        }
      }
      //对选择层级进行排序
      orignalArry = orignalArry.sort(this.compare('layerIndex'));
      temArry = orignalArry;
    }
    // else {
    //   temArry = sessionTemArry;
    // }
    //套装无背景图时监听数据仍然需要背景图
    let hasBg = false,
        thisHair = "";
    for(let el of temArry){
      if(el.name == '背景'){
        hasBg = true;
      }else if(el.name == '刘海'){
        thisHair = el.src;
      }
    }
    if(!hasBg){
      temArry.push({
        name: "背景",
        categoryId: "4",
        type: 1,
        layerIndex: 0,
        src: "../../images/exam/0/beijing11_5_0.png",
      })
    }
    //单独预加载刘海
    let hair = await commonJs.getImgOnload(thisHair);
    console.log('temArry', JSON.parse(JSON.stringify(temArry)));
    this.setData({
      itemList: dataResult,
      itemSelected: temArry,
      bgSelected: bgData,
      loadingShow : false
    });
  },
  //增加新增样式
  addNewTag(){

  }
})
