// component/authorize/authorize.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    authorizeShow : {
      type : Boolean,
      value : false,
      observer: function(newVal, oldVal){
        if(this.properties.authorizeShow){
          this.setData({
            popShow : true
          })
        }else {
          this.setData({
            popShow : false
          })
        }
      }
    },
    isLogin : {
      type : Boolean,
      value : true,
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    popShow : false,
    isLogin : true
  },
  ready : function(){
    this.setData({
      isLogin : this.properties.isLogin
    })
  },
  /**
   * 组件的方法列表
   */
  methods: {
    closePop : function(e){
      // 触发事件的选项 bubbles是否冒泡，composed是否可穿越组件边界，capturePhase 是否有捕获阶段
      this.triggerEvent('authorizeclose', {}, {
        composed: true
      })
    },
    bindGetUserInfo : function(e){
      let detail = {
        hasLogin : false
      }
      if(e.detail.userInfo){
        detail.hasLogin = true;
      }
      this.triggerEvent('authorizeclose', detail, {
        composed: true
      })
    },
    bindopensetting : function(e){
      if(e.detail.authSetting["scope.writePhotosAlbum"]){
        this.triggerEvent('authorizeclose', { hasPhotoAuthorize : true}, {
          composed: true
        })
      }else {
        this.triggerEvent('authorizeclose', { hasPhotoAuthorize : false}, {
          composed: true
        })
      }
      if(!e.detail.authSetting["scope.userInfo"]){
        this.triggerEvent('authorizeclose', { hasLogin : false}, {
          composed: true
        })
      }
    }
  }
})
