
class Action {
  //调用接口
  async getApi( des = '', src, method = 'GET', data, header){
    return new Promise((resolve,reject)=>{
      wx.request({
        url: src,
        method : method,
        data: data,
        header : header,
        success : (res)=>{
          if(res.data.code == 1){
            resolve(res.data.data);
          }else {
            reject(res.data.msg);
          }
        },
        fail : (res)=>{
          reject(`${des}接口请求失败`);
        }
      })
    })
  }
  //加载图片
  async getImgOnload(src){
    return new Promise((resolve, reject)=> {
      wx.getImageInfo({
        src: src,
        success: (res)=>{
          resolve({
            localPath: src,
            temPath: res.path
          });
        },
        fail: (e)=>{
          reject(src + '图片加载失败');
        }
      })
    })
  }
  //查看是否授权
  async getUserInfo(){
    return new Promise((resolve,reject)=>{
      wx.getSetting({
        success: (res)=>{
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              withCredentials : true,
              success: (res)=>{
                resolve(res);
              }
            })
          }else {
            resolve('请先进行登录授权');
          }
        }
      })
    })
  }
  //获取登录凭证
  async userLogin(){
    return new Promise((resolve, reject) =>{
      wx.login({
        success: res => {
          resolve(res.code);
        },
        fail : res=>{
          reject('获取登录凭证失败');
        }
      })
    })
  }
  //获取相册使用权限
  async getPhotoAuthorize(){
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success(res) {
          console.log(res.authSetting);
          if (!res.authSetting['scope.writePhotosAlbum']) {
            wx.authorize({
              scope: 'scope.writePhotosAlbum',
              success : res=> {
                resolve();
              },
              fail : e => {
                reject('用户拒绝相册授权');
              }
            })
          }else {
            resolve();
          }
        }
      })
    })
  }
  //提示
  msgTips(msg) {
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 1000
    });
  }
}

module.exports = new Action();