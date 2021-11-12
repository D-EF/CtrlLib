<!--
 * @LastEditors: Darth_Eternalfaith
 * @LastEditTime: 2021-07-19 00:41:17
-->
这个文档是 CtrlLib 的使用说明, 由于代码太多了所以不再在文档里更新代码说明了!   
而且代码中的注释还是挺详细的   
想看旧的代码文档请看 "old readme.md"   

# 使用说明
## 编辑 XML 以 为ExCtrl 提供 bluePrint 
----
 
* 使用 模板字符串 在 内容 或者在 属性的 value 里使用 ${*表达式*} 即可食用。  
  表达式的this指针指向当前控件  
  一个控件实例并且渲染时, 父元素禁止拥有子元素
  示例:
  ``` xml
  <div class="${this.data.class}">${this.ctrlLibID}</div>
  ```
### 使用特殊的属性来增加控制 
*这些特殊属性可以在控件类原型中编辑 attrKeyStrCtrls 来修改*
* 给元素赋值 ctrlID "ctrl-id"    
  属性值应为一份字符串   
  如果没有赋值，蓝图生成器会自动以 dom 结构 分配 ctrlID
  示例:
  ``` xml
    <div ctrl-id="root"></div>
  ```
  生成的这个元素可以在js中以这种方式获取
  ``` javascript
    this.elements.root;  //此处的this表示当前的控件
  ```
* 控制元素是否渲染 "ctrl-if"
  属性值应为一份表达式,如果表达式为非零则会渲染元素，而如果为零则不会渲染。
  这个属性可以控制元素是否被渲染

* 使用 循环生成子元素 在父元素中使用属性 "ctrl-for"   
  值为 for 的循环判断体   
  示例:   
  ``` XML
  <div ctrl-for="this.i=0;this.i<10;++this.i">
    <div> ${this.i} </div>
  </div>
  ```
  控制的值一定要写在 this 中，因为运行时的 初始化 和 判读体 和 回调 以及 内容 都是不同上下文的  
  生成的元素的ctrlID会在末尾带上一段表示该元素是由ctrlfor生成的标志

* 在当前的标签下加入子控件 "ctrl-child_ctrl"
  值应为在 控件的 原型属性的 childCtrlType 中的 key 值; 用于选择子控件的类型
  子控件会被存入到控件的 childCtrl 属性中
  示例
  ``` xml
    <div>
      <div ctrl-child_ctrl="childCtrlType"></div>
    </div>
  ```
  有时可能子控件需要有数据支持渲染   
  我建议在控件的js中使用方法来给控件加入属性
  ``` javascript
    this.callChild(childCtrlID,_fnc,surplusArgument)
  ```

* 给子控件加入属性 "childCtrlData"
  "ctrl-child_ctrl_datafnc" 这个属性一定要配合 "ctrl-child_ctrl" 使用,不然是完全没有效果的。   
  值应为一份js语句，需要以 data 为实参调用 callback 函数;
  而且执行完成后才会将子控件渲染。而callback的实参会参与到子控件的构造函数中的实参
  示例
  ```xml
    <div>
        <div ctrl-child_ctrl="childCtrlType" ctrl-child_ctrl_datafnc="callback({a:1,b:2,c:3})"></div>
    </div>
  ```

* 给子控件添加控件属性 "chco-"
  用这个前缀可以给子控件加入属性, 值应为一份可以被json反序列化的字符串;   
  示例
  ```xml
    <div>
        <div ctrl-id="test1" ctrl-child_ctrl="childCtrlType" chco-op1="asdasd" chco-op2="true" chco-op3="12345" chco-op4="[1,2,3,4,5]" chco-op5="{a:1,b:2,c:3}"></div>
    </div>
  ```
  这样生成出来的子控件将会有五个属性   
  相当于在父控件中运行
  ```javascript
  this.childCtrl["test1"].op1="asdasd";
  this.childCtrl["test1"].op2=true;
  this.childCtrl["test1"].op3=12345;
  this.childCtrl["test1"].op4=[1,2,3,4,5];
  this.childCtrl["test1"].op5={a:1,b:2,c:3};
  ```

* 为元素添加 dom 事件, 在元素中使用属性 pa-${actType}, 值为操作的 js 代码  
  示例:
  ``` XML
    <div pa-click="console.log(this,tgt,e);">111</div>
    <!-- 点击后会在控制台打印: 当前控件, 当前元素, 当前事件的 event 对象 -->
  ```   
  此处的 this 指针为控件, 如果需要用当前元素 应该使用 tgt    
  e 指向当前的 事件对象 

* 为元素添加 控件 事件, 在元素中使用属性 ca-${actType}, 值为操作的 js 代码  
  控件会在一些动作发生时触发这些事件
  示例:
  ``` XML
    <div ca-callback="console.log(this,tgt);">111</div>
    <!-- 控件加载完成后会在控制台打印: 当前控件, 当前元素 -->
  ```   
  此处的 this 指针为控件, 如果需要用当前元素 应该使用 tgt, 并没有e参数  

### **特殊的 dom 事件**  
  控件提供了一些特殊的事件, 这些事件是强化后的 dom 事件  
* pa-keyup[{Number}] & pa-keydown[{Number}]    

  当按下或抬起组合键时组合键触发时间  
  方括号中的值为按键的 keyCode  

  示例:  
  ```xml
  <div pa-keydown[38]="console.log('这是方向键向上按下')" pa-keydown[38,40]="console.log('这是方向键上下一起按下')"></div>
  ```
  和一般的dom事件一样，它也能得到 **this** *控件* , **tgt** *当前元素* ,**e** *事件对象*

* pa-resize  
  元素大小缩放时触发的事件,和普通的dom事件一样使用，但是这个事件没有e参数  
----

## 派生 ExCtrl 制作一个控件类
```javascript
class EX1 extends ExCtrl{}
/**
 * @type {DEF_VirtualElementList}
 * 你可以使用 DEF_VirtualElementList.xmlToVE(xmlStr); 来生成 bluePrint.
 */
EX1.prototype.bluePrint= bluePrint;
```

## 示例 "走马灯"

xml代码
```xml
<div class="imgList-root" ctrl-id="root" pa-resize="this.renderString();">
    <ul ctrl-id="list" class="imgList-list" style="left:${this.index*(-100)}%" ctrl-for="this.i=0;this.i<this.data.list.length;++this.i" >
        <li class="imgList-item"  style="left:${this.i*100}%;">
            <a class="imgList-itemLink" href="${this.data.list[this.i].url}" title="${this.data.list[this.i].title}">
                <div class="imgList-itemImgBox">
                    <img class="imgList-itemImg" src="${this.data.list[this.i].imgurl}"/>
                </div>
                <div class="imgList-itemTitleBox">
                    ${this.data.list[this.i].title}
                </div>
            </a>
        </li>
    </ul>
    <div class="imgList-ctrlListBox" >
        <ul class="imgList-ctrlList"  ctrl-for="this.i=0;this.i<this.data.list.length;++this.i">
            <li class="imgList-ctrlItem" pa-click="this.setIndex(${this.i})"></li>
        </ul>
        <div class="imgList-ctrlListMark" style="top:${this.index*(16)}px;"></div>
    </div>
    <div ctrl-id="last" class="imgList-last" pa-click="this.indexStep(-1)"></div>
    <div ctrl-id="next" class="imgList-next" pa-click="this.indexStep(1)"></div>
</div>

```
css代码太长了所以不贴上来了   
以下是js代码
```javascript

/**
 * 图片轮播?
 */
class ImgList extends ExCtrl{
    constructor(data){
        super(data);
        this.index=0;
    }
    /**
     * 步进 index 
     * @param {Number} _step 步长
     * @returns {Number} 返回新的 index
     */
    indexStep(_step){
        var tgtIndex=_step+this.index;
        return this.setIndex(tgtIndex);
    }
    /**
     * 更改当前 index
     * @param {Number} _index
     */
    setIndex(_index){
        var index=_index,
            maxI=this.data.list.length;
            
        if(index>=maxI){
            do{
                index=index-maxI;
            }while(index>=maxI)
        }else if(index<0){
            do{
                index=maxI+index;
            }while(index<0)
        }
        this.index=index;
        this.renderString();
        return this.index;
    }
}
    ImgList.prototype.bluePrint=DEF_VirtualElementList.xmlToVE(xmlStr);// 这里是把xml的代码的字符串转成蓝图的类 DEF_VirtualElementList
```
之后就可以将这个控件类加入到其他控件的原型属性中作为子控件的类型，也可以直接使用
```javascript
var imglists1=new ImgList();
// 需要加入 data 属性以用于渲染
imglists1.addend(document.body);
```
---