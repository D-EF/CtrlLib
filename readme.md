<!--
 * @LastEditors: Darth_Eternalfaith
 * @LastEditTime: 2021-07-19 00:44:49
-->
 这个文档编写 CtrlLib 的 文档  
# 框架必须先引用我的一个函数库才能正常使用
[Basics.js](https://gitee.com/darth_ef/basics) 
因为我把渲染模板字符串等重要的函数放在那个库里面了
----
# CtrlLib 基类  
该基类包含 CtrlLib 的部分功能实现和声明虚方法  
原则上不允许直接使用这个类  

----
## 构造函数
constructor(data)   
  @param {Object} data 存入的数据

----
## CtrlLib 属性  
### 静态属性  
* idIndex  {Number} 用于计算控件的id的属性, 不要在 addend 方法以外的地方修改它; 更不要把值改小   
----
### 原型属性  
* childCtrlType *\{CtrlLib\}* 子控件类的集合 用于添加子控件  
----

### 实例属性  
* name  *String*  
  就像为什么你叫现在的名字，这个属性并没有什么实际用途用  
  
* ctrl_lib_id *Number*  
  用于区分所有控件的唯一id, 会在 new 一个 CtrlLib 或 它的派生类 时自增  
  ``` javascript
  this.ctrl_lib_id=CtrlLib.idIndex++; 
  ```  
  
* data *Object*  
  存放数据的地方  
  
* rootNodes *Array\< HTMLElement \>*  
  控件的根级 dom 子元素  
  
* parentNode *HTMLElement*  
  控件的父级 dom 元素  
  
* parentCtrl *CtrlLib*  
  控件 的 父级控件  
  
* childCtrl *Object*  
  子控件的集合  
  
* elements *Object*  
  子元素的集合  
  
* ctrlActionList *Object*  
  控件的动作集合  
  
* childCtrlActionList *Object*  
  childCtrlActionList\[ctrl_id\] *Array\< Function \>*  
  被挂起的子控件动作  
  因为子控件加载不一定是瞬间加载完成的(可能需要等待http请求完成后才能加载)  
  所以动作会被挂起  
  
----
## CtrlLib 方法  
* addend(_parentNode,...surplusArgument)    
  将控件加入到指定的dom元素内    
  @param {HTMLElement} _parentNode 指定的父dom元素    
  @param surplusArgument 这些参数将会传递到 createContent 方法中  

* createContent(surplusArgument)  **虚方法**   
  创建内容   
  需要把元素赋值到 this.rootNodes 上   
  
* callParent(_fnc,...surplusArgument)  
  呼叫父级控件  
  @param {Function} _fnc 执行的动作, 动作的this指针是目标控件  
  @param {any} surplusArgument _fnc 执行的参数  
  
* callChild(childCtrlID,_fnc,surplusArgument) **虚方法**  
    呼叫子控件, 如果兄弟控件没有加载完成将会被挂起  
    @param {String} childCtrlID 控件 在父控件的父元素 的 ctrl_id  
    @param {Function} _fnc 执行的动作, 动作的this指针是目标控件  
    @param {any} surplusArgument _fnc 执行的参数  
    **这个方法在 ExCtrl 中有一个实现**  
  
* callBrother(childCtrlID,_fnc,...surplusArgument) **虚方法**  
    呼叫兄弟控件, 如果兄弟控件没有加载完成将会被挂起  
    @param {String} childCtrlID 控件 在父控件的父元素 的 ctrl_id  
    @param {Function} _fnc 执行的动作, 动作的this指针是目标控件  
    @param {any} surplusArgument _fnc 执行的参数  
    **这个函数在 ExCtrl 中有一个实现**  
      
* initialize(...argument) **虚方法**  
    addend刚开始执行的函数,  
    能调用到 addend 的 argument  
    通过返回字符串 "stop" 可以挂起 addend  
    当然你需要在这个方法中再使用 addend  
  
* callback(...argument) **虚方法**  
    addend 后的回调  
    能调用到 addend 的 argument  
  
  
* reRender() **虚方法**  
    重新渲染  
    根据data渲染部分需要渲染的内容  
    **这个方法在 ExCtrl 中有一个实现**  

* reRender_callback() **虚方法**  
    重新渲染完成后的回调  

* touchCtrlAction(actionKey)   
    触发控件事件的方法  
    @param {String} actionKey 事件的类型  

* addCtrlAction(actionKey,_fnc)  
    添加控件事件  
    @param {String} actionKey 事件的类型  
    @param {Function} _fnc    事件的执行函数 将会以控件为 this 指针  

----

# ExCtrl 类  **派生于 CtrlLib**  
  控件库派生类的基类,需要在派生时添加 **bluePrint** {DEF_VirtualElementList} 原型属性  
  这个类继承了 CtrlLib 类 的 所有属性和方法   
  #### 构造函数 constructor(data)
    @param {Object} data 存入的数据
----
## ExCtrl 属性  
### 静态属性  

* attrKeyStrCtrls { AttrKeyStrCtrl []}   
  属性控制器的集合备档   

----
### 原型属性  

* attrKeyStrCtrls {AttrKeyStrCtrlList}   
  属性控制器的集合 用于控制 attributes      

* templateStringIsHTML
  规定模板字符串能否为 html, 如果启用, 就别在 ctrl-if 的前面放模板字符串，否则可能会导致 ctrl-if 的渲染出错

* bluePrint **虚属性**
  储存渲染用的蓝图。在实际用的派生类中一定要加入这个属性
---
### 实例属性  
---
* dataLinks {{}} 用于登记模板字符串的属性   
  
----
## ExCtrl 原型方法  
* getElementsByCtrlID(ctrl_id)    
  通过 ctrl_id 获取元素  
  @param {String} ctrl_id  
  @returns {Array\< Element \>} 返回元素,包括ctrl-for 的  

* attrHandle(key,elements,ves,i,_attrVal,tname,k,forFlag)  
  控制标签的属性  
  @param {String} key 属性的key  
  @param {Element[]} elements 实例的 elements 的引用，用于添加新的子元素  
  @param {DEF_VirtualElement[]} ves DEF_VirtualElement 的数组  
  @param {Number} i 当前的ves的下标  
  @param {String} _attrVal 属性值  
  @param {String} tname 临时的元素名称，用作实例的 elements 当前的索引  
  @param {Number} k 当前的ves的下标  
  @param {String} forFlag 表示是不是 for 的  
  @returns {Number} 返回运算完成后的ves下标  
  
* stringRender(str,ctrl_id,type,ishtml,attrkey,tgt)  
  渲染 模板字符 内容  
  @param {String} str  write TemplateKeyStr  
  @param {String} ctrl_id    登记 ID         
  @param {String} type      登记 类型    
  @param {Boolean} ishtml   控制返回值, 默认将返回字符串 ，非0 将返回 DocumentFragment  
  @param {[]} attrkey   如果是登记的 标签的属性值 这个是属性的 key  
  @param {Element} tgt   
  @return {String||DocumentFragment} 字符串 或 包含内容的文档片段  
  
* renderFor(elements,ves,i,forStr,tname)  
  渲染for 循环生成内容
  @param {Element[]}   elements      
  @param {DEF_VirtualElement[]}   ves         DEF_VirtualEle  
  @param {Number}  i           当前的ves的索引  
  @param {String}  forStr      属性内容  
  @param {String}  tname       elements的索引  
  @returns {Number} 返回跳过子元素的索引  
  
* ctrlIf(elements,ves,i,attrVal,tname)  
  用于控制元素是否出现  
  @param {Element[]}   elements      
  @param {DEF_VirtualElement[]}   ves         DEF_Virt  
  @param {Number}  i           当前的ves的索引  
  @param {String}  attrVal     属性内容  
  @param {String}  tname       elements的索引  
  @returns {Number} 返回跳过子元素的索引  
  
* renderChildCtrl(element,ve,childCtrlType)  
  渲染子控件  
  @param {Element} element         加载子控件的元素  
  @param {DEF_VirtualElement} ve     
  @param {String} childCtrlType  控件的类型  

* itemVEToElement(ves,_nameEX,forFlag)  
  把 ve 转换成 js 的 Element 对象;  
  @param   {DEF_VirtualElement[]} ves   DEF_VirtualElement list  
  @param   {String}     _nameEX    用来添加命名的  
  @return  {Object{elements:{},fragment:DocumentFragment}}  

* renderString()  
  重新渲染模板字符串内容  

* reRender()  
  根据依赖项重新渲染所有内容 仅有在 stringRender 中登记过才能使用  

* renderCtrl_before(ctrl_id)  
  重新渲染元素前面的文本  

* renderCtrl_innerEnd(ctrl_id)  
  重新渲染模板字符串内容: 加在元素末尾的内容  
  @param {String} 目标的 ctrl_id  

* renderCtrl_attr(ctrl_id,attrkey)  
  重新渲染模板字符串内容: 元素 的 属性  
  @param {String} 目标的 ctrl_id  
  @param {String} 目标的属性的 key   

* renderStyle()  
  渲染styleElement内容  
    
* 方法集 reRenderAttrCtrl
  
    * ctrl-for(bluePrint,tgtElem)  
      重新渲染由ctrl-for生成的内容
      @param {DEF_VirtualElementList} bluePrint 蓝图  
      @param {Element} tgtElem  将要渲染的目标

    * ctrl-if(bluePrint,tgtElem)   
      重新渲染被ctrl-if控制的内容  
      @param {DEF_VirtualElementList} bluePrint  
      @param {Element} tgtElem  
      
----
## ExCtrl 静态方法  
* getJsonData()  
  请求 api 并运行 json 反序列化  

* xmlToCtrl()函数  
  将xml(html)代码制作成一个EXCtrl类  
  @param {String} htmlStr html代码  
  @param {Object} _prototype 追加到派生控件的原型链  
  @returns {class} 返回一个 ExCtrl 的 派生类    
----

# DEF_VirtualElementList 类
  这个是用于给 ExCtrl 类保存 蓝图的类  
  采用的是序列化树(数组)的数据结构
  ### 构造函数 constructor(ves,maxDepth,style)
    @param {DEF_VirtualElement[]} ves 序列化的虚拟元素树  
    @param {Number} maxDepth 最大深度  
    @param {DEF_CSSVE} style 样式元素  
  ---
  ## DEF_VirtualElementList 实例属性
  ---
  * ves {Array\<DEF_VirtualElement\>}  
    存储着序列化树的虚拟元素的数组 
  * maxDepth {Number}    
    树的最大深度
  * style {DEF_CSSVE}   
    存储控件的样式的蓝本
  ---
  ## DEF_VirtualElementList 静态属性
  ---
  * voidElementsTagName {Array\<String\>}   
    所有无内容元素(短标签)的tag name
  ---
  ## DEF_VirtualElementList 原型方法
  ---
  * getCtrlIDByIndex(index)  
    根据 ves 的下标, 查找ctrl_id  
    @param {Number} index  
    @returns {String} ctrl_id  
  
  * getByCtrlID(ctrl_id)  
    根据 ctrl_id 寻找 项   
    @param {String} ctrl_id   
    @returns {DEF_VirtualElement} 返回目标  

  * getIndexByCtrlID(ctrl_id){
      根据 ctrl_id 寻找 项 
      @param {String} ctrl_id 
      @returns {Number} 返回目标的下标

  * getByLastDepth(start,depth,min=0)  
      向前寻找目标深度的 ves item  
      @param {Number} start 起点  
      @param {Number} depth 目标 深度  
      @param {Number} min   最小深度, 如果超过限制将返回最小深度的下标  
      @returns {Number} 返回目标的下标, 如果超过最小深度限制，将在返回中添加一个 flag=true 属性  

  * getChild(vesindex)
      获取子元素  
      @param {Number} vesindex 目标ves的下标  
      @returns {{indexs:Number>,ves:Array<<DEF_VirtualElement[],p:Number}}  
      @return {Number[]} indexs 在原蓝图中的下标集合  
      @return {DEF_VirtualElement[]} ves 子元素集合  
      @return {Number} p 下一个同级元素的下标  

  * getParent(vesIndex)
      获取父元素  
      @param {Number} vesIndex 子元素在 ves 的下标  
      @returns {Number} 返回父元素的下标  
  ---
  ### DEF_VirtualElementList 静态方法
  ---
  * xmlToVE(_xmlStr)
    把xml转换成 DEF_VirtualElementList
    @param {String} xmlStr
    @return {DEF_VirtualElementList} {ves:VirtualElement[],maxDepth:Number}
----
# DEF_VirtualElement 类
  作为虚拟元素树的叶子 供 htmlToControl 处理xml字符串
  ### 构造函数 constructor(tagName,depth,attribute,before,innerEnd)
    @param {String}  tagName     标签名
    @param {Number}  depth       深度
    @param {Array}   attribute   标签的属性  [{key,val}]
    @param {String}  before      在标签前的内容
    @param {String}  innerEnd    最后一段内容
  ---
  ## DEF_VirtualElement 实例属性
  * tagName     *String*    
  标签名
  
  * depth       *Number*    
  深度
  
  * attribute   *Array*     
  标签的属性  [{key,val}]
  
  * before      *String*    
  在标签前的内容
  
  * innerEnd    *String*    
  最后一段内容
  
  * ctrl_id      *String*    
  标签在这组xml中的唯一标识, 可以在编辑编辑xml时用标签的 ctrl-id 属性控制
  
  ---
  ## DEF_VirtualElement 原型方法
  * setAttribute(key,val)  
    存入属性   
    @param {String} key 属性的 key   
    @param {String} val 属性的 value   
    @return {Number} 1:join; 2:update   

  * getAttribute(key)   
    获取属性   
    @param {String} key 属性的 key   
  @return {String} 返回属性的 value   
   
  * getAttributesByKeyBA(before="",after="")   
    用key的 before 或 after 获取属性   
    @param {String} before   key 的开头的字符串   
    @param {String} after    key 的结尾的字符串   
    @returns {Array} 返回 item 格式: {key:String, value:String}   
----
----
# DEF_CSSVE 类
  给控件添加 style 样式标签
  ---
  ### 构造函数 constructor(cssString)
    @param {String} cssString css 格式的字符串
  ---
  ## DEF_CSSVE 实例属性
  * cssList *Array\< DEF_CSSVEItem \>*
  ---
  ## DEF_CSSVE 原型方法  
  * addString(cssString)   
    加入 css 字符串
    @param {String} cssString css 格式的字符串      
   
  * createCssString(ctrl_lib_id,that)    
    创建 css 的文本    
    @param {Number} ctrl_lib_id 控件的id   
    @param {CtrlLib} that   
    @returns {String}   

  * getByLastDepth(start,depth)   
    向前寻找目标深度的 cssList's item   
    @param {Number} start 起点   
    @param {Number} depth 目标 深度   
    @returns {Number} 返回目标的下标   
        
----
----
# DEF_CSSVEItem 类
一个 style 选择器和样式
  ### 构造函数 constructor(selectors,cssString,depth)
    @param {String[]} selectors 选择器的数组
    @param {String} cssString css 的内容 
    @param {Number} depth 深度
  ## DEF_CSSVEItem 属性   
  selectors {String[]} 选择器的数组   
  cssString {String} css 的内容    
  depth {Number} 深度   
  ## DEF_CSSVEItem 方法   
  * toString(_ctrlLibID,_that)   
    将对象渲染成css语句   
    @param {String} _ctrl_id   
    @param {CtrlLib} _that   
    @returns {String}   
----
----
