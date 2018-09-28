//index.js
Page({
  data: {
    imgSrc: "",
    longPic : "",
    isIcon : false,
    picWidth : 375,
    picHeight : 603,
    realWidth : 0,
    realHeight : 0,
    isToTop : false,
    canvasHide: false,
    pixelRatio : 2,
    localImgs : [
      "../../images/result/pic_frame.png",
      "../../images/result/logo.png",
      "../../images/result/code.jpg"
    ]
  },
  onLoad: function (options) {
    this.setData({
      imgSrc: options.src,
      longPic : options.src,
      iconSrc: options.iconSrc,
      picWidth : options.picWidth,
      picHeight: options.picHeight
    });
    //预加载本地合成所需图
    this.getPreloadDone();
    // this.saveAsPoster();
    wx.getSystemInfo({
      //获取系统信息成功，将系统窗口的宽高赋给页面的宽高
      success: (res)=> {
        // console.log(res.pixelRatio);
        this.setData({
          pixelRatio: res.pixelRatio
        })
        // 这里的单位是PX，实际的手机屏幕有一个Dpr，这里选择iphone，默认Dpr是2
      }
    });
  },
  saveAsPoster(){
    this.setData({
      canvasHide: false
    })
    wx.showLoading({
      title: '海报生成中...',
    });
    let ctx = wx.createCanvasContext('poster'),
        _this = this;
    let width = this.data.picWidth,
        height = this.data.picHeight;
    let canvasCover = wx.createCanvasContext('cover');
    let frameWidth = 0.59 * width,
        frameHeight = 1.42 * frameWidth,
        logoWidth = 0.43 * width,
        logoHeight = 0.36 * logoWidth,
        codeWidth = 0.18 * width,
        sx = (width - frameWidth)/2,
        sy = (height - frameHeight) / 2;
    console.log(width,height,frameWidth, frameHeight);
    //确保本地图片加载完毕后开始绘图
    _this.getPreloadDone().then(() => {
      canvasCover.fillStyle = "#000";
      canvasCover.fillRect(0, 0, width, height);
      canvasCover.draw();
      //绘图
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0,width,height);
      _this.loadImgs(_this.data.longPic).then(()=>{
        ctx.drawImage(_this.data.longPic, sx / 1.56 * _this.data.pixelRatio, sy / 1.35 * _this.data.pixelRatio, frameWidth * _this.data.pixelRatio * 1.25, frameHeight * _this.data.pixelRatio * 1.25, sx, 0.2 * sy, frameWidth, frameHeight);
        ctx.drawImage(_this.data.localImgs[0], sx, 0.2 * sy, frameWidth, frameHeight);
        ctx.drawImage(_this.data.localImgs[1], sx * 1.4, 0.23 * sy + frameHeight + 10, logoWidth, logoHeight);
        ctx.drawImage(_this.data.localImgs[2], sx * 3.8, 0.23 * sy + frameHeight + 50, codeWidth, codeWidth);
        let drawDone = new Promise((resolve, reject) => {
          ctx.draw(false, () => {
            wx.hideLoading();
            resolve(generateTempfile());
          })
        });
        //生成临时文件
        let generateTempfile = () => {
          return new Promise((resolve, reject) => {
            wx.canvasToTempFilePath({
              canvasId: 'poster',
              success: (res) => {
                resolve(res);
              },
              fail: (e) => {
                _this.failTips('生成失败');
                reject(e);
              }
            })
          });
        }
        drawDone.then((res) => {
          //下载
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.previewImage({
                urls: [res.tempFilePath],
                success: () => {
                  setTimeout(() => {
                    _this.setData({
                      canvasHide: true
                    })
                  }, 800)
                }
              })
            },
            fail: () => {
              _this.failTips('保存到本地失败');
              reject();
            }
          })
        }).catch((e)=>{
          _this.failTips('海报生成失败');
        })
      })

    });
  },
  //失败提示
  failTips(msg) {
    wx.hideLoading();
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 1000
    });
  },
  //预加载图片
  getPreloadDone(){
    let _this = this;
    return new Promise((resolve, reject)=>{
      let getLocalImgs = Promise.all(this.data.localImgs.map((el) => {
        return this.loadImgs(el);
      }));
      getLocalImgs.then(() => {
        console.log('加载完毕')
        resolve();
      }).catch(() => {
        console.log('加载错误')
        _this.failTips('图片加载失败');
        reject();
      })
    })
  },
  //加载图片
  loadImgs(src){
    return new Promise((resolve, reject)=>{
      wx.getImageInfo({
        src: src,
        success: (res) => {
          resolve(res);
        },
        fail:()=>{
          reject()
        }
      });
    })
  },
  saveAsIcon : function(){
    wx.showLoading({
      title: '保存中...',
    });
    //保存全身文件至本地
    wx.saveImageToPhotosAlbum({
      filePath: this.data.iconSrc,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        });
        this.setData({
          isIcon : true,
          imgSrc: this.data.iconSrc
        });
      }
    })
  },
  onReady: function () {
  },
  previewImage: function (e) {
    wx.previewImage({
      urls: [this.data.imgSrc]
    })
  },
  onShareAppMessage: function () {
    return {
      title: '治愈系小仙女换装',
      path: 'pages/index/index',
      imageUrl: '../../images/share_bg.png'
    }
  }
})
