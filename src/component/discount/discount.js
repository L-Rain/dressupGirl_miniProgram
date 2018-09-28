// component/discount/discount.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    discountShow : {
      type : Boolean,
      value : false,
      observer: function(newVal, oldVal){
        if(this.properties.discountShow){
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
    discountDetail : {
      type : String,
      value : "",
      observer: function(newVal, oldVal){
        if(newVal !== ""){
          let val = JSON.parse(newVal);
          this.setData({
            discountList : val
          })
        }
      }
    },
    hasBuy : {
      type : Boolean,
      value : false,
      observer: function(newVal, oldVal){
        if(newVal){
          this.setData({
            alreadyBuy : true
          })
        }else {
          this.setData({
            alreadyBuy : false
          })
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    popShow : false,
    discountList : {},
    alreadyBuy : false
  },
  ready : function(){
  },
  /**
   * 组件的方法列表
   */
  methods: {
    closePop : function(e){
      this.triggerEvent('loginclose', {}, {
        composed: true
      })
    },
    buyItem : function(e){
      this.triggerEvent('buydiscount', {}, {
        composed: true
      })
    }
  }
})
