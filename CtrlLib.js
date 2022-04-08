/*
 * @Author: Darth_Eternalfaith
 * @LastEditTime: 2022-04-08 19:28:08
 * @LastEditors: Darth_Eternalfaith
 */
import {
    decodeHTML,
    templateStringRender,
    strToVar,
    requestAPI,
    Delegate
} from "../basics/Basics.js";
import {
    nodeListToArray,
    addKeyEvent,
    addResizeEvent,
} from "../basics/dom_tool.js";

/**
 * 用来保存蓝本的类
 */
class DEF_VirtualElementList{
    /**
     * @param {DEF_VirtualElement[]} ves 序列化的虚拟元素树
     * @param {Number} max_depth 最大深度
     * @param {DEF_CSSVE} style 样式元素
     */
    constructor(ves,max_depth,style){
        this.ves=ves;
        this.max_depth=max_depth;
        this.style=style;
    }
    /**
     * 根据 ves 的下标, 查找ctrl_id
     * @param {Number} index
     * @returns {String} ctrl_id
     */
    getCtrlIDByIndex(index){
        return this.ves[index].ctrl_id;
    }
    /**
     * 根据 ctrl_id 寻找 项 
     * @param {String} ctrl_id 
     * @returns {DEF_VirtualElement} 返回目标
     */
    getByCtrlID(ctrl_id){
        for(var i=this.ves.length-1;i>=0;--i){
            if(this.ves[i].ctrl_id===ctrl_id){
                return this.ves[i];
            }
        }
    }
    /**
     * 根据 ctrl_id 寻找 项 
     * @param {String} ctrl_id 
     * @returns {Number} 返回目标的下标
     */
    getIndexByCtrlID(ctrl_id){
        for(var i=this.ves.length-1;i>=0;--i){
            if(this.ves[i].ctrl_id===ctrl_id){
                return i;
            }
        }
    }
    /**
     * 向前寻找目标深度的 ves item
     * @param {Number} start 起点
     * @param {Number} depth 目标 深度
     * @param {Number} min   最小深度, 如果超过限制将返回最小深度的下标
     * @returns {Number} 返回目标的下标, 如果超过最小深度限制，将在返回中添加一个 flag=true 属性
     */
    getByLastDepth(start,depth,min=0){
        for(var i=start;i>=0;--i){
            if(this.ves[i].depth===depth){
                return i;
            }else if(this.ves[i].depth<=min){
                var rtn=new Number(i);
                rtn.flag=true;
                return rtn;
            }
        }
        console.warn("找不到目标深度的 ves's item");
        return;
    }
    /**
     * 获取子元素
     * @param {Number} vesindex ves的下标
     * @returns {{indexs:Number>,ves:Array<DEF_VirtualElement[],p:Number}}
     * @return {Number[]} indexs 在原蓝图中的下标集合
     * @return {DEF_VirtualElement[]} ves 子元素集合
     * @return {Number} p 下一个同级元素的下标
     */
    getChild(vesindex){
        var td=this.ves[vesindex].depth,
            p=vesindex;
        var rtnIndex=[],rtnObj=[];
        for(++p;this.ves[p]&&this.ves[p].depth>td;++p){
            if(this.ves[p].depth===td+1){    //子元素
                rtnIndex.push(p);
                rtnObj.push(this.ves[p]);
            }
        }
        return {indexs:rtnIndex,ves:rtnObj,p};
    }
    /**
     * 获取父元素
     * @param {Number} vesIndex 子元素在 ves 的下标
     * @returns {Number} 返回父元素的下标
     */
    getParent(vesIndex){
        var i;
        for(i=vesIndex;i>=0;--i){
            if(this.ves[vesIndex].depth>this.ves[i].depth){
                break;
            }
        }
        return i;
    }
    /**
     * 把xml转换成DEF_VirtualElementList
     * 注意， 当属性中使用了模板字符串时, 模板字符串中不要有和xml标签属性一样的引号, 不然可能会出错
     * @param {String} _xmlStr
     * @return {DEF_VirtualElementList} {ves:VirtualElement[],max_depth:Number}
     */
    static xmlToVE(_xmlStr){
        var xmlStr=_xmlStr.replace(/\ +/g," ").replace(/[\r\n]/g,"");//去除多余的空格和换行
            xmlStr=xmlStr.replace(/<!--(.|[\r\n])*?-->/,"");//去除注释
            xmlStr=xmlStr.replace(/<\?(.|[\r\n])*?\?>/,"");//去除头
        var strleng=xmlStr.length;
        var i,j,p,q,tempOP,tempED,depth=0,tempTagName,max_depth=0,tDepth=0,styleFlag=false;
        var lastStrP,strFlag=0;
        var ves=[],attributes=[],style=new DEF_CSSVE();
    
        for(i=0;i<strleng;++i){
            if(xmlStr[i]==='<'&&!strFlag){
                tempOP=i;
                attributes=[];
                for(j=tempOP+1;xmlStr[j]&&xmlStr[j]!=='>'&&xmlStr[j]!==" ";++j);
                tempTagName=xmlStr.slice(tempOP+1,j);
                for(j;xmlStr[j]!=='>';++j){      //属性
                    if(!strFlag){
                        if(xmlStr[j]===' '){
                            p=j+1;
                        }
                        else if(xmlStr[j]==='='){
                            q=j;
                        }
                        if(xmlStr[j]==="'"||xmlStr[j]==='"'){
                            strFlag=1;
                            lastStrP=j;
                        }
                    }else{
                        while(strFlag){
                            if(xmlStr[j]===xmlStr[lastStrP]&&xmlStr[j-1]!=='\\'){
                                strFlag=0;
                                // mark: 是否需要区分大小写
                                attributes.push({key:xmlStr.slice(p,q)/* .toLowerCase() */,value:xmlStr.slice(lastStrP+1,j)});
                                break;
                            }
                            ++j;
                        }
                    }
                }
                i=j;
            }
            if(xmlStr[i]==='>'&&!strFlag){
                if(xmlStr[tempOP+1]==='/'){  // 标签结束符号
                    if(tempTagName==="/style"||tempTagName==="/ctrlstyle"){
                        style.addString(xmlStr.slice(tempED+1,tempOP));
                        styleFlag=false;
                    }else{
                        // 把 一段文本 添加到上一个这么深的元素
                        for(j=ves.length-1;j>=0;--j){
                            if(ves[j].depth===depth){
                                ves[j].inner_end=xmlStr.slice(tempED+1,tempOP);
                                break;
                            }
                        }
                    }
                    tempED=i;
                    --depth;
                }
                else{
                ++depth;
                if(depth>max_depth)max_depth=depth;
                    if(styleFlag)continue;
                    if(tempTagName==="style"||tempTagName==="ctrlstyle"){
                        styleFlag=true;
                    }else{
                        var ve=new DEF_VirtualElement(tempTagName,depth,attributes,xmlStr.slice(tempED+1,tempOP));
                        ves.push(ve);
                    }
                    tempED=i;
                    if(xmlStr[i-1]==='/'||DEF_VirtualElementList.voidElementsTagName.includes(tempTagName)){
                        --depth;
                    }
                }
            }
        }
        if(depth){
            console.error("标签没有对应的 开始 结束; 深度:"+depth);
            // return;
        }

        // 将所有的元素 加上 ctrl_id
        var tempCountDepth=new Array(max_depth);
        for(i=max_depth-1;i>=0;--i){
            tempCountDepth[i]=0;
        }
        var pName;
        for(i=0;i<ves.length;++i){
            pName=ves[i].getAttribute("ctrl-id")||"";
            if(i>0&&ves[i].depth>ves[i-1].depth){
                tempCountDepth[ves[i].depth-1]=0
            }
            tempCountDepth[ves[i].depth-1]+=1;
            if(!pName){
                for(j=0;j<ves[i].depth;++j){
                    pName+=tempCountDepth[j]+(j===ves[i].depth-1?"":"_");
                }
            }
            ves[i].ctrl_id=pName;
            ves[i].setAttribute("ctrl-id",pName);
        }
        return new DEF_VirtualElementList(ves,max_depth,style);
    }
}
//所有无内容元素(短标签)的tag name

DEF_VirtualElementList.voidElementsTagName=["br","hr","img","input","link","meta","area","base","col","command","embed","keygen","param","source","track","wbr","?xml"];
/**
 * 作为虚拟元素树的叶子 供 htmlToControl 处理xml字符串
 * @param {String}  tag_name     标签名
 * @param {Number}  depth       深度
 * @param {Array}   attribute   标签的属性  [{key,val}]
 * @param {String}  before      在标签前的内容
 * @param {String}  inner_end    最后一段内容
 */
class DEF_VirtualElement{
    constructor(tag_name,depth,attribute,before,inner_end){
        this.tag_name=tag_name;
        this.depth=depth;
        this.attribute=[];
        for(var i=attribute.length-1;i>=0;--i){
            this.setAttribute(attribute[i].key,attribute[i].value);
        }
        this.before=before;
        this.inner_end=inner_end;
        this.ctrl_id;
    }
    /**
     * 存入属性
     * @param {String} key 属性的 key
     * @param {String} val 属性的 value
     * @return {Number} 1:join; 2:update
     */
    setAttribute(key,val){
        for(var i=this.attribute.length-1;i>=0;--i){
            if(key===this.attribute[i].key){
                this.attribute[i].value=val;
                return 2;
            }
        }
        this.attribute.push({key:key,value:val});
        return 1;
    }
    /**
     * 获取属性
     * @param {String} key 属性的 key
     * @return {String} 返回属性的 value
     */
    getAttribute(key){
        for(var i=this.attribute.length-1;i>=0;--i){
            if(key===this.attribute[i].key){
                return this.attribute[i].value;
            }
        }
        return;
    }
    /**
     * 用key的 before 或 after 获取属性
     * @param {String} before   key 的开头的字符串
     * @param {String} after    key 的结尾的字符串
     * @returns {Array} 返回 item 格式: {key:String, value:String}
     */
    getAttributesByKeyBA(before="",after=""){
        var rtn=[];
        for(var i=this.attribute.length-1;i>=0;--i){
            if((this.attribute[i].key.indexOf(before)===0)&&(this.attribute[i].key.lastIndexOf(after)===this.attribute[i].key.length-after.length)){
                rtn.push(this.attribute[i]);
            }
        }
        return rtn;
    }
}

/**
 * 给控件添加 style 样式标签
 */
class DEF_CSSVE{
    /**
     * @param {String} css_string css 格式的字符串
     */
    constructor(css_string){
        this.css_list=[];
        this.addString(css_string);
    }
    /**
     * @param {String} css_string css 格式的字符串
     */
    addString(css_string){
        if(!css_string) return;
        // p 右指针, q 左指针, d cssList的最后一个的下标
        var p,q,d,b,k,depth=0;
        var tempSelector,tempString;
        
        for(p=q=0;p<css_string.length;++p){
            // 跳过模板字符串的格式 ${x}
            while(css_string[p]==='{'&&css_string[p-1]==='$'){
                p=css_string.indexOf('}',p+1)+1;
            }
            if(css_string[p]==='{'){
                tempSelector=css_string.slice(q,p).split(',');
                d=this.css_list.push(new DEF_CSSVEItem(tempSelector,'',depth))-1;
                q=p+1;
                ++depth;
            }else if(css_string[p]==='}'){
                tempString=css_string.slice(q,p);
                if(!this.css_list[d].css_string){
                    this.css_list[d].css_string=tempString;
                }
                q=p+1;
                --depth;
            }
        }
    }
    /**
     * 创建 css 的文本
     * @param {Number} c__ctrl_lib_id 控件的id 而不是控件内元素的id
     * @param {CtrlLib} that
     * @returns {String}
     */
    createCssString(c__ctrl_lib_id,that){
        var strs=[],tempDepth=0;
        for(var i=0;i<this.css_list.length;++i){
            if(this.css_list[i].depth<tempDepth){
                strs.push('}');
            }
            strs.push(this.css_list[i].toString(c__ctrl_lib_id,that));

            tempDepth=this.css_list[i].depth+1;
        }
        do{
            strs.push('}');
        }while((--tempDepth)>0);
        return strs.join('');
    }
    /**
     * 向前寻找目标深度的 css_list's item
     * @param {Number} start 起点
     * @param {Number} depth 目标 深度
     * @returns {Number} 返回目标的下标
     */
    getByLastDepth(start,depth){
        for(var i=start;i>=0;--i){
            if(this.css_list[i].depth===depth)return i;
        }
        console.warn("找不到目标深度的 css_list's item");
        return;
    }
}

/**
 * 一个 style 选择器和样式
 */
class DEF_CSSVEItem{
    /**
     * @param {String[]} selectors 选择器的数组
     * @param {String} css_string css 的内容 
     * @param {Number} depth 深度
     */
    constructor(selectors,css_string,depth){
        this.selectors=selectors;
        this.css_string=css_string;
        this.depth=depth;
    }
    /**
     * 将对象渲染成css语句
     * @param {String} _ctrl_id
     * @param {CtrlLib} _that
     * @returns {String}
     */
    toString(c__ctrl_lib_id,_that){
        var rtn=[];
        var c__ctrl_lib_id=".CtrlLib-"+c__ctrl_lib_id+' ',
            that=(_that===undefined)?window:_that;
        for(var i=0;i<this.selectors.length;++i){
            if(i) rtn.push(',');
            rtn.push((this.selectors[i][0]==='@'?'':c__ctrl_lib_id)+templateStringRender((this.selectors[i]),that).str);
        }
        rtn.push('{');
        rtn.push(templateStringRender(this.css_string,that).str);

        // rtn.push('}');
        // 右花括号由 DEF_CSSVE 的 createCssString控制
        
        return rtn.join('');
    }
}

/**
 * 控件中的 表达式的 索引
 * @param {String} expression
 * @param {String} value
 * @param {Object{CtrlID,type}} link
 */
function DataLink(expression,value,link){
    this.expression=expression;
    this.expFnc=new Function(["tgt"],"return "+expression);
    this.value=value;
    this.link=[link];
    // link={
    //     ctrl_id:"id",
    //     type:"type"
    // }
}

/**
 * 控件的基类
 */
 class CtrlLib{
    /**
     * @param {Object} data
     */
    constructor(data){
        this.name;
        this.c__ctrl_lib_id=CtrlLib.idIndex++;
        this.data=data||{};
        this.root_nodes=[];
        this.parent_node;
        /** @type {CtrlLib} */
        this.parent_ctrl;
        this.child_ctrl={};
        this.elements={};
        /** 控件触发事件 
         * @type {Map<String,Delegate>}
        */
        this.ctrl_action_list=new Map();
        /** 子控件事件队列 */
        this.child_ctrl_action_list={};
    }
    /**
     * 将控件加入到指定的dom元素内
     * @param {Element} _parentNode 指定的父dom元素
     */
    addend(_parentNode,...surplusArgument){
        if(_parentNode){
            this.isready=true;
            if(this.initialize(...arguments)==="stop"){
                return;
            }
            this.parent_node=_parentNode;
            _parentNode.classList.add("CtrlLib-"+this.c__ctrl_lib_id);
            this.parent_node=_parentNode;
            if(!this.root_nodes.length)this.createContent(surplusArgument);
            var tempDocF=document.createDocumentFragment();
            for(var i=this.root_nodes.length-1;i>=0;--i){
                tempDocF.prepend(this.root_nodes[i]);
            }
            this.parent_node.appendChild(tempDocF);
            this.callback(...arguments);
            this.reRender_callback();
            this.touchCtrlAction("callback");
        }else{
            console.error('Fatal error! This Control have not parent_node!');
        }
    }
    /**
     * 将目标元素替换为控件 那个元素会从页面中清除
     * 绝大部分过程和addend相同
     * @param {Node} tgtNode 指定被替换的dom元素
     */
    possess(tgtNode,...surplusArgument){
        if(tgtNode){
            var parent_node=this.parent_node=tgtNode.parentNode;
            parent_node.classList.add("CtrlLib-"+this.c__ctrl_lib_id);
            if(!this.root_nodes.length)this.createContent(surplusArgument);
            var tempDocF=document.createDocumentFragment();
            for(var i=this.root_nodes.length-1;i>=0;--i){
                tempDocF.prepend(this.root_nodes[i]);
            }
            tgtNode.before(tempDocF);
            tgtNode.remove();
            this.callback(...arguments);
            this.reRender_callback();
            this.touchCtrlAction("callback");
        }
        else{
            console.error('Fatal error! This Control have not target!');
        }
    }
    /**
     * 呼叫父控件
     * @param {function(this:CtrlLib)} _fnc 执行的动作 _fnc.apply(this.parent_ctrl,surplusArgument);
     * @param {any} surplusArgument 参数
     */
    callParent(_fnc,...surplusArgument){
        if(this.parent_ctrl){
            _fnc.apply(this.parent_ctrl,surplusArgument);
        }else{
            console.error("这个控件没有父控件");
        }
    }
    /**
     * 呼叫子控件, 如果子控件没有加载完成将会被挂起
     * @param {String} childCtrlID 子控件 的父元素 的 ctrl_id
     * @param {function(this:CtrlLib)} _fnc 执行的动作
     * @param {any} surplusArgument 参数
     */
    callChild(childCtrlID,_fnc,surplusArgument){
        // 在派生类里实现
    }
    /**
     * 呼叫兄弟控件, 如果兄弟控件没有加载完成将会被挂起
     * @param {String} childCtrlID 控件 在父控件的父元素 的 ctrl_id
     * @param {function(this:CtrlLib)} _fnc 执行的动作
     * @param {any} surplusArgument 参数
     */
    callBrother(childCtrlID,_fnc,...surplusArgument){
        this.callParent(
            function(){
                this.callChild(childCtrlID,_fnc,...surplusArgument);
            }
        )
    }
    /**
     * addend刚开始执行的函数,
     * 能调用到 addend 的 argument
     * 通过返回字符串 "stop" 可以挂起 addend;
     * 当然你需要在这个方法中再使用addend
     */
    initialize(...argument){}
    /**
     * addend 后的回调
     * 能调用到 addend 的 argument
     */
    callback(...argument){}
    /** 创建内容
     * 需要把元素赋值到 this.root_nodes 上
     */
    createContent(surplusArgument){this.nodes=this.root_nodes=[document.createElement("div")]}
    /**
     * 重新渲染
     * 根据data渲染部分需要渲染的内容
     */
    reRender(){}
    /**
     * 重新渲染完成后的回调
     */
    reRender_callback(){}
    /**
     * 卸载控件
     */
    removeCtrl(){
        this.isready=false;
        for(var i in this.child_ctrl){
            this.child_ctrl[i].removeCtrl();
            delete this.child_ctrl[i];
        }
        for(var i in this.elements){
            this.elements[i].remove();
            delete this.elements[i];
        }
        for(var i in this.root_nodes){
            this.root_nodes[i].remove();
            delete this.root_nodes[i];
        }
        if(this.parent_node.classList)
        this.parent_node.classList.remove("CtrlLib-"+this.c__ctrl_lib_id);
        if(this.style_element){
            this.style_element.remove();
            delete this.style_element;
        }
    }
    /**
     * 触发控件控件事件的方法
     * @param {String} actionKey 事件的类型
     */
    touchCtrlAction(actionKey){
        var d=this.ctrl_action_list.get(actionKey);
        d&&d();
    }
    
    /**
     * 添加控件事件
     * @param {String} actionKey 事件的类型
     * @param {function(this:CtrlLib)} _fnc    事件的执行函数 将会以控件为 this 指针
     */
    addCtrlAction(actionKey,_fnc){
        var temp;
        if(!(temp=this.ctrl_action_list.get(actionKey))){
            // 没有这种类型的事件，将创建
            this.ctrl_action_list.set(actionKey,Delegate.create());
            temp=this.ctrl_action_list.get(actionKey)
        }
        temp.addAct(this,_fnc);
    }
}
CtrlLib.idIndex=zero;
/**
 * 子控件类
 */
CtrlLib.prototype.childCtrlType={};

/**
 * 自定义属性控制器
 */
class AttrKeyStrCtrl{
    /**
     * @param {function(String):(String[]|undefined)} ctrl_fnc    控制的函数 ctrl_fnc(String key) 应返回处理后的key值{String[]} 首项应为原始 key , 返回 undefined 将不会执行 act_fnc
     * @param {function(this:ExCtrl,Element[],String,DEF_VirtualElement[],Number,Number,*,String)} act_fnc     执行的函数 act_fnc
     * @param {Boolean} stop_flag    表示是否阻塞继续调用控制器, 默认为true阻塞
     * 注意，actFnc需要返回 跳过蓝图后的 目标索引
     */
    constructor(ctrl_fnc,act_fnc,stop_flag=true){
        this.ctrl_fnc=ctrl_fnc;
        /**
         * @type  {function(String)}
         * .call(ctrlLib,ctrlFucRtn,elements,ves,i,_attrVal,tname,forFlag)
         */
        this.act_fnc=act_fnc;
        // key,elements,ves,i,_attrVal,tname,k,forFlag
        this.stop_flag=stop_flag;
    }
    /**
     * 进行并且执行操作
     * @param {ExCtrl} ctrlLib ExCtrl实例
     * @param {Element[]} elements 实例的 elements 的引用，用于添加新的子元素
     * @param {String} tname 临时的元素名称，用作实例的 elements 当前的索引
     * @param {DEF_VirtualElement[]} ves DEF_VirtualElement 的数组
     * @param {Number} i 当前的ves的下标
     * @param {Number} k 经处理后的ves的下标
     * @param {Array} key 属性的key
     * @param {String} _attrVal 属性值
     * @param {String} forFlag 表示是不是 for 的
     * @returns {{stop_flag:Boolean,tgti:Number}}
     * stopFlag表示是否继续调用控制器
     */
    handle(ctrlLib,elements,tname,ves,i,k,key,_attrVal,forFlag){
        var ctrlFucRtn=this.ctrl_fnc(key);
        var tgti=k;
        if(ctrlFucRtn&&ctrlFucRtn.length){
            tgti=this.act_fnc&&this.act_fnc.call(ctrlLib,elements,tname,ves,i,k,ctrlFucRtn,_attrVal,forFlag);
            if((tgti===undefined)||tgti<k){
                tgti=k
            }
            return {stop_flag:this.stop_flag,tgti:tgti};
        }
        else{
            return {stop_flag:false,tgti:tgti};
        }
    }
}
/**
 * 使用正则表达式 的 属性控制器
 */
class AttrKeyStrCtrl__Ex extends AttrKeyStrCtrl{
    /**
     * @param {RegExp} regexp       属性正则表达式 如果可匹配 将 执行 actFnc
     * @param {function(this:ExCtrl,Element[],String,DEF_VirtualElement[],Number,Number,*,String)} act_fnc     执行的函数 act_fnc
     */
     constructor(regexp,act_fnc){
        super(regexp,act_fnc);
        /**
         * @param {String} str 
         */
        this.ctrl_fnc=function(str){
            return regexp.exec(str);
        }
        this.act_fnc=act_fnc;
    }
}

class AttrKeyStrCtrlList{
    /**
     * 
     * @param {AttrKeyStrCtrl[]} list 控制器的数组
     */
    constructor(list){
        this.list=list||[];
    }
    /**
     * 添加控制器
     * @param {AttrKeyStrCtrl} _attrKeyStrCtrl 
     */
    push(_attrKeyStrCtrl){
        this.list.push(_attrKeyStrCtrl);
    }
    /**
     * 克隆一个派生, 是浅拷贝
     * @returns {AttrKeyStrCtrlList}
     */
    clone(){
        return new AttrKeyStrCtrlList([].concat(this.list));
    }
    /**
     * 进行并且执行操作
     * @param {ExCtrl} ctrlLib ExCtrl实例
     * @param {Element[]} elements 实例的 elements 的引用，用于添加新的子元素
     * @param {String} tname 临时的元素名称，用作实例的 elements 当前的索引
     * @param {DEF_VirtualElement[]} ves DEF_VirtualElement 的数组
     * @param {Number} i 当前的ves的下标
     * @param {String} key 属性的key
     * @param {String} _attrVal 属性值
     * @param {String} forFlag 表示是不是 for 的
     * @returns {Number} 返回执行完成后的重新定位的ves下标
     */
    handle(ctrlLib,elements,tname,ves,i,k,key,_attrVal,forFlag){
        var tgti=k,temp;
        for(var j=this.list.length-1;j>=0;--j){
            temp=this.list[j].handle(ctrlLib,elements,tname,ves,i,k,key,_attrVal,forFlag);
            tgti=temp.tgti
            if(temp.stop_flag){
                return tgti;
            }
        }
        return tgti;
    }
}
/**
 * 控件库派生类的基类,需要在派生时添加 bluePrint {DEF_VirtualElementList} 属性
 */
class ExCtrl extends CtrlLib{
    constructor(data){
        super(data);
        this.dataLinks={};
        /** 规定模板字符串能否为 html, 如果启用, 就别在 ctrl-if 的前面放模板字符串，否则可能会导致 ctrl-if 的渲染出错*/
        this.template_string_can_be_HTML=false;
    }
    /**
     * 呼叫子控件, 如果子控件没有加载完成将会被挂起
     * @param {String} childCtrlID  子控件 在父控件的父元素 的 ctrl_id
     * @param {function(this:ExCtrl,ExCtrl)} _fnc       需要执行的方法
     * @param {Any} surplusArgument 尽量别用, 挂起的时候用不了
     */
    callChild(childCtrlID,_fnc,...surplusArgument){
        var c=this.bluePrint.getByCtrlID(childCtrlID);
        if(c===undefined){
            console.error("没有对应的子元素");
            return;
        }else if(!c.getAttribute(ExCtrl.attrKeyStr.child_ctrl)){
            console.error("该子元素没有子控件");
            return;
        }else{
            // 有子控件
            if(this.child_ctrl[childCtrlID]){
                // 子控件已加载, 直接执行
                _fnc.apply(this.child_ctrl[childCtrlID],[this,...surplusArgument])
            }else{
                // 子控件未加载完成, 挂起
                if(this.child_ctrl_action_list[childCtrlID]===undefined)this.child_ctrl_action_list[childCtrlID]=[];
                this.child_ctrl_action_list[childCtrlID].push(_fnc);
            }
        }
    }
    addend(_parentNode,...surplusArgument){
        CtrlLib.prototype.addend.call(this,_parentNode,...surplusArgument);
        this.renderString();
        this.renderStyle();
    }
    createContent(){
        var temp=this.itemVEToElement(this.bluePrint.ves);
        this.elements=temp.elements;
        this.root_nodes=nodeListToArray(temp.fragment.childNodes);
        if(this.bluePrint.style.css_list.length){
            this.style_element=document.createElement("style");
            document.head.appendChild(this.style_element);
        }
    }
    /**
     * 通过 ctrl_id 获取元素
     * @param {String} ctrl_id
     * @returns {Element[]} 返回元素 包括ctrl-for 的
     */
    getElementsByCtrlID(ctrl_id){
        var rtn=[];
        for(var i in this.elements){
            if(i.indexOf(ctrl_id)===0){
                rtn.push(i);
            }
        }
        return rtn;
    }

    /**
     * 请求 api 并用json反序列化
     * @param {String} method 请求的方式
     * @param {String} url  请求的地址
     * @param {function(this:XMLHttpRequest,Object)} callback 请求完成后的回调  callback.call(Response,data);
     * @param {Any} body post 请求的参数
     */
    static getJsonData(method,url,callback,body){
        requestAPI(method,url,
            function(){
                var data=JSON.parse(this.response);
                callback.call(this,data);
            },
            body);
    }
    /**
     * 控制标签的属性
     * @param {String} key 属性的key
     * @param {Element[]} elements 实例的 elements 的引用，用于添加新的子元素
     * @param {DEF_VirtualElement[]} ves DEF_VirtualElement 的数组
     * @param {Number} i 当前的ves的下标
     * @param {String} _attrVal 属性值
     * @param {String} tname 临时的元素名称，用作实例的 elements 当前的索引
     * @param {String} forFlag 表示是不是 for 的
     * @returns {Number} 返回运算完成后的ves下标
     */
    attrHandle(key,elements,ves,i,k,_attrVal,tname,forFlag){
        var tgt=elements[tname],k=k;

        var attrVal=this.stringRender(decodeHTML(_attrVal),tname,"attr",0,key,tgt);

        // that=this;
        var k=this.attrKeyStrCtrls.handle(this,elements,tname,ves,i,k,key,attrVal,forFlag);
        return k;
    }
    attrHandleR(ctrlid){
        // todo 
    }
    /**
     * 渲染 模板字符 内容
     * @param {String} str  write TemplateKeyStr
     * @param {String} ctrl_id    登记 ID       
     * @param {String} type      登记 类型  
     * @param {Boolean} ishtml   控制返回值, 默认将返回字符串 ，非0 将返回 DocumentFragment
     * @param {String[]} attrkey   如果是登记的 标签的属性值 这个是属性的 key
     * @param {Element} tgt 
     * @return {String||DocumentFragment} 字符串 或 包含内容的文档片段
     */
    stringRender(str,ctrl_id,type,ishtml,attrkey,tgt){
        var tgt=tgt;
        var temp=templateStringRender(str,this,[tgt]);
        var fragment=document.createDocumentFragment(),tempElement=document.createElement("div");
        if(temp.hit.length 
            && ctrl_id&&ctrl_id.indexOf("-EX_for-")===-1
            ){
            // 有模版字符串,添加一条datalink
            for(var i=temp.hit.length-1;i>=0;--i){
                if(this.dataLinks[temp.hit[i].expression]){
                    var f=1;
                    for(var j=this.dataLinks[temp.hit[i].expression].length-1;(j>=0)&&(f);--j){
                        if(this.dataLinks[temp.hit[i].expression].link[j].ctrl_id===ctrl_id&&
                            this.dataLinks[temp.hit[i].expression].link[j].type===type){
                            f=0;
                            break;
                        }
                    }
                    if(!f){
                        // 有被登记过的元素
                        if(type==="attr"&&attrkey)
                        this.dataLinks[temp.hit[i].expression].link.push({ctrl_id:ctrl_id,type:type,attrkey:attrkey});
                    }else{
                        // 未被登记过的元素
                        if(type==="attr"&&attrkey){
                            this.dataLinks[temp.hit[i].expression].link.push({ctrl_id:ctrl_id,type:type,attrkey:attrkey});
                        }else{
                            this.dataLinks[temp.hit[i].expression].link.push({ctrl_id:ctrl_id,type:type});
                        }
                    }
                    this.dataLinks[temp.hit[i].expression].value=temp.hit[i].value;
                    // else continue;
                }
                else{
                    this.dataLinks[temp.hit[i].expression]=new DataLink(temp.hit[i].expression,temp.hit[i].value,{ctrl_id:ctrl_id,type:type});
                    if(type==="attr"&&attrkey){
                        this.dataLinks[temp.hit[i].expression].link[0].attrkey=attrkey;
                    }
                }
            }
        }
        
        if(ishtml){
            // 将字符串转成 node 并且输入到 fragment
            tempElement.innerHTML=temp.str;
            var p=tempElement.childNodes.length;
            for(--p;p>=0;--p){
                fragment.prepend(tempElement.childNodes[p]);
            }
            return fragment;
        }
        else{
            return temp.str;
        }
    }
    /**
     * 渲染for
     * @param {Element[]}   elements    
     * @param {DEF_VirtualElement[]}   ves         DEF_VirtualElement list
     * @param {Number}  i           当前的ves的索引
     * @param {String}  forStr      属性内容
     * @param {String}  tname       elements的索引
     * @returns {Number} 返回跳过子元素的索引
     */
    renderFor(elements,ves,i,forStr,tname){
        var k=i,p,temp,l,ioffset=ioffset||0;
        var fillInner;
        var tgt=this.elements[ves[i].ctrl_id];
        var for1Fun=new Function(["tgt"],forStr.slice(0,forStr.indexOf(';'))),
            for2Fun=new Function(["tgt"],"return "+forStr.slice(forStr.indexOf(';')+1,forStr.lastIndexOf(';'))),
            for3Fun=new Function(["tgt"],forStr.slice(forStr.lastIndexOf(';')+1));
        // k=循环后遇到的元素的下标
        for(k=i+1;k<ves.length&&ves[k].depth>ves[i].depth;++k);
        fillInner=ves.slice(i+1,k);
        for(for1Fun.call(this,tgt),l=1;for2Fun.call(this,tgt);++l,for3Fun.call(this,tgt)){
            //递归得到循环内部的元素
            temp=this.itemVEToElement(fillInner,"-EX_for-"+tname+"-C"+l,true);
            elements[tname].appendChild(temp.fragment);
            Object.assign(elements,temp.elements);
        }
        return k-1;
    }
    /**
     * 用于控制元素是否出现
     * @param {Element[]}   elements    
     * @param {DEF_VirtualElement[]}   ves         DEF_VirtualElement list
     * @param {Number}  i           当前的ves的索引
     * @param {String}  attrVal     属性内容
     * @param {String}  tname       elements的索引
     * @returns {Number} 返回跳过子元素的索引
     */
    ctrlIf(elements,ves,i,attrVal,tname){
        if(!eval(attrVal)){
            var k;
            for(k=i+1;k<ves.length&&ves[k].depth>ves[i].depth;++k);
            elements[tname].hidden=1;
            // return k-1; 跳过内部的渲染
            return k-1;
        }
        else{
            elements[tname].hidden=0;
            return i;
        }
    }
    /**
     * 渲染子控件
     * @param {Element} element         加载子控件的元素
     * @param {DEF_VirtualElement} ve   子控件的虚拟元素
     * @param {String} childCtrlType    控件的类型
     */
    renderChildCtrl(element,ve,childCtrlType){
        var dataStr=ve.getAttribute(ExCtrl.attrKeyStr.childCtrl_arguments);
        var chcoArray=ve.getAttributesByKeyBA(ExCtrl.attrKeyStr.childCtrlOptionBefore);
        var i;
        for(i=chcoArray.length-1;i>=0;--i){
            // 渲染 childCtrlOption (子控件属性) 的模板字符串
            chcoArray[i].value=templateStringRender(chcoArray[i].value,this).str;
        }
        var that=this,temp,
        getDataCallback=function (){
            if(!(that.isready))return;
            var child_ctrl=new that.childCtrlType[childCtrlType](...arguments);
            for(var i=chcoArray.length-1;i>=0;--i){
                // 加入 childCtrlOption (子控件属性)
                child_ctrl[chcoArray[i].key]=strToVar(chcoArray[i].value);
            }
            that.child_ctrl[element.ctrl_id]=child_ctrl;
            that.child_ctrl[element.ctrl_id].parent_ctrl=that;

            if(that.child_ctrl_action_list[element.ctrl_id]){
                // 执行被挂起的动作
                var l=that.child_ctrl_action_list[element.ctrl_id].length;
                for(var i=0;i<l;++i){
                    that.child_ctrl_action_list[element.ctrl_id][i].apply(that.child_ctrl[element.ctrl_id],that.child_ctrl[element.ctrl_id]);
                }
                delete that.child_ctrl_action_list[element.ctrl_id];
            }

            child_ctrl.addend(element);
            return child_ctrl;
        }
        if(!dataStr){
            getDataCallback.call(this);
            return;
        }
        else{
            temp=(new Function("return ["+dataStr+"];")).call(this);
            getDataCallback.apply(this,temp);
        }
    }
    /**
     * 把 ve 转换成 js 的 Element 对象;
     * @param   {DEF_VirtualElement[]} ves   DEF_VirtualElement list
     * @param   {String}     _nameEX    用来添加命名的
     * @return  {Object{elements:{},fragment:DocumentFragment}}
     */
    itemVEToElement(ves,_nameEX,forFlag){
        var elements={},
            rtnFragment=document.createDocumentFragment(),
            i,j,k,minD=Infinity,
            dHash=new Array(ves.length),
            dg=[],
            nameEX=_nameEX||"",
            tname,
            tempNode,
            ifFlag;
        for(i=0;i<ves.length;i=k,++i){
            dg[ves[i].depth]=i;
            ifFlag=true;
            k=i;
            tname=ves[i].ctrl_id+nameEX;
            elements[tname]=document.createElement(ves[i].tag_name);
            elements[tname].ctrl_id=tname;
            for(j=ves[i].attribute.length-1;j>=0;--j){
                k=this.attrHandle(ves[i].attribute[j].key,elements,ves,i,k,ves[i].attribute[j].value,tname,k,forFlag);
            }
            tname=ves[i].ctrl_id+nameEX;
            if(dHash[ves[i].depth-1]){ //如果存在上一层
                tempNode=this.stringRender(ves[i].before,tname,"before",this.template_string_can_be_HTML,forFlag,dHash[ves[i].depth-1]);
                if(tempNode.constructor===String)tempNode=new Text(tempNode);
                dHash[ves[i].depth-1].appendChild(tempNode);
                if(!elements[tname].hidden)dHash[ves[i].depth-1].appendChild(elements[tname]);
            }
            if(!ves[i+1]||ves[i+1].depth<ves[i].depth){// 如果下一个不存在或下一个比这个浅
                var ti=i,tnd=ves[i+1]?ves[i+1].depth:0;
                //tnd : 下一个元素的深度
                do{
                    if(ves[ti].inner_end){
                        tempNode=this.stringRender(ves[ti].inner_end,ves[ti].ctrl_id+nameEX,"inner_end",this.template_string_can_be_HTML,forFlag,elements[ves[ti].ctrl_id+nameEX]);
                        if(tempNode.constructor===String)tempNode=new Text(tempNode);
                        if(!tempNode){
                            console.wran(tempNode);
                        }
                        elements[ves[ti].ctrl_id+nameEX].appendChild(tempNode);
                        elements[ves[ti].ctrl_id+nameEX].innerIsRender=true;
                    }
                    if(this.c__ctrl_lib_id,ves[i].inner_end==='fuck'){
                        console.log(!ves[ti]);
                    }
                    ti=dg[ves[ti].depth-1];
                }while((ves[ti])&&(ves[ti].depth>=tnd)&&(ves[ti].depth<ves[i].depth));
                if(ves[i].inner_end){
                    tempNode=this.stringRender(ves[i].inner_end,tname,"inner_end",this.template_string_can_be_HTML,forFlag,elements[tname]);
                    if(tempNode.constructor===String)tempNode=new Text(tempNode);
                    if(elements[tname]&&(!elements[tname].innerIsRender)){
                        elements[tname].appendChild(tempNode);
                    }
                }
            }else if(ves[i+1].depth===ves[i].depth){ // 如果下一个和这个的深度相同
                if(ves[i].inner_end){
                    tempNode=this.stringRender(ves[i].inner_end,tname,"inner_end",this.template_string_can_be_HTML,forFlag,elements[tname]);
                    if(tempNode.constructor===String)tempNode=new Text(tempNode);
                    elements[tname].appendChild(tempNode);
                }
            }

            dHash[ves[i].depth]=elements[tname];

            if(ves[i].depth<minD){// 刷新最小深度
                minD=ves[i].depth;
                rtnFragment=document.createDocumentFragment();
                tempNode=this.stringRender(ves[i].before,tname,"before",this.template_string_can_be_HTML,forFlag,rtnFragment);
                if(tempNode.constructor===String)tempNode=new Text(tempNode);
                rtnFragment.appendChild(tempNode);
                if(!elements[tname].hidden)rtnFragment.appendChild(elements[tname]);//添加到root
            }else{
                if(ves[i].depth===minD){
                    tempNode=this.stringRender(ves[i].before,tname,"before",this.template_string_can_be_HTML,forFlag,rtnFragment)
                    if(tempNode.constructor===String)tempNode=new Text(tempNode);
                    rtnFragment.appendChild(tempNode);
                    if(!elements[tname].hidden)rtnFragment.appendChild(elements[tname]);
                }
            }
        }

        return {elements:elements,fragment:rtnFragment};
    }
    /**
     * 重新渲染模板字符串内容
     */
    renderString(){
        var i,j,tempFootprint={},tid,ttype;
        //  重新渲染 stringRender 的
        for(i in this.dataLinks){
            for(j=this.dataLinks[i].link.length-1;j>=0;--j){
                // todo : 如果在模板文本里有会修改数据的表达式 
                tid=this.dataLinks[i].link[j].ctrl_id;
                if(this.dataLinks[i].value===this.dataLinks[i].expFnc.call(this,this.elements[tid]))
                continue;
                for(j=this.dataLinks[i].link.length-1;j>=0;--j){
                    tid=this.dataLinks[i].link[j].ctrl_id;
                    ttype=this.dataLinks[i].link[j].type;
                    if(!tempFootprint[tid+"-"+ttype]){
                        tempFootprint[tid+"-"+ttype]=1;
                        this["renderCtrl_"+ttype](tid,this.dataLinks[i].link[j].attrkey);
                    }
                }
                break;
            }
        }
    }
    /**
     * 根据依赖项重新渲染所有内容 仅有在 stringRender 中登记过才能使用
     */
    reRender(){
        var i,j,tempFootprint={},tid,ttype;
        var bluePrint=this.bluePrint;
        var elementCtrlIDs=Object.keys(this.elements);
        var tgtElem;

        // 清除循环填充的东西
        for(i=elementCtrlIDs.length-1;i>=0;--i){
            if(elementCtrlIDs[i].indexOf("-EX_for-")!==-1){
                this.elements[elementCtrlIDs[i]].remove();
                delete this.elements[elementCtrlIDs[i]];
                if(this.child_ctrl[elementCtrlIDs[i]]){
                    delete this.child_ctrl[elementCtrlIDs[i]];
                }
            }
        }
        //  重新渲染 stringRender 的
        for(i in this.dataLinks){
            for(j=this.dataLinks[i].link.length-1;j>=0;--j){
                // todo : 如果在模板文本里有会修改数据的表达式 
                tid=this.dataLinks[i].link[j].ctrl_id;
                if(this.dataLinks[i].value===this.dataLinks[i].expFnc.call(this,this.elements[tid]))
                continue;
                ttype=this.dataLinks[i].link[j].type;
                for(j=this.dataLinks[i].link.length-1;j>=0;--j){
                    tid=this.dataLinks[i].link[j].ctrl_id;
                    ttype=this.dataLinks[i].link[j].type;
                    if(!tempFootprint[tid+"-"+ttype]){
                        tempFootprint[tid+"-"+ttype]=1;
                        this["renderCtrl_"+ttype](tid,this.dataLinks[i].link[j].attrkey);
                    }
                }
                break;
            }
        }
        // 重新渲染 ctrl-attr 内容
        for(i=0;i<bluePrint.ves.length;++i){
            var tempVE=bluePrint.ves[i],attrKey;
                tgtElem=this.elements[tempVE.ctrl_id];
            if(tgtElem===undefined){
                continue;
            }
            for(j=tempVE.attribute.length-1;j>=0;--j){
                attrKey=tempVE.attribute[j].key;
                if(this.reRenderAttrCtrl[attrKey]){
                    this.reRenderAttrCtrl[attrKey].call(this,bluePrint,tgtElem);
                }
            }
        }
        // 重新渲染style标签
        this.renderStyle();
        this.reRender_callback();
        this.touchCtrlAction("render");
    }
    // render 的 方法集; 给 stringRender 处理的内容
    // 
    /**
     * 重新渲染模板字符串内容: 加在元素前面的东西
     * @param {String} 目标的 ctrl_id
     */
    renderCtrl_before(ctrl_id){
        var tgtElement=this.elements[ctrl_id];
        var thisVe=this.bluePrint.getByCtrlID(ctrl_id);
        var tempNode=this.stringRender(thisVe.before,ctrl_id,"before",this.template_string_can_be_HTML);
        if(tempNode.constructor===String) tempNode=new Text(tempNode);
        do{
            tgtElement.previousSibling.remove();
        }while(!(tgtElement.previousSibling.ctrl_id));
        this.elements[ctrl_id].before(tempNode);
    }
    
    /**
     * 重新渲染模板字符串内容: 加在元素末尾的内容
     * @param {String} 目标的 ctrl_id
     */
    renderCtrl_inner_end(ctrl_id){
        var tgtElement=this.elements[ctrl_id];
        var thisVe=this.bluePrint.getByCtrlID(ctrl_id);
        var tempNode=this.stringRender(thisVe.inner_end,ctrl_id,"before",this.template_string_can_be_HTML);
        if(tempNode.constructor===String) tempNode=new Text(tempNode);
        do{
            tgtElement.childNodes[tgtElement.childNodes.length-1].remove();
        }while(tgtElement.childNodes[tgtElement.childNodes.length-1]&&!tgtElement.childNodes[tgtElement.childNodes.length-1].ctrl_id);
        this.elements[ctrl_id].appendChild(tempNode);
    }
    /**
     * 重新渲染模板字符串内容: 元素 的 属性
     * @param {String} 目标的 ctrl_id
     * @param {String} 目标的属性的 key 
     */
    renderCtrl_attr(ctrl_id,attrkey){
        var tgtElement=this.elements[ctrl_id];
        var thisVE=this.bluePrint.getByCtrlID(ctrl_id);
        this.elements[ctrl_id].setAttribute(attrkey,this.stringRender(thisVE.getAttribute(attrkey),ctrl_id,"attr",0,attrkey,tgtElement));
    }
    /**
     * 渲染styleElement内容
     */
    renderStyle(){
        if(!this.style_element) return;
        var style_element=this.style_element;
        style_element.innerHTML=this.bluePrint.style.createCssString(this.c__ctrl_lib_id,this);
    }
    /**
     * 根据html代码, 创建一个 CtrlLib 的派生类
     * @param {String} htmlStr html代码
     * @param {Object} _prototype 追加到派生控件的原型链
     * @returns {class} 返回一个 ExCtrl 的 派生类
     */
    static xmlToCtrl(htmlStr,_prototype){
        class xmlEXCtrl extends ExCtrl{
        }
        if(_prototype)Object.assign(xmlEXCtrl.prototype,_prototype);
        xmlEXCtrl.prototype.bluePrint=DEF_VirtualElementList.xmlToVE(htmlStr);
        return xmlEXCtrl;
    }
}

/** @type {{key:CtrlLib}} 子控件集合*/
ExCtrl.prototype.childCtrlType;
/** @type {DEF_VirtualElementList} 原型属性, 用于创建html的蓝本 bluePrint*/
ExCtrl.prototype.bluePrint;
/**
 * 标签的属性的 保留关键字
 */
ExCtrl.attrKeyStr={
    ctrl_id:"ctrl-id",
    if:"ctrl-if",
    for:"ctrl-for",
    child_ctrl:"ctrl-child_ctrl",
    childCtrl_arguments:"ctrl-child_ctrl_arguments", //子控件构造函数的实参
    childCtrlOptionBefore:"chco-",   //  给子控件添加控件属性
    proxyEventBefore:"pa-",
    ctrlEventBefore:"ca-",
    // element resize 
    proxyResizeEvent:"pa-resize",
    // 按下按键事件 (组合键)
    keyDownEventBefore:"pa-keydown[",
    keyDownEventCilpKey:",",
    keyDownEventAfter:"]",
    // 抬起按键事件
    keyUpEventBefore:"pa-keyup[",
    keyUpEventCilpKey:",",
    keyUpEventAfter:"]",
}
/**
 * 预设的 自定义属性控制器集合
 */
ExCtrl.attrKeyStrCtrls=[
    new AttrKeyStrCtrl(function(key){return key},
    function(elements,tname,ves,i,k,key,attrVal,forFlag){
        elements[tname].setAttribute(key,attrVal);
    }),
    new AttrKeyStrCtrl__Ex(/^ctrl-id$/,nullfnc),  //ctrl_id 无操作
    new AttrKeyStrCtrl__Ex(/^ctrl-style$/,function(elements,tname,ves,i,k,key,attrVal,forFlag){
        /** @type {HTMLElement} */
        var d=elements[tname];
        d.style.cssText+=attrVal;
    }),
    new AttrKeyStrCtrl__Ex(/^api-attr-(.+)$/,function(elements,tname,ves,i,k,key,attrVal,forFlag){
        /** @type {HTMLElement} */
        var d=elements[tname];
        d[key[1]]=(new Function(['tgt'],"return "+attrVal)).call(this,d);
    }),
    // 循环填充数据
    new AttrKeyStrCtrl__Ex(/^ctrl-for$/,
        function(elements,tname,ves,i,k,key,attrVal,forFlag){
            var k=i;
            k=this.renderFor(elements,ves,i,attrVal,tname,forFlag);
            elements[tname].forVesOP=i;
            elements[tname].forVesED=k;
            return k;
        }
    ),
    // 生成子控件 
    new AttrKeyStrCtrl__Ex(/^ctrl-child_ctrl$/,
        function(elements,tname,ves,i,k,key,attrVal,forFlag){
            this.renderChildCtrl(elements[ves[i].ctrl_id],ves[i],attrVal);
        }
    ),
    // 生成子控件时的构造函数的参数的表达式 在生成子控件时实现, 此处不操作
    new AttrKeyStrCtrl__Ex(/^ctrl-child_ctrl_arguments$/), 
    // dom 绑定事件
    new AttrKeyStrCtrl__Ex(/^pa-(.+)$/,
    function(elements,tname,ves,i,k,key,attrVal,forFlag){
        var temp=key[1],that=this;
        elements[tname].addEventListener(temp,function(e){
            (new Function(["e","tgt"],attrVal)).call(that,e,this);
        });
    }),
    // 添加控件事件
    new AttrKeyStrCtrl__Ex(/^ca-(.+)$/,
    function(elements,tname,ves,i,k,key,attrVal,forFlag){
        var tgt=elements[tname];
        var that=this;
        this.addCtrlAction(key[1],
            function(e){
                (new Function(["e","tgt"],attrVal)).call(that,e,tgt);
            }
        );
    }),
    // element resize 
    new AttrKeyStrCtrl__Ex(/^pa-resize$/,
        function(elements,tname,ves,i,k,key,attrVal,forFlag){
        var tgt=elements[tname];
        var eventFnc=new Function(['e',"tgt",],attrVal),that=this;
        addResizeEvent(tgt,function(e){
            eventFnc.call(that,e,tgt);
        });
        this.addCtrlAction("callback",function(){addResizeEvent.reResize(tgt)});
    }),
    // 按下按键事件 (组合键)
    new AttrKeyStrCtrl__Ex(/^pa-keydown\[(.+)\]$/,
    function(elements,tname,ves,i,k,key,attrVal,forFlag){
        var that=this,tgt=elements[tname];
        var eventFnc=new Function(['e',"tgt",],attrVal);
        addKeyEvent(tgt,true,1,key[1].split(','),
            function(e){
                eventFnc.call(that,e,this)
            },false);
    }),
    // 抬起按键事件
    new AttrKeyStrCtrl__Ex(/^pa-keyup\[(.+)\]$/,
    function(elements,tname,ves,i,k,key,attrVal,forFlag){
        var that=this;
        var eventFnc=new Function(['e',"tgt",],attrVal);
        addKeyEvent(tgt,true,key.slice(1),1,
            function(e){
                eventFnc.call(that,e,this)
            },true);
    }),
    new AttrKeyStrCtrl__Ex(/^ctrl-if$/,
        function(elements,tname,ves,i,k,key,attrVal,forFlag){
        return this.ctrlIf(elements,ves,i,attrVal,tname,forFlag);
    })
]

/**
 * render 的 方法集; 给影响自身内部的属性 "ctrl-for" "ctrl-if" 等
 */
ExCtrl.prototype.reRenderAttrCtrl={
    /**
     * @param {DEF_VirtualElementList} bluePrint
     * @param {Element} tgtElem
     */
    "ctrl-for":function(bluePrint,tgtElem){
        var id=tgtElem.ctrl_id,ti=bluePrint.getIndexByCtrlID(tgtElem.ctrl_id);
        while(ti){
            ti=bluePrint.getParent(ti);
            if(bluePrint.ves[ti].getAttribute(ExCtrl.attrKeyStr.if)&&this.elements[bluePrint.ves[ti].ctrl_id].ifFlag){
                this.elements[bluePrint.ves[ti].ctrl_id].ifFlag=false;
                // 因为ctrl-if 会重新渲染，所以跳过
                return;
            }
        }

        ti=bluePrint.getIndexByCtrlID(tgtElem.ctrl_id);
        var tempVEs=bluePrint.getChild(ti);
        var tempElements=this.itemVEToElement(bluePrint.ves.slice(ti,tempVEs.p));
        Object.assign(this.elements,tempElements.elements);
        tgtElem.before(tempElements.fragment);
        tgtElem.remove();
    },
    /**
     * @param {DEF_VirtualElementList} bluePrint
     * @param {Element} tgtElem
     */
    "ctrl-if":function(bluePrint,tgtElem){
        var tgtCtrlID=tgtElem.ctrl_id;
        var tp=bluePrint.getIndexByCtrlID(tgtCtrlID);
        if((new Function(["tgt"],"return ("+bluePrint.getByCtrlID(tgtCtrlID).getAttribute("ctrl-if")+")")).call(this,tgtElem)){
            // 先找到要插入的位置
            var ti=bluePrint.getParent(tp);
            var cni=0;  // childNodes index
            var brother=bluePrint.getChild(ti);
            if(bluePrint.ves[ti].getAttribute(ExCtrl.attrKeyStr.proxyResizeEvent)){
                // 父元素有 resize 属性 cni 后移 2
                cni+=2;
            }
            var tgtI=brother.indexs.indexOf(tp);
            if(tgtI>=0){
                // cni 后移当前元素的前驱元素*2
                cni+=tgtI*2;
                for(var i=0;i<tgtI;++i){
                    if(brother.ves[i].ctrlIfHidden){
                        // 如果前驱元素因为 没能渲染, cni前移1
                        cni-=1;
                    }
                    if(!brother.ves[i].before){
                        // 如果前驱元素的 before 为空, cni前移1
                        cni-=1;
                    }
                }
            }
            if(bluePrint.ves[tp].before){
                cni+=1;
            }
            var pNode=this.elements[this.bluePrint.ves[ti].ctrl_id];
            var bortherNodes=pNode.childNodes;
            var tempVEs=bluePrint.getChild(tp);
            if(tgtElem.children.length<tempVEs.ves.length)
            {
                // 重新渲染
                var tempElements=this.itemVEToElement(bluePrint.ves.slice(tp,tempVEs.p));
                Object.assign(this.elements,tempElements.elements);
                this.elements[tgtCtrlID].ifFlag=true;
            }
            // 插入目标
            if(cni<bortherNodes.length){
                if(cni<=0){
                    if(bortherNodes.length){
                        bortherNodes[0].before(this.elements[tgtCtrlID]);
                    }else{
                        pNode.appendChild(this.elements[tgtCtrlID]);
                    }
                }else{
                    bortherNodes[cni].before(this.elements[tgtCtrlID]);
                }
            }else{
                pNode.appendChild(this.elements[tgtCtrlID]);
            }
            tgtElem.hidden=0;
        }
        else{
            if(tgtElem)tgtElem.remove();
            tgtElem.hidden=1;
        }
    },
    "ctrl-child_ctrl":function(bluePrint,tgtElem){
        this.child_ctrl[tgtElem.ctrl_id].reRender();
    }
}
/** @type {AttrKeyStrCtrlList} 控件的自定义属性控制器 */
ExCtrl.prototype.attrKeyStrCtrls=new AttrKeyStrCtrlList(ExCtrl.attrKeyStrCtrls);


export{
    DEF_VirtualElementList,
    DEF_VirtualElement,
    DEF_CSSVE,
    DEF_CSSVEItem,
    DataLink,
    AttrKeyStrCtrl,
    AttrKeyStrCtrl__Ex,
    AttrKeyStrCtrlList,
    CtrlLib,
    ExCtrl
}