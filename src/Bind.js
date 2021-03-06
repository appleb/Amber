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
 * Amber
 */

function Amber(objName) {
    return Amber.getBindable(objName);
};

Amber.get = function (objName) {
    try {
        return Amber(objName).get();
    } catch (e) {
        return null;
    }
};

Amber.bindables = new Array();

Amber.option = function (obj) {
    return obj == undefined ? null : obj;
};

/**
 *构造数据的可绑定对象
 * @param attrName -数据名称
 */
Amber.buildBindable = function (attrName) {
    var attrValue;
    if (attrName instanceof Array) {
        for (var i = 0; i < attrName.length; i++) {
            Amber.buildBindable(attrName[i]);
        }
    } else {
        try {
            attrValue = eval(attrName);
            var bindable = Amber.getBindable(attrName);
            if(bindable == null || bindable == Amber ) {   //不重复创建绑定对象
                Amber[attrName] = new Bindable(attrValue, attrName, null);
            }
        } catch (e) {
            console.log("Failed to build bindable for " + attrName + ":" + e.message);
        }
    }

};

Amber.getBindable = function (objName) {
    var names = objName.split(".");
    var owner = Amber;

    for (var i = 0; i < names.length; i++) {
        var v = owner[names[i]];
        if (v instanceof Bindable) {
            owner = v;
        } else {
            if (owner instanceof Bindable) {
                if (owner.isArray()) {
                    owner = owner.getArrayBindable(names[i]);
                } else {
                    return null;
                }
            } else {
                break;
            }
        }
    }

    /**
     *处理未绑定顶层变量的情况,即：绑定a.b ，需要查找a.b或a.b.c,或a.b.c.d
     */
    if (owner == Amber) {
        if (owner[objName] instanceof Bindable) {
            return owner[objName];
        }

        for (var i = names.length - 1; i > 0; i--) {
            var name = "";
            for (var k = 0; k < i; k++) {
                name += names[k] + (k == (i - 1) ? "" : ".");
            }

            if (owner[name] instanceof Bindable) {
            var r, o = owner[name];
            for (var j = i; j < names.length; j++) {
                r = o[names[j]];
                if (r instanceof Bindable) {
                    o = r;
                } else {
                    return null;
                }
            }
            return o;
        }
    }
}
return owner;
};

/**
 *根据元素的属性，生成相应绑定信息
 * @param elem - html元素
 * @paam attrName -元素的属性名称
 * @param modelElem -元素所属的模型元素
 * @returns {绑定信息}
 */
Amber.parseInfo = function (elem, attrName, varname) {
    var str = elem.getAttribute(attrName);
    if (str != null && str.startWith("@{") && str.endWith("}")) {
        var dataName = str.substr(2, str.length - 3);
        if (varname != null) {
            dataName = dataName.replace("[__var__]", varname);
        }
        var info = new BindingInfo(elem, attrName, dataName);
        return info;
    }
    return null;//不正确的格式
};

/**
 * 绑定指定html元素
 * @param elem - html元素
 * @param rowBindable - elem所属的行绑定数据
 * @param varname -用于替换[__var__]的变量名，
 */
Amber.bindElem = function (elem, rowBindable, varname) {
    if (elem.hasAttribute("model")) {    //这是一个模型元素
        Amber.bindModel(elem, rowBindable);
    } else {             //非模型元素，绑定元素
        var attrNames;

        //过滤掉包含在模型元素内部的绑定元素。
        // 主要是为了避免把作为模版使用的模型元素的内部的绑定元素进行绑定，
        // 如果这样将会使新增的模型元素不能被绑定，因为其内部的绑定元素的bind属性已经被删除了。
        if (!elem.hasAttribute("bind") || $(elem).parents("[model]").length != 0) {
            return;
        } else if (elem.getAttribute("bind") == null || elem.getAttribute("bind") == "") {
            //处理元素的绑定属性
            var attrs = new Array();
            for (var i = 0; i < elem.attributes.length; i++) {
                var name = elem.attributes[i].name;
                var str = elem.getAttribute(name);
                if (str.startWith("@{") && str.endWith("}")) {
                    attrs.push(name);
                }
            }
            elem.setAttribute("bind", attrs.toString());
            attrNames = attrs;   //元素所有被绑定的属性名
        } else {
            attrNames = elem.getAttribute("bind").split(","); //元素所有被绑定的属性名
        }

        var len = attrNames.length;
        for (var i = 0; i < len; i++) {

            try {
                var attrName = attrNames[i];
                var info = Amber.parseInfo(elem, attrName, varname);

                if (info != null) {
                    var bindable, bindables = new Array();

                    if(info.refModel && rowBindable == null) {
                        console.log("元素不在模型元素中，不能引用行数据。" + info.bindStr);
                        continue;
                    }

                    if(rowBindable != null && !info.refModel) {
                        //元素处在行元素中，将绑定信息增加到行数据中
                        //这样当应用行绑定数据时，也会更新这个元素的绑定数据，尽管该元素没有绑定在行数据上
                        //否则，当新增行时，这个元素不会被应用绑定。
                        rowBindable.addBindingInfo(info);
                    }

                    bindable = Amber._procBindDataName(info.dataName, rowBindable);
                    if(bindable != null) {
                        bindables.push(bindable);
                    } else {
                        console.log("指定的绑定数据不正确：" + info.bindStr);
                    }

                    var params = info.params;
                    for(var j = 0; params != null && j < params.length; j++) {
                        var param = params[j];
                        bindable = Amber._procBindDataName(param, rowBindable);
                        if(bindable != null) {
                            bindables.push(bindable);
                        } else {
                            console.log("指定的绑定数据不正确：" + info.bindStr);
                        }
                    }

                    for(var j = 0; j < bindables.length; j++) {
                        bindable = bindables[j];
                        bindable.addBindingInfo(info);    //把绑定信息添加到可绑定数据中
                        if ($(info.elem).is("input") && info.elem.type == "checkbox" && info.attrName == "bind-checked") {
                            Amber._setupCheckboxHandler(info.elem, bindable);
                        } else if ($(info.elem).is("input") && info.elem.type == "radio" && info.attrName == "selected") {
                            Amber._setupRadioHandler(info.elem, bindable);
                        } else if (($(info.elem).is("textarea") ||
                            ($(info.elem).is("input") &&
                                (info.elem.type == "text" || info.elem.type == "password" || info.elem.type == "email")
                                )
                            ) && info.attrName == "value") {
                            Amber._setupTextHandler(info.elem, bindable);
                        } else if ($(info.elem).is("select") && info.attrName == "selected") {
                            Amber._setupSelectHandler(info.elem, bindable);
                        }
                    }
                }
            } catch (e) {
                console.log("应用绑定时出错，绑定信息：" +
                    (info != null ? (info.bindStr + "。") : "错误。") + e.description);
            }
        }

        elem.removeAttribute("bind");//避免重复进行绑定

        $(elem).find("[bind]").each(function () {   //绑定子元素
            Amber.bindElem(this, rowBindable, varname);
        });
    }
};

Amber._procBindDataName = function(dataName, rowBindable) {
    if(dataName.startWith("model")) {//绑定信息是行数据或方法
        if(dataName == "model") {
            return rowBindable;
        }
        var elemBindable = rowBindable._getBindable(dataName.substring(6));
        if (elemBindable instanceof Bindable) {   //&& !elemBindable.isFunction()) {
            //对模型元素内部的绑定元素设置绑定信息，
            // 否则更新数据时不能自动更新模型元素内部的绑定元素

            //注释下面的if语句，是要把绑定信息放到函数的绑定数据中
            //这样可以在put是更新绑定函数的元素
            //if (!elemBindable.isFunction()) {
            return elemBindable;
            //}
        } else {
            return null;
        }
    }else {  //没有绑定在行数据上
        return Amber.getBindable(dataName);
    }
};

/**
 *绑定一个模型元素及其所有的子元素
 * @param modelElem -要绑定的模型元素
 * @param rowBindable - 当前行绑定数据
 * @param varname -用于替换[__var__]的变量名
 */
Amber.bindModel = function (modelElem, rowBindable, varname) {
    if (modelElem.hasAttribute("processed")) {
        return;
    }
    var objName = modelElem.getAttribute("model");
    var bindable;
    if (objName.startWith("model.")) {//modelElem是一个子表
        if (rowBindable != null) {
            //绑定数据为行数据中由objName指定的属性值，应该是一个数组
            bindable = rowBindable._getBindable(objName.substr(6));   //rowBindable[(objName.substr(6))];
        } else {
            return; //没有行数据，不能绑定子表元素，错误。
        }
    } else {
        bindable = Amber.getBindable(objName);
    }
    if (bindable != null) {
        bindable.addModel(modelElem);//保存模型元素模版

        if (bindable.isArray()) {
            var lastElem = modelElem;
            //iterate the model to bind each row
            for (var i = 0, l = bindable.len(); i < l; i++) {
                var rowBindable = bindable.get(i);  //取得一行绑定数据
                var bindElem = $(modelElem).clone(true).get(0);//从模版复制一个新行
                $(bindElem).show();
                bindElem.removeAttribute("model");  //行元素，不是模型元素，避免重复绑定
                $(bindElem).data("modelElem", modelElem);   //保存行元素的模版，便于新增行时使用
                rowBindable.addRowElem(bindElem);    //把行元素增加到行数据中
                Amber.bindElem(bindElem, rowBindable, varname);  //绑定行元素到行数据。

                $(lastElem).after(bindElem);    //把行元素增加到dom中
                lastElem = bindElem;
            }
        }
        $(modelElem).hide();     //隐藏行模版
        if (modelElem.hasAttribute("removeModel")) {
            $(modelElem).remove();
        }
        modelElem.setAttribute("processed", "true");//设置处理标志，避免模型元素的重复绑定
    }
};

Amber.bindElems = function () {
    $("[bind]").each(function () {
        Amber.bindElem(this);
    });
};

Amber._reservedProperties = ["parent"];

/**
 * 对指定的绑定数据应用绑定
 * @param bindable-绑定数据
 * @param elem-不应用绑定的元素
 */
Amber.apply = function (bindable, elem) {
    if (bindable == undefined) {
        bindable = Amber;
    } else if (bindable instanceof String || typeof bindable == "string") {
        bindable = Amber(bindable);
    }

    if (bindable != Amber && bindable.isArray()) {//如果bindable是数组，对数组的每一行应用绑定
        for (var i = 0; i < bindable._rows.length; i++) {
            Amber.apply(bindable._rows[i], elem);
        }
    } else {
        var infos = bindable._bindingInfos;   //绑定数据的绑定信息
        var infoLen = infos == null ? 0 : infos.length;
        for (var i = 0; i < infoLen; i++) {
            var info = infos[i];
            if (info.elem == elem  ||
                info.bindStr == null || info.attrName == null) {  //bindInfo已经被删除
                continue;
            }

            try {
                var attrName = bindable._attrName;
                var v;   //当前绑定信息指向的数据
                var vBindable;  //拥有v的绑定数据
                if (attrName == "") {  //绑定数据是数组中的一行
                    if(info.refModel) {
                        if(info.dataName.startWith("model.")) {  //i.e. model.name
                            attrName = info.dataName.substring(6);  //name
                            vBindable = bindable._getBindable(attrName);  //bindable of name
                            v = vBindable == null ? null : vBindable.get();   //value of model.name
                        } else {  //参数中引用了行数据   //aa.bb$model.c,obj.name
                            attrName = info.dataName;   //i.e. aa.bb
                            vBindable = Amber.getBindable(attrName);   //bindable of aa.bb
                            v = vBindable == null ? null : vBindable.get(); //value of aa.bb
                        }
                    } else {
                        //正在对行数据应用绑定，但是元素绑定在与行无关的数据上，需要使用其绑定的数据
                        //bindable = Bind.getBindable(info.bindStr);
                        vBindable = Amber.getBindable(info.dataName);
                        v = vBindable == null ? null : vBindable.get();
                    }
                } else {//当前bindable不是行数据
                    if(!(info.attrName.startWith("on") || info.attrName.startWith("event-on")) &&
                        info.params != null && info.params.length > 0) {//绑定信息引用了参数
                        if(info.refModel) {//绑定信息引用了行数据
                            //查找当前bindable所在的行数据
                            var rowBindable = bindable;
                            v = null;
                            while(rowBindable.parent != null) {
                                rowBindable = rowBindable.parent;
                                if(rowBindable._attrName == "") {//找到了bindable所在的行数据
                                    if(info.dataName.startWith("model.")) {  //i.e. model.name
                                        attrName = info.dataName.substring(6);  //name
                                        vBindable = rowBindable._getBindable(attrName);  //bindable of name
                                        v = vBindable == null ? null : vBindable.get();   //value of model.name
                                    } else {  //参数中引用了行数据   //aa.bb$model.c,obj.name
                                        attrName = info.dataName;   //i.e. aa.bb
                                        vBindable = Amber.getBindable(attrName);   //bindable of aa.bb
                                        v = vBindable == null ? null : vBindable.get(); //value of aa.bb
                                    }

                                    v = Amber._getDataValue(info, v, rowBindable, vBindable.parent);
                                    break;
                                }
                            }
                        } else {//绑定信息未引用行数据
                            vBindable = Amber.getBindable(info.dataName);
                            v = vBindable == null ? null : vBindable.get();
                        }
                    } else {
                        vBindable = bindable;
                        v = bindable.get();   //不是行数据，取得数据的值
                    }
                }

                var dataValue;
                if(v == null) {
                    dataValue = undefined;
                } else {
                    dataValue = (info.attrName.startWith("on") || info.attrName.startWith("event-on")) ?
                    v : Amber._getDataValue(info, v, bindable, vBindable.parent);  //v是函数时等于函数的返回值
                }
                if (!$(info.elem).is("input") && info.attrName == "text") {
                    $(info.elem).text(dataValue);
                } else if (!$(info.elem).is("input") && info.attrName == "html") {
                    $(info.elem).html(dataValue);
                } else if ($(info.elem).is("input") && info.elem.type == "checkbox" && info.attrName == "bind-checked") {
                    info.elem.checked = true && dataValue;
                } else if ($(info.elem).is("input") && info.elem.type == "radio" && info.attrName == "selected") {
                    info.elem.checked = (dataValue == info.elem.value);
                } else if ($(info.elem).is("select") && info.attrName == "selected") {
                    for (var i = 0; i < info.elem.options.length; i++) {
                        info.elem.options[i].selected = false;
                        if (info.elem.options[i].value == dataValue ||
                            $.inArray(info.elem.options[i].value, dataValue) != -1) {
                            info.elem.options[i].selected = true;
                        }
                    }
                } else if (info.attrName.startWith("on") || info.attrName.startWith("event-on")) {
                    //对于形如onclick="@{xxx.xxx}"的事件绑定，在ie中会出现重复装载页面（设置html的方式，不是刷新页面的方式）
                    //数次（次数与绑定的事件数量有关）之后，浏览器的事件处理将崩溃，许多元素的事件均无效，无论该元素事件是否已经绑定
                    if (v instanceof Function) {
                        var eventName = info.attrName.startWith("on") ? info.attrName.substr(2) : info.attrName.substr(8);

                        var rowBindable = null;
                        if(info.refModel) {//绑定信息引用了行数据
                            //查找当前bindable所在的行数据
                            if(bindable._attrName == "") {
                                rowBindable = bindable;
                            } else {
                                var tmpBindable = bindable;
                                while(tmpBindable.parent != null) {
                                    tmpBindable = tmpBindable.parent;
                                    if(tmpBindable._attrName == "") {//找到了bindable所在的行数据
                                        rowBindable = tmpBindable;
                                        break;
                                    }
                                }
                            }
                        } else {
                            rowBindable = bindable;
                        }

                        if(rowBindable != null) {//未引用行数据，或者找到了行数据
                            var args  = Amber._buildArgs(info, rowBindable);
                            $(info.elem).off(eventName, Amber._eventHandler);
                            $(info.elem).on(eventName, {func: v, thisArg: vBindable.parent, bindable: rowBindable, args:args},
                                Amber._eventHandler);
                        }
                    }
                } else if (info.attrName.startWith("css-")) {
                    var cssAttr = info.attrName.substr(4);
                    $(info.elem).css(cssAttr, dataValue);
                } else {
//                info.elem.setAttribute(info.attrName, dataValue == undefined? "" :dataValue);
                   // $(info.elem).attr(info.attrName, dataValue == undefined ? "" : dataValue);
                    //在ie,chrome,safari和firefox中用户在修改了输入框中的内容之后，就无法用setAttribute方法改变其value值
                    //因此用下面的方法给value属性赋值
                    info.elem[info.attrName] = dataValue == undefined ? "" : dataValue;
                }
            } catch (e) {
                console.error("应用绑定时出错，绑定信息：" + (info != null ? (info.bindStr + "。") : "错误。") +
                    e.description);
                console.error(e.stack);
            }
        }
    }

    for (var b in bindable) {
        if (Amber._reservedProperties.indexOf(b) < 0 && !b.startWith("_") && bindable.hasOwnProperty(b) && bindable[b] instanceof Bindable) {
            var bd = bindable[b];
            Amber.apply(bd, elem);
        }
    }
};

Amber.bindAll = function (elem, varname) {
    if (elem.hasAttribute("bind")) {
        Amber.bindElem(elem, undefined, varname);
    } else {
        $(elem).find("[bind]").each(function () {
            Amber.bindElem(this, undefined, varname);
        });
    }
};

Amber.bind = function (elem) {
        if (elem != null) {
            Amber.bindElem(elem);
        } else {
            Amber.bindElems();
        }
        Amber.apply();
};

Amber._getDataValue = function (info, v, bindable, vParent) {
    if (v instanceof Function) {
        return Amber._execFunc(info, v, bindable, vParent);
    } else {
        return v;
    }
}

/**
 *执行函数
 * @param info
 * @param func
 * @param bindable -当前的可绑定数据，即info关联的可绑定数据，并不一定是info.bindStr指定的可绑定数据
 * @param vParent
 * @returns {*}
 * @private
 */
Amber._execFunc = function (info, func, bindable, vParent) {
    if (info.dataName.startWith("model.")) {
        try {
            //调用行对象方法，this(即vParent)为行数据
            var args = Amber._buildArgs(info, bindable);
            return func.apply(vParent, args);
        } catch (e) {
            console.log("调用函数失败：" + info.bindStr);
            console.error(e);
        }
    } else {
        try {
            //调用非行对象方法，this为func对象的上级可绑定数据
            //如果在模型元素内，bindable为行数据
            //如果不在模型元素内，bindable为func的bindable
            var args = [bindable].concat(Amber._buildArgs(info, bindable));
            return func.apply(vParent, args);
        } catch (e) {
            console.log("调用函数失败：" + info.bindStr);
            console.error(e);
        }
    }

    return null;
};

/**
 *构造info中指明的参数表
 * @param info -绑定信息
 * @param bindable -当前行数据
 * @private
 */
Amber._buildArgs = function(info, bindable) {
    var args = [];
    var params = info.params == null? [] : info.params;
    for(var i = 0; i < params.length; i++) {
        var param = params[i];
        if(param == "model") {
            args.push(bindable);  //如果在模型元素内，bindable为行数据
        } else if(param.startWith("model.")) {  //i.e. $model.name
            var attrName = param.substring(6);  //name
            var attrBindable = bindable._getBindable(attrName);  //bindable of name
            //var v = attrBindable == null ? null : attrBindable.get();   //value of model.name
            args.push(attrBindable);
        } else {
            var attrBindable = Amber(param);
            //var v = attrBindable == null ? null : attrBindable.get();
            args.push(attrBindable);
        }
    }
    return args;
}

Amber._setupTextHandler = function (elem, bindable) {
    $(elem).bind("input propertychange", function (event) {
        bindable.put(undefined, this.value, elem);
    });
};

Amber._setupCheckboxHandler = function (elem, bindable) {
    if ($(elem).is("input") && elem.type == "checkbox") {
        $(elem).bind("change", function (event) {
            bindable.put(undefined, this.checked, elem);
        })
    }
};

Amber._setupRadioHandler = function (elem, bindable) {
    if ($(elem).is("input") && elem.type == "radio") {
        $(elem).bind("change", function (event) {
            bindable.put(undefined, this.value, elem);
        })
    }
};

Amber._setupSelectHandler = function (elem, bindable) {
    if ($(elem).is("select")) {
        $(elem).bind("change", function (event) {
            var multiple = elem.hasAttribute("multiple");
            var v = multiple ? new Array() : "";
            for (var i = 0; i < elem.options.length; i++) {
                if (elem.options[i].selected) {
                    if (multiple) {
                        v.push(elem.options[i].value)
                    } else {
                        v = elem.options[i].value;
                        break;
                    }
                }
            }
            bindable.put(undefined, v, elem);
        })
    }
};

Amber._eventHandler = function (event) {
    var func = event.data.func, bindable = event.data.bindable,
        thisArg = event.data.thisArg, args = event.data.args;
    args = [].concat(bindable, event, args);
    func.apply(thisArg, args);
};


//下面的代码是为了使google clouser compiler保留这些名字
window['Amber'] = Amber;
Amber['bind'] = Amber.bind;
Amber['apply'] = Amber.apply;
Amber['bindElem'] = Amber.bindElem;
Amber['get'] = Amber.get;
Amber['buildBindable'] = Amber.buildBindable;
