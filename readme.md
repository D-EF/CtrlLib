# 这个文档编写 CtrlLib 的 文档  
<!-- 最后编辑于 2021/03/09  -by Darth_Eternalfaith -->  
  
## CtrlLib 基类  
该基类包含 CtrlLib 的部分功能实现和声明虚方法  
原则上不允许直接使用这个类  
  
### CtrlLib 属性  
#### 静态属性  
* idIndex  {Number} 用于计算控件的id的属性, 不要在 addend 方法以外的地方修改它; 更不要把值改小   
#### 原型属性  
* childCtrlType *\{CtrlLib\}* 子控件类的集合 用于添加子控件  
#### 实例属性  
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

* createContent(surplusArgument)  **虚方法**   
  创建内容   
  需要把元素赋值到 this.rootNodes 上   
  
* callParent(_fnc,...surplusArgument)  
  呼叫父级控件  
  @param {Function} _fnc 执行的动作  
  @param {any} surplusArgument _fnc 执行的参数  
  
* callChild(childCtrlID,_fnc,surplusArgument) **虚方法**  
    呼叫子控件, 如果兄弟控件没有加载完成将会被挂起  
    @param {String} childCtrlID 控件 在父控件的父元素 的 ctrlID  
    @param {Function} _fnc 执行的动作  
    @param {any} surplusArgument _fnc 执行的参数  
    **这个方法在 ExCtrl 中有一个实现**  
  
* callBrother(childCtrlID,_fnc,...surplusArgument) **虚方法**  
    呼叫兄弟控件, 如果兄弟控件没有加载完成将会被挂起  
    @param {String} childCtrlID 控件 在父控件的父元素 的 ctrlID  
    @param {Function} _fnc 执行的动作  
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

## ExCtrl 类  **派生于 CtrlLib**  
  控件库派生类的基类,需要在派生时添加 **bluePrint** {DEF_VirtualElementList} 原型属性  
### ExCtrl 属性  
#### 静态属性  
* attrKeyStr   
  保存用于编辑 bluePrint 的 xml 的关键字

#### 原型属性  
#### 实例属性属性  
* dataLinks {{}} 用于登记模板字符串的属性  
### ExCtrl 方法  

### ExCtrl 编辑 bluePrint 的 XML

* 使用 模板字符串 在 内容 或者在 属性的 value 里使用 ${*表达式*} 即可食用。  
  表达式的this指针指向当前控件

*以下的 bluePrint 的关键字存在于 Exctrl.attrKeyStr中*
* 使用 循环生成子元素 在父元素中使用属性 "ctrl-for"  值为 for 的体   
  示例:   
  ``` XML
  <div ctrl-for="this.i=0;this.i<10;++this.i">
    <div> ${this.i} </div>
  </div>
  ```
  控制的值一定要写在 this 中，因为运行时的 初始化 和 判读体 和 回调 以及 内容 都是不同上下文的

* 为元素添加 dom 事件, 在元素中使用属性 pa-${actType}, 值为操作的 js 代码
  示例:
  ``` XML
    <div pa-click="console.log(this,tgt,e);"></div>
    <!-- 点击后会在控制台打印: 当前控件, 当前元素, 当前事件的 event 对象 -->
  ```   
  此处的 this 指针为控件, 如果需要用当前元素 应该使用 tgt    
  e 指向当前的 事件对象 

#### **特殊的 dom 事件**
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

