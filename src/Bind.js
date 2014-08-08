/**
 * Bind
 * User: yhq
 * Date: 14-6-16
 * Time: 下午3:48
 */

function Bind() {
}

Bind.bindables = new Array();

Bind.option = function (obj) {
    return obj == undefined ? null : obj;
};

Bind.buildBindable = function (attrName) {
    var attrValue;
    if(arguments.length == 1) {
        if(attrName instanceof Array) {
            for(var i = 0; i < attrName.length; i++) {
                Bind.buildBindable(attrName[i]);
            }
        } else {
            attrValue = eval(attrName);
            Bind[attrName] = new Bindable(attrValue, attrName, obj);
        }
    }
}

Bind.getBindable = function (objName) {
    var names = objName.split(".");
    var owner = Bind;

    for (var i = 0; i < names.length; i++) {
        var v = owner[names[i]];
        if(v instanceof Bindable) {
            owner = v;
        } else {
            if(owner instanceof Bindable) {
                if(owner.isArray()) {
                    owner = owner.getArrayBindable(names[i]);
                }else {
                    return null;
                }
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
Bind.parseInfo = function (elem, attrName) {
    var str = elem.getAttribute(attrName);
    if (str != null && str.startWith("@{") && str.endWith("}")) {
        var dataName = str.substr(2, str.length - 3);
        var info = new BindingInfo(elem, attrName, dataName);
        return info;
    }
    return null;//不正确的格式
};

/**
 * 绑定指定html元素
 * @param elem - html元素
 * @param rowBindable - elem所属的行绑定数据
 */
Bind.bindElem = function (elem, rowBindable) {
    if (elem.hasAttribute("model")) {    //这是一个模型元素
        Bind.bindModel(elem, rowBindable);
    } else {             //非模型元素，绑定元素
        var attrNames;

        //过滤掉包含在模型元素内部的绑定元素。
        // 主要是为了避免把作为模版使用的模型元素的内部的绑定元素进行绑定，
        // 如果这样将会使新增的模型元素不能被绑定，因为其内部的绑定元素的bind属性已经被删除了。
        if (!elem.hasAttribute("bind") || $(elem).parents("[model]").length != 0) {
            return;
        }else if(elem.getAttribute("bind") == null || elem.getAttribute("bind") == "") {
            //处理元素的绑定属性
            var attrs = new Array();
            for(var i = 0; i < elem.attributes.length; i++) {
                var name = elem.attributes[i].name;
                var str = elem.getAttribute(name);
                if(str.startWith("@{") && str.endWith("}")) {
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
                var info = Bind.parseInfo(elem, attrName);

                if (info != null) {
                    var bindable;
                    if (rowBindable != null && (info.dataName.startWith("model")
                        || info.dataName.endWith("\\$model"))) {  //rowBindable仅用于对模型元素的引用
                        //绑定在行数据上
                        bindable = rowBindable;

                        if (info.dataName.startWith("model.")) {
                            var elemBindable = bindable._getBindable(info.dataName.substring(6));//[info.dataName.substring(6)]
                            if (elemBindable instanceof Bindable && !elemBindable.isFunction()) {
                                //对模型元素内部的绑定元素设置绑定信息，
                                // 否则更新数据时不能自动更新模型元素内部的绑定元素
                                elemBindable.addBindingInfo(info);
                            }
                        }
                    } else {  //没有绑定在行数据上
                        var dataName = info.dataName;
                        bindable = Bind.getBindable(dataName);
                        if (rowBindable != null) {
                            //元素处在行元素中，将绑定信息增加到行数据中
                            //这样当应用行绑定数据时，也会更新这个元素的绑定数据，尽管该元素没有绑定在行数据上
                            //否则，当新增行时，这个元素不会被应用绑定。
                            rowBindable.addBindingInfo(info);
                        }
                    }

                    if (bindable != null) {
                        bindable.addBindingInfo(info);   //把绑定信息添加到可绑定数据中

                        if ($(info.elem).is("input") && info.elem.type == "checkbox" && info.attrName == "checked") {
                            Bind._setupCheckboxHandler(info.elem, bindable);
                        } else if ($(info.elem).is("input") && info.elem.type == "radio" && info.attrName == "selected") {
                            Bind._setupRadioHandler(info.elem, bindable);
                        } else if ($(info.elem).is("input") && info.elem.type == "text" && info.attrName == "value") {
                            Bind._setupTextHandler(info.elem, bindable);
                        } else if ($(info.elem).is("select") && info.attrName == "selected") {
                            Bind._setupSelectHandler(info.elem, bindable);
                        }
                    }
                }
            } catch(e) {
                console.log("应用绑定时出错，绑定信息：" +
                    (info != null ? (info.dataName+"。") : "错误。") + e.description);
            }
        }

        elem.removeAttribute("bind");//避免重复进行绑定

        $(elem).find("[bind]").each(function () {   //绑定子元素
            Bind.bindElem(this, rowBindable);
        });
    }
};

/**
 *绑定一个模型元素及其所有的子元素
 * @param modelElem -要绑定的模型元素
 * @param rowBindable - 当前行绑定数据
 */
Bind.bindModel = function (modelElem, rowBindable) {
    var objName = modelElem.getAttribute("model");
    var bindable;
    if(objName.startWith("model.")) {//modelElem是一个子表
        if(rowBindable != null) {
            //绑定数据为行数据中由objName指定的属性值，应该是一个数组
            bindable = rowBindable._getBindable(objName.substr(6));   //rowBindable[(objName.substr(6))];
        } else {
            return; //没有行数据，不能绑定子表元素，错误。
        }
    } else {
        bindable = Bind.getBindable(objName);
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
                Bind.bindElem(bindElem, rowBindable);  //绑定行元素到行数据。

                $(lastElem).after(bindElem);    //把行元素增加到dom中
                lastElem = bindElem;
            }
        }
        $(modelElem).hide();     //隐藏行模版
    }
};

Bind.bindElems = function () {
    $("[bind]").each(function () {
            Bind.bindElem(this);
    });
};

Bind._reservedProperties = ["parent"];

/**
 * 对指定的绑定数据应用绑定
 * @param bindable-绑定数据
 * @param elem-不应用绑定的元素
 */
Bind.apply = function (bindable, elem) {
    if (bindable == undefined) {
        bindable = Bind;
    }

    if(bindable != Bind && bindable.isArray()) {//如果bindable是数组，对数组的每一行应用绑定
        for(var i = 0; i < bindable._rows.length; i++) {
            Bind.apply(bindable._rows[i], elem);
        }
    } else {
        var infos = bindable._bindingInfos;   //绑定数据的绑定信息
        var infoLen = infos == null ? 0 : infos.length;
        for (var i = 0; i < infoLen; i++) {
            var info = infos[i];
            if (info.elem == elem) {
                continue;
            }

            try{
            var attrName = bindable._attrName;
            var v;   //当前绑定信息指向的数据
            var vBindable;  //拥有v的绑定数据
            if(attrName == ""){  //绑定数据是数组中的一行
                if (info.dataName.endWith("\\$model")  || info.dataName.startWith("model.")) {
                    if (info.dataName.startWith("model.")) {//元素绑定在行数据上
                        attrName = info.dataName.substring(6);
                        vBindable = bindable._getBindable(attrName);
                        v = vBindable.get();
                    } else if (info.dataName.endWith("\\$model")) {//元素没有绑定在行数据上，但是需要行数据作为参数
                        attrName = attrName == "" ? info.dataName.substring(0, info.dataName.length - 6)
                            : attrName.substring(0, attrName.length - 6);
                        vBindable = Bind.getBindable(attrName);
                        v = vBindable.get();
                    }

                } else {
                    //正在对行数据应用绑定，但是元素绑定在与行无关的数据上，需要使用其绑定的数据
                    //bindable = Bind.getBindable(info.dataName);
                    vBindable = Bind.getBindable(info.dataName);
                    v = vBindable.get();
                }
            } else {
                vBindable = bindable;
                v = bindable.get();   //不是行数据，取得数据的值
            }

            var dataValue = info.attrName.startWith("on")? v : Bind._getDataValue(info, v, bindable, vBindable.parent);  //v是函数时等于函数的返回值
            if (!$(info.elem).is("input") && info.attrName == "text") {
                $(info.elem).text(dataValue);
            } else if (!$(info.elem).is("input") && info.attrName == "html") {
                $(info.elem).html(dataValue);
            } else if ($(info.elem).is("input") && info.elem.type == "checkbox" && info.attrName == "checked") {
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
            } else if(info.attrName.startWith("on")) {
                if(v instanceof Function) {
                    var eventName = info.attrName.substr(2);
                    $(info.elem).off(eventName, Bind._eventHandler);
                    $(info.elem).on(eventName, {func:v,thisArg:vBindable.parent,bindable:bindable},
                        Bind._eventHandler);
                }
            } else {
                info.elem.setAttribute(info.attrName, dataValue);
            }
            } catch(e) {
                console.error("应用绑定时出错，绑定信息：" +(info != null ? (info.dataName + "。") : "错误。") +
                    e.description);
            }
        }
    }

    for (var b in bindable) {
        if (Bind._reservedProperties.indexOf(b) < 0 && !b.startWith("_") && bindable[b] instanceof Bindable) {
            var bd = bindable[b];
            Bind.apply(bd, elem);
        }
    }
};

Bind.bind = function() {
    Bind.bindElems();
    Bind.apply();
};

Bind._getDataValue = function(info, v, bindable, vParent) {
    if(v instanceof Function) {
        return Bind._execFunc(info, v, bindable, vParent);
    } else {
        return v;
    }
}

Bind._execFunc = function(info, func, bindable, vParent) {
    if(info.dataName.startWith("model.")) {
        try {
            return func.call(vParent);
        }catch(e) {
            console.log("调用函数失败："+ info.dataName);
            console.error(e);
        }
    } else {
        try {
            return func.call(vParent, bindable);
        }catch(e) {
            console.log("调用函数失败："+ info.dataName);
            console.error(e);
        }
    }

    return null;
};

Bind._setupTextHandler = function (elem, bindable) {
    if ($(elem).is("input") && elem.type == "text") {
        $(elem).bind("input propertychange", function (event) {
            bindable.put(undefined, this.value, elem);
        })
    }
};

Bind._setupCheckboxHandler = function (elem, bindable) {
    if ($(elem).is("input") && elem.type == "checkbox") {
        $(elem).bind("change", function (event) {
            bindable.put(undefined, this.checked, elem);
        })
    }
};

Bind._setupRadioHandler = function (elem, bindable) {
    if ($(elem).is("input") && elem.type == "radio") {
        $(elem).bind("change", function (event) {
            bindable.put(undefined, this.value, elem);
        })
    }
};

Bind._setupSelectHandler = function (elem, bindable) {
    if ($(elem).is("select")) {
        $(elem).bind("change", function (event) {
            var multiple = elem.hasAttribute("multiple");
            var v = multiple ? new Array() :"";
            for(var i = 0; i < elem.options.length; i++) {
                if(elem.options[i].selected) {
                    if(multiple) {
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

Bind._eventHandler = function(event) {
    var func = event.data.func, bindable = event.data.bindable,
        thisArg = event.data.thisArg;
    func.call(thisArg, bindable, event);
};