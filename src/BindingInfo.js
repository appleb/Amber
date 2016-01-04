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
 * 绑定信息
 * User: yhq
 * Date: 14-6-16
 * Time: 下午3:18
 */

/**
 * @constructor
 */

function BindingInfo(elem, attrName, bindStr) {
    this.elem = Amber.option(elem);            //html元素
    this.attrName = Amber.option(attrName);       //绑定的html元素的属性名
    this.bindStr = Amber.option(bindStr);               //绑定字符串

    this.dataName = this.bindStr;   //绑定数据名i.e. bindStr="a.b$c"  dataName = "a.b"
    this.params = null;  //绑定字符串的参数，i.e. bindStr="a.b$c，d"  params=["c","d"]
    this.refModel = false;//绑定数据或参数是否引用的行数据
    if(this.bindStr.indexOf("$") != -1) { //绑定信息包含参数
        this.dataName = this.bindStr.prefix("$");
        var paramStr = this.bindStr.postfix("$");
        this.params = paramStr.split(",");
    }

    if(this.dataName.startWith("model")) {
        this.refModel = true;
    }

    for(var j = 0; this.params != null && j < this.params.length; j++) {
        var param = this.params[j].trim();
        if(param.startWith("model")) {
            this.refModel = true;
        }
        this.params[j] = param;
    }
}

/**
 *删除绑定的元素
 */
BindingInfo.prototype.clear = function () {
    this.attrName = null;
    this.bindStr = null;
    $(this.elem).remove();
};

