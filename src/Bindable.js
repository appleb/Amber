/**
 Copyright (c) 2014, QiSiYu Computer Technology co. Ltd. BeiJing.
 All rights reserved.


 Redistribution and use of this software in source and binary forms, with or
 without modification, are permitted provided that the following conditions
 are met:


 Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.


 Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.


 Neither the name of QiSiYu Computer Technology Company Beijing nor the names of its contributors may be used
 to endorse or promote products derived from this software without specific
 prior written permission of QiSiYu Computer Technology Company BeiJing.


 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * 可以绑定的数据
 * User: yhq
 * Date: 14-6-24
 * Time: 下午1:53
 */

/**
 * @constructor
 */

function Bindable(value, attrName, obj, parent) {
    this._attrName = attrName;      //原始数据的变量名或对象的属性名
    this._value = value;            //原始数据的值
    this._type = "object";
    this._obj = obj == null ? window : obj;    //拥有当前属性的对象，空表示当前数据是一个全局变量
    this._models = new Array();     //绑定到当前数据的模型元素
    this._rows;   //数组数据的元素的bindable数组
    this._bindingInfos = new Array();       //当前数据的绑定信息
    this._rowElems = new Array();                  //当前对象是行数据时，保存行元素
    this.parent = parent;     //当前可绑定数据的上层可绑定数据

    if(this._obj == null) {
        this._type = "global";
    } else if(typeof(value) == "function") {
        this._type = "function";
    } else if($.isArray(value)) {
        this._type = "array";
        this._rows = new Array(value.length);
        for(var i = 0; i < value.length; i++) {
             this._rows[i] = new Bindable(value[i], "", value, this);   //数据是一个数组元素时，属性名为空字符串
        }
        for(p in value) {
            if(!$.isNumeric(p)) {
                this[p] = new Bindable(value[p], p, value, this);
            }
        }
    } else if(typeof(value) == "object") {
        this._type = "object";
        for(p in value) {
            this[p] = new Bindable(value[p], p, value, this);
        }
    } else {
        this._type = "native";
    }
}

Bindable.prototype.isReadOnly = function() {
    return this._type == "function";
};

Bindable.prototype.isFunction = function() {
    return this._type == "function";
};

Bindable.prototype.isArray = function() {
    return this._type == "array";
};

Bindable.prototype.isObject = function() {
    return this._type == "object";
};

Bindable.prototype.isNative = function() {
    return this._type == "native";
};

Bindable.prototype.isGlobal = function() {
    return this._type == "global";
};

Bindable.prototype.len = function() {
    if(this.isArray()) {
        return this._value.length;
    }
    return 0;
};

Bindable.prototype.addModel = function(elem) {   //elem - html element
    this._models.push(elem);
};

Bindable.prototype.removeModel = function(elem) {
    this._models.remove(elem);
};

Bindable.prototype.addBindingInfo = function(bindingInfo) {
    this._bindingInfos.push(bindingInfo);
};

Bindable.prototype.removeBindingInfo = function(bindingInfo) {
    this._bindingInfos.remove(bindingInfo);
    bindingInfo.clear();
}

/**
 *删除当前可绑定数据所包含的指定的可绑定数据及其绑定信息
 * @param bindable -如果为空删除自身绑定信息
 */
Bindable.prototype.remove = function(bindable) {
    if(bindable == null) {
        for(var i = this._bindingInfos.length - 1; i >=0; i--) {
            this.removeBindingInfo(this._bindingInfos[i]);
        }
        for(i = this._rowElems.length -1; i >= 0; i--) {
            $(this._rowElems[i]).remove();
            this._rowElems.remove(i);
//            $(this._rowElems[i]).animate({height:"0"}, 3000, function () {
//                $(this).remove();
//            });
        }
        if(this.parent.isArray()) {
            for(var i = 0; i < this.parent._rows.length; i++){
                if(this.parent._rows[i] == this) {
                    this.parent._rows.remove(this);   //删除当前可绑定数组指定位置的可绑定数据
                    this.parent._obj[this.parent._attrName].remove(i);      //删除当前可绑定数组对应实际数组对象指定位置的数据
                    break;
                }
            }
        }
    } else {
        if(this.isArray()) {
            for(var i = 0; i < this._rows.length; i++){
                if(this._rows[i] == bindable) {
                    var v = this._rows[i];
                    this._rows.remove(i);   //删除当前可绑定数组指定位置的可绑定数据
                    this._obj[this._attrName].remove(i);      //删除当前可绑定数组对应实际数组对象指定位置的数据
                    v.remove();
                    break;
                }
            }
        }
    }
};

/**
 *给可绑定数组增加元素
 * @param attrName
 * @param value
 */
Bindable.prototype.add = function(value) {
    if(this.isArray()) {
        this._obj[this._attrName].push(value);
        var lastRow = this._rows[this._rows.length - 1];  //最后一行可绑定数据
        var bindable = new Bindable(value, "", this._obj, this);
        this._rows.push(bindable);
        var lastRowElem, newRowElem, model;
        var rowElems = lastRow == null? this._models : lastRow._rowElems;

        for (var i = 0; i < rowElems.length; i++) {
            lastRowElem = rowElems[i];
            model = lastRow == null? lastRowElem : $(lastRowElem).data("modelElem");
            newRowElem = $(model).clone(true).get(0);//从模版复制一个新行
            $(newRowElem).show("slow");
            bindable.addRowElem(newRowElem);
            newRowElem.removeAttribute("model");
            $(newRowElem).removeData();
            $(newRowElem).data("modelElem", model);   //保存行元素的模版
            Amber.bindElem(newRowElem, bindable);
            $(lastRowElem).after(newRowElem);
        }

        Amber.apply(bindable, undefined);
    }
};

Bindable.prototype.addRowElem = function(elem) {
    this._rowElems.push(elem);
};

Bindable.prototype.getArrayBindable = function(index) {
    if(this.isArray() && $.isNumeric(index) && parseInt(index) < this._rows.length) {
        return this._rows[parseInt(index)];
    }

    return null;
};
/**
 *获得可绑定数据的指定属性的值
 * @param attrName -属性名称
 * @returns {*}
 */
Bindable.prototype.get = function(attrName) {
    if(attrName == undefined) {
        attrName = this._attrName;
    }

    if(this.isArray()) {
        if($.isNumeric(attrName)) {
            var index  = parseInt(attrName);
            if(index >= 0 && index <= this.len()) {
                return this._rows[index];
            }
        } else {
            return this._obj[attrName];
        }
    }else if(this.isObject()){
        if(this[attrName] instanceof Bindable) {
            return this[attrName]._obj[attrName];
        } else {
            return attrName == "" ? this._value:getAttr(this._obj, attrName);//todo:尽量不使用_value属性，准备删除该属性
        }
    }else if(this.isNative()) {
        return this._obj[attrName];
    }else if(this.isFunction()) {
         return this[attrName] == undefined ?  //Bindable的函数优先于数据的函数
            this._obj[attrName] :       //数据的函数
            this[attrName];           //取Bindable的函数
    }
    return null;
};

/**
 * 给当前可绑定数据或其属性赋值
 * @param attrName -属性名称，空表示给当前可绑定数据赋值
 * @param value -JavaScript值
 * @param elem -不对该元素应用数据修改。
 * @returns {*}当前可绑定数据
*/
Bindable.prototype.put = function(attrName, value, elem) {
    //if(!this.isReadOnly()) {
        if(arguments.length == 1) {
            value = arguments[0];
            attrName = this._attrName;
        }

        if(attrName == undefined) {
            attrName = this._attrName;
        }

        var attrBindable;
        if(attrName == this._attrName && !this.isNative() && !this.isFunction()) {
            attrBindable = this;
        }else {
            attrBindable = this._getBindable(attrName);   //[attrName];
        }

        if(attrBindable instanceof Bindable) {
            if(attrBindable.isNative() || attrBindable.isFunction()) {
                attrBindable.put(attrName, value);
            }else if(attrBindable.isArray()) {
                if(value instanceof Array) {
                    //更新原有的元素，追加新元素，删除多余的元素
                    var oldLen = attrBindable.len(), newLen = value.length,
                        len = Math.min(oldLen,newLen), i;
                    for(i = oldLen - 1; i >= 0; i--) {
                        var v = attrBindable.getArrayBindable(i);
                        attrBindable.remove.call(v);

                    }
                    for(i = 0; i < newLen; i++) {
                        attrBindable.add(value[i]);
                    }
                }
            }else if(attrBindable.isObject()) {
                //对应更新原有属性值
                for(var objAttrName in attrBindable) {
                    if(!this.isNativeAttr(objAttrName) && !(value[objAttrName] instanceof Function)
                        && !(this[objAttrName] instanceof Function)){
                        attrBindable.put(objAttrName, value[objAttrName]);
                    }
                }
            }
       }else {
            this._obj[attrName] = value;
            Amber.apply(this, elem);
        }

    //}
    return this;
};

/**
 *应用当前数据的绑定
 * @param elem -不应用帮顶的元素
 */
Bindable.prototype.apply = function(elem) {
    Amber.apply(this, elem);
};
/**
 *获得数据相关的所有元素 。
 * @returns {*}
 */
Bindable.prototype.elements = function() {
    if(this.isArray()) {
        var elems = new Array();
        for(var i = 0; i < this._rows; i++) {
            elems.push(this._rows[i].elements());
        }
        return elems;
    } else {
        if(this._rowElems != null && this._rowElems.length > 0) {
            return this._rowElems;
        } else {
            var elems = new Array();
            for(var i = 0; i < this._bindingInfos; i++) {
                elems.push(this._bindingInfos[i].elem);
            }
            return elems;
        }
    }
};

Bindable._nativeAttr = ",_attrName,_value,_type,_obj,_models,_rows,_bindingInfos," +
    "parent,_rowElems,_selectedProduct,";

Bindable.prototype.isNativeAttr = function(attrName) {
    return (Bindable._nativeAttr).indexOf("," + attrName + ",") >= 0;
};

Bindable.prototype.call = function() {
    if(this.isFunction()) {
        var func = this.get();
        func.apply(this.parent, arguments);
    }
};

Bindable.prototype._getBindable = function(name) {
    if(name instanceof Array) {
        var attrs = name;
        var obj = this;
        for(var i = 0; i < attrs.length; i++) {
            var attrName = attrs[i];
            var v = obj[attrName];
            if(v == null) {
                if(obj instanceof Bindable && obj.isArray()) {
                    v = obj.getArrayBindable(attrName);
                } else {
                    return null;
                }
            }
            obj = v;
        }
        return obj;
    } else {
        var attrs = name.split(".");
        return this._getBindable(attrs);
    }
};


//下面的代码是为了使google clouser compiler保留这些名字
window['Bindable'] = Bindable;
//Bindable.prototype['get'] = Bindable.prototype.get;
//Bindable.prototype['put'] = Bindable.prototype.put;
//Bindable.prototype['remove'] = Bindable.prototype.remove;
//elements函数本应该像get，put等函数一样存在于prototype中，
// 但不知为什么没有，只能进行如下处理以保存其名字
Bindable.prototype['elements'] = Bindable.prototype.elements;