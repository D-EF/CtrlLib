# 这个文档编写 CtrlLib 的 文档
<!-- 最后编辑于 2021/03/09  -by Darth_Eternalfaith -->

## CtrlLib 基类
该基类包含 CtrlLib 的部分功能实现和声明虚函数
原则上不允许直接使用这个类

### CtrlLib 属性
* name  *String*
  并没有什么用的属性

* ctrlLibID *Number*
  用于区分所有控件的唯一id, 会在 new 一个 CtrlLib 或 它的派生类 时自增
  ` this.ctrlLibID=CtrlLib.idIndex++; `

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
  childCtrlActionList\[ctrlID\] *Array\< Function \>*
  被挂起的子控件动作
  因为子控件加载不一定是瞬间加载完成的(可能需要等待http请求完成后才能加载)
  所以动作会被挂起

### CtrlLib 原型属性
* childCtrlType \< Object \>
  子控件 类的集合

### CtrlLib 方法
* addend(_parentNode,...surplusArgument)
  将控件加入到指定的dom元素内
  @param {HTMLElement} _parentNode 指定的父dom元素
  @param surplusArgument 这些参数将会传递到 createContent 方法中

* callParent(_fnc,...surplusArgument)
  呼叫父级控件
  @param {Function} _fnc 执行的动作
  @param {any} surplusArgument _fnc 执行的参数

* callChild(childCtrlID,_fnc,surplusArgument) **虚函数**
    呼叫子控件, 如果兄弟控件没有加载完成将会被挂起
    @param {String} childCtrlID 控件 在父控件的父元素 的 ctrlID
    @param {Function} _fnc 执行的动作
    @param {any} surplusArgument _fnc 执行的参数
* 
* callBrother(childCtrlID,_fnc,...surplusArgument) **虚函数**
    呼叫兄弟控件, 如果兄弟控件没有加载完成将会被挂起
    @param {String} childCtrlID 控件 在父控件的父元素 的 ctrlID
    @param {Function} _fnc 执行的动作
    @param {any} surplusArgument _fnc 执行的参数
    