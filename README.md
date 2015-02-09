琥珀（Amber)
============

琥珀（Amber)主要实现了从JavaScript数据到html元素之间的绑定。通过定义html元素或其属性JavaScript数据之间的关系，按照JavaScript数据生成html元素或设定元素的属性，并实现双向自动更新。当JavaScript数据发生改变时其相关的html元素会自动更新，当用户在页面中输入了数据，输入的数据会自动更新到html元素相关的JavaScript数据中，这称之为双向自动更新。
1.	功能
----------
### 构造javascript数据
```javascript
        var obj1 = {……};
        Amber.buildBindable("obj1");
```
buildBindable函数为JavaScript数据构造可绑定数据对象，参数为JavaScript对象变量名。只有构造了可绑定数据的javascript数据才能被绑定。在构造可绑定数据时，给定的JavaScript变量的所有属性，以及属性的属性都会被构造可绑定数据。
### 绑定元素的属性：
```html
        <input type="text" id="t1" bind  value="@{obj1.name}" />
```
通过把属性对应的数据名放在“@{”和“}中，表明该数据与该属性绑定。该属性称为绑定属性。在“@{”和“}中的字符串称为绑定字符串，绑定字符串应是一个JavaScript对象的字面量。拥有绑定属性的元素必须包含bind属性，否则该元素的绑定属性无效。
### 绑定文本：
```html
        <span bind text="@{obj1.name}" style="color:blue"></span>
```
当给一个元素的text属性设置数据绑定后，text属性所绑定数据的内容将被会以文本形式增加元素内部。
### 绑定HTML：
```html
        <span bind html="@{obj1.name}" style="color:blue"></span>
```
当给一个元素的html属性设置数据绑定后，html属性所绑定数据的内容将被会以文本形式增加元素内部。
### 绑定事件
```html
        <span bind text="@{obj1.value}"  onclick="obj1.func1();"></span>
```
对于将指定对象的方法绑定到非行元素的事件的情况，不需要使用绑定。
### 绑定函数值
```html
        <span bind text="@{obj1.func5}">vvv</span>
```
Obj1.func5是一个函数，text属性将得到该函数运行后的返回值。
### 绑定数组
```html
        <tr bind model="selectedRowObj.products" onclick="@{model.select}">
```
通过设置model属性可以将一个数组绑定到元素，这样该元素将按照数组内容自动重复，该元素称为行模版元素。Model属性的值应是一个JavaScript数组的变量名。对于数组中的每一个元素，都将对应生成一个绑定元素，称为行元素。数组中的一个元素也称为行数据。行元素与行模版内容一致，但是行元素不包含model属性。行模版元素内部的元素称为行内元素，生成行元素时，行内元素也会被对应生成到行元素中。
### 绑定行数据
```html
        <td class="grid"><span bind text="@{model.name}">222</span></td>
```
在行元素内部的绑定元素，可以通过使用model关键字来引用行数据。Model表示行数据。Model之后可以行数据的属性，也可以使用parent关键字引用行数据所属的数据对象。例如：model.parent.XXX.XXX
### 绑定行数据函数
```html
        <tr bind model="model.products" onclick="@{model.select}">
        <td class="grid"><button bind onclick="@{model.op}">选择</button></td>
```
可以给行元素或行内元素的事件绑定行数据的函数。绑定字符串应指向一个函数，否则无效。运行行数据函数时，this值为行数据的可绑定对象，参数为行数据的可绑定对象和事件对象。
### 绑定行数据函数值
```html
        <td class="grid"><span bind text="@{model.val}">vvv</span></td>
```
如果绑定属性不是事件，但是绑定字符串指向了一个函数，这样该绑定属性将会得到函数运行的结果。运行行数据函数时，this值为行数据的可绑定对象，参数为行数据的可绑定对象和事件对象。
### 行内元素绑定非行数据方法值
```html
        <td class="grid"><span bind text="@{obj1.func5$model}">vvv</span></td>
```
行内元素绑定非行数据的方法值，需要使用$model作为后缀。运行这个非行数据函数时，this值为函数所属的对象的可绑定对象，参数为行数据的可绑定对象和事件对象。
### 行内元素事件绑定非行数据方法
```html
        <td class="grid"><button bind onclick="@{obj1.func4$model}">f4</button></td>
```
给行内元素事件绑定非行数据方法时，需要在绑定字符串中使用$model作为后缀。运行这个非行数据函数时，this值为函数所属的对象的可绑定对象，参数为行数据的可绑定对象和事件对象。
### 嵌套的行元素
```html
        <tr bind model="obj1.ary1" class="row" onclick="@{model.op}" >
        <td>
                    <table>
                        <tr bind model="model.products" onclick="@{model.select}">
                          ……
                        </tr>
                    </table>
                </td>
        </tr>
```
行元素可以嵌套在另一个行元素内部。内层行元素的model属性应该引用外层行元素的行数据的属性，且该属性应是一个数组。内层行元素的行内元素中对model的引用指内层行元素的行数据。内层行元素的model属性中对model的引用指外层行元素的行数据。

### 删除行模版元素
例如：
```html
        <option bind model=“……” removeModel/>
```
使用removeModel时，Amber会在绑定该元素后删除该元素。如果元素绑定了数组，并且对原有数据进行全部删除后又增加新数据的操作，这时可以使用这个参数。
### 绑定checkbox，radio，select元素的选择值
```
Checkbox元素通过bind-checked属性，radio，select元素通过selected属性绑定元素选择的值。例如：
```html
<select bind selected="@{selVal}">
```
### 绑定事件
```
可以使用html属性如onclick,onchange等绑定事件，也可以使用event-onXXX属性绑定事件，如：event-onclick。这样可以避免某些浏览器出错。
### 绑定css属性
```
可以使用css-XXX属性来给指定的css属性绑定数据。例如：css-display=”@{displayVal}”

### 应用绑定
```html
        Amber.bind();
```
使数据绑定生效。
2.	API
--------
### Amber.buildBindable()
为指定的JavaScript变量及其包含的所有属性构造可绑定数据。只有构造了可绑定数据，定义的绑定才能生效。
#### 参数
* attrName	需要构造可绑定数据的JavaScript变量名

### Amber ()
获得指定变量的可绑定数据（Bindable）。
#### 参数
* objName	需要查找的可绑定数据的JavaScript变量名

### Amber.bindElem()
绑定指定元素
#### 参数
* elem	需要被绑定的元素
* rowBindable	（可选）元素所在的行的可绑定数据

### Amber.apply()
对所有的绑定元素应用绑定。

### Bindable.prototype.add()
如果当前可绑定对象是数组，就把给定的数据增加到数组中，并且更新数组绑定的元素。
#### 参数
* value	要增加到数组中的JavaScript数据

### Bindable.prototype.remove()
如果当前可绑定对象是数组，从当前数组中删除指定的行数据，并且更新数组绑定的元素。如果没有参数，则把当前的可绑定数据从其所属的数组中删除，并更新数组绑定的元素。
#### 参数
* bindable	行数据（可选）

### Bindable.prototype.get()
取得可绑定对象的值或其属性值对应的JavaScript数据的值。如果没有参数，则返回当前可绑定对象对应的JavaScript数据的值。
#### 参数
* attrName	属性名称（可选）

### Bindable.prototype.put()
给当前可绑定对象或其属性对应的JavaScript数据赋值，同时更新相关的绑定元素。如果属性名称为undefined，则对当前可绑定对象对应的JavaScript数据赋值。
#### 参数
* attrName	属性名称（可选）
* value	值
* elem	不更新该元素的值

### Bindable.prototype.elements ()
获得当前可绑定对象相关的html元素集合

### Bindable.prototype.apply()
应用当前数据的绑定。


* 需要jQuery，运行测试页面请确保在“../js/jquery/”位置存在jquery.js。
