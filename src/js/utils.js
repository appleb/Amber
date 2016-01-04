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

String.prototype.startWith=function(str){
    var reg=new RegExp("^"+str);
    return reg.test(this);
};

String.prototype.endWith=function(str){
    var reg=new RegExp(str+"$");
    return reg.test(this);
};

String.prototype.prefix = function(token) {
    var idx = this.indexOf(token);
    return idx == -1 ? this : this.substring(0, idx);
};

/**
 *返回字符串的制定字符的后缀，如果字符串不包含制定字符，返回null
 * @param token
 * @returns {*}
 */
String.prototype.postfix = function(token) {
    var idx = this.indexOf(token);
    return idx == -1 ? null : this.substring(idx + token.length, this.length);
}

Array.prototype.indexOf = function(obj) {
    for (var i = 0; i < this.length; i++) {
        if (obj === this[i]) {
            return i;
        }
    }
    return -1;
}

Array.prototype.insert = function (idx, val) {
    this.splice(idx, 0, val);
};

Array.prototype.remove = function (idx) {
    if ($.isNumeric(idx)) {
        this.splice(idx, 1);
    } else {
        var val = idx;
        for (var i = 0; i < this.length; i++) {
            if (val === this[i]) {
                this.splice(i, 1);
                return;
            }
        }
    }
};

function showObj(obj) {
    var s = "";
    for(attr in obj) {
        if(typeof(obj[attr])=="object") {
            s += attr + ":" + showObj(obj[attr]) + "</br>";
        } else {
            s += attr + ":" + obj[attr].toString() + "</br>";
        }
    }
    return s;
}

function getAttr(obj, attrName) {
    var attrs = attrName.split(".");
    var ret = obj;

    for(var i = 0; i < attrs.length; i++) {
        ret = ret[attrs[i]];
    }
    return ret;
}

