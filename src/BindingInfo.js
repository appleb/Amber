/**
 * 绑定信息
 * User: yhq
 * Date: 14-6-16
 * Time: 下午3:18
 */

function BindingInfo(elem, attrName, dataName) {
    this.elem = Bind.option(elem);            //html元素
    this.attrName = Bind.option(attrName);       //绑定的html元素的属性名
    this.dataName = Bind.option(dataName);               //bindable数据名
}

/**
 *删除绑定的元素
 */
BindingInfo.prototype.clear = function () {
    this.attrName = null;
    this.dataName = null;
    $(this.elem).remove();
//    $(this.elem).animate({height:"0px"},2000, function() {
//        $(this).remove();
//    });
};

