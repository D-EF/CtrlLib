/**
 * 控件的基类
 */
class CtrlLib{
    /**
     * @param {Object} data
     */
    constructor(data){
        this.name;
        this.data=data||{};
        this.rootNodes=[];
        this.parentNode;
        this.parentCtrl;
        this.dataLinks={};
        this.childCtrl={};
        this.elements={};
        this.ctrlActionList={callback:[]};
    }
    /**
     * 初始化
     * @param {Element} _parentNode
     */
    addend(_parentNode,...surplusArgument){
        if(_parentNode){
            this.initialize(...arguments);
            this.parentNode=_parentNode;
            if(!this.rootNodes.length)this.createContent(surplusArgument);
            var tempDocF=document.createDocumentFragment();
            for(var i=this.rootNodes.length-1;i>=0;--i){
                tempDocF.prepend(this.rootNodes[i]);
            }
            this.parentNode.appendChild(tempDocF);
            this.callback(...arguments);
            this.touchCtrlAction("callback");
        }else{
            console.error('Fatal error! This Control have not parentNode!');
        }
    }
    /**
     * addend刚开始执行的函数,
     * 能调用到 addend 的 argument
     */
    initialize(...argument){}
    /**
     * addend 后的回调
     * 能调用到 addend 的 argument
     */
    callback(...argument){}
    /** 创建内容 */
    createContent(){this.nodes=this.rootNodes=[document.createElement("div")]}
    /**
     * 重新渲染
     * 根据data渲染部分需要渲染的内容
     */
    reRender(){}
    /**
     * 重新渲染完成后的回调
     */
    // reRender_callback:function(){}
    /**
     * 卸载控件
     */
    removeCtrl(){
        for(var i in this.childCtrl){
            this.childCtrl[i].removeCtrl();
            delete this.childCtrl[i];
        }
        for(var i in this.elements){
            this.elements[i].remove();
            delete this.elements[i];
        }
        for(var i in this.rootNodes){
            this.rootNodes[i].remove();
            delete this.rootNodes[i];
        }
    }
    /**
     * 触发控件事件的方法
     * @param {String} actionKey 事件的类型
     */
    touchCtrlAction(actionKey){
        if(this.ctrlActionList[actionKey])
        for(var i=this.ctrlActionList[actionKey].length-1;i>=0;--i){
            this.ctrlActionList[actionKey][i].call(this.ctrl);
        }
    }
}

/**
 * 用来保存蓝本的类
 */
class DEF_VirtualElementList{
    /**
     * @param {Array<DEF_VirtualElement>} ves
     * @param {Number} maxDepth
     */
    constructor(ves,maxDepth){
        this.ves=ves;
        this.maxDepth=maxDepth;
    }
    getByCtrlID(ctrlID){
        for(var i=this.ves.length-1;i>=0;--i){
            if(this.ves[i].ctrlID==ctrlID){
                return this.ves[i];
            }
        }
    }
    //所有无内容元素(短标签)的tag name
    static voidElementsTagName=["br","hr","img","input","link","meta","area","base","col","command","embed","keygen","param","source","track","wbr","?xml"];
    /**把xml转换成DEF_VirtualElement
     * @param {String} xmlStr
     * @return {DEF_VirtualElementList} {ves:Array<VirtualElement>,maxDepth:Number}
     */
    static xmlToVE(_xmlStr){
        var xmlStr=_xmlStr.replace(/\ +/g," ").replace(/[\r\n]/g,"");//去除多余的空格和换行
            xmlStr=xmlStr.replace(/<!--(.|[\r\n])*?-->/,"");//去除注释
            xmlStr=xmlStr.replace(/<\?(.|[\r\n])*?\?>/,"");//去除头
        var strleng=xmlStr.length;
        var i,j,p,q,tempOP,tempED,depth=0,tempTagName,maxDepth=0;
        var lastStrP,strFlag=0;
        var ves=[],attributes=[];
    
        for(i=0;i<strleng;++i){
            if(xmlStr[i]=='<'&&!strFlag){
                tempOP=i;attributes=[];
                for(j=tempOP+1;xmlStr[j]&&xmlStr[j]!='>'&&xmlStr[j]!=" ";++j);
                tempTagName=xmlStr.slice(tempOP+1,j);
                for(j;xmlStr[j]!='>';++j){      //属性
                    if(!strFlag){
                        if(xmlStr[j]==' '){
                            p=j+1;
                        }
                        else if(xmlStr[j]=='='){
                            q=j;
                        }
                        if(xmlStr[j]=="'"||xmlStr[j]=='"'){
                            strFlag=1;
                            lastStrP=j;
                        }
                    }else{
                        while(strFlag){
                            if(xmlStr[j]==xmlStr[lastStrP]&&xmlStr[j-1]!='\\'){
                                strFlag=0;
                                attributes.push({key:xmlStr.slice(p,q).toLowerCase(),val:xmlStr.slice(lastStrP+1,j)});
                                break;
                            }
                            ++j;
                        }
                    }
                }
                i=j;
            }
            if(xmlStr[i]=='>'&&!strFlag){
                if(xmlStr[tempOP+1]=='/'){
                    // 把 一段文本 添加到上一个这么深的元素
                    for(j=ves.length-1;j>=0;--j){
                        if(ves[j].depth==depth){
                            ves[j].innerEnd=xmlStr.slice(tempED+1,tempOP);
                            break;
                        }
                    }
                    tempED=i;
                    --depth;
                }
                else{
                    ++depth;
                    if(depth>maxDepth)maxDepth=depth;
                    var ve=new DEF_VirtualElement(tempTagName,depth,attributes,xmlStr.slice(tempED+1,tempOP));
                    ves.push(ve);
                    tempED=i;
                    if(DEF_VirtualElementList.voidElementsTagName.includes(tempTagName)){
                        --depth;
                    }
                }
            }
        }
        if(depth){
            console.error("标签没有对应的 开始 结束; 深度:"+depth);
            // return;
        }

        // 将所有的元素 加上 ctrlID
        var tempCountDepth=new Array(maxDepth);
        for(i=maxDepth-1;i>=0;--i){
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
                    pName+=tempCountDepth[j]+(j==ves[i].depth-1?"":"_");
                }
            }
            ves[i].ctrlID=pName;
            ves[i].setAttribute("ctrl-id",pName);
        }
        return new DEF_VirtualElementList(ves,maxDepth);
    }
}

/**供 htmlToControl 处理xml字符串
 * @param {String}  tagName     标签名
 * @param {Number}  depth       深度
 * @param {Array}   attribute   标签的属性  [{key,val}]
 * @param {String}  before      在标签前的内容
 * @param {String}  innerEnd    最后一段内容
 */
class DEF_VirtualElement{
    constructor(tagName,depth,attribute,before,innerEnd){
        this.tagName=tagName;
        this.depth=depth;
        this.attribute=[];
        for(var i=attribute.length-1;i>=0;--i){
            this.setAttribute(attribute[i].key,attribute[i].val);
        }
        this.before=before;
        this.innerEnd=innerEnd;
        this.ctrlID;
    }
    /**
     * 存入属性
     * @return {Number} 1:join; 2:update
     */
    setAttribute(key,val){
        for(var i=this.attribute.length-1;i>=0;--i){
            if(key==this.attribute[i].key){
                this.attribute[i].val=val;
                return 2;
            }
        }
        this.attribute.push({key:key,val:val});
        return 1;
    }
    /**
     * 获取属性
     * @return {String} val
     */
    getAttribute(key){
        for(var i=this.attribute.length-1;i>=0;--i){
            if(key==this.attribute[i].key){
                return this.attribute[i].val;
            }
        }
        return;
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
    //     ctrlID:"id",
    //     type:"type"
    // }
}

/*!
 * 将xml转化成一个可复用的控件
 * 注意! 不要在渲染里做会影响数据的事情!
 */

/**
 * 控件库派生类的基类,需要在派生时添加 bluePrint {DEF_VirtualElementList} 属性
 */
class ExCtrl extends CtrlLib{
    constructor(data){
        super(data);
    }
    /**
     * 标签的属性的关键字
     */
    static attrKeyStr={
        ctrlID:"ctrl-id",
        if:"ctrl-if",
        for:"ctrl-for",
        childCtrl:"ctrl-child_ctrl",
        childCtrlData:"ctrl-child_ctrl_datafnc",
        proxyEventBefore:"pa-",
        ctrlEventBefore:"ca-",
        // element resize 
        proxyResizeEvent:"pa-resize",
        // 按下按键事件 (组合键)
        keyDownEventBefore:"pakeydown[",
        keyDownEventCilpKey:",",
        keyDownEventAfter:"]",
        // 抬起按键事件
        keyUpEventBefore:"pakeyup[",
        keyUpEventCilpKey:",",
        keyUpEventAfter:"]",
    }
    /**
     * 请求 api 并用json反序列化
     */
    static getJsonData(method,url,callback,body){
        requestAPI(method,url,
            function(){
                var data=JSON.parse(this.response);
                callback.call(this,data);
            }
            ,body);
    }
    /**
     * 控制标签的属性
     * @param {String} key 属性的key
     * @param {Array<Element>} elements 实例的 elements 的引用，用于添加新的子元素
     * @param {Array<DEF_VirtualElement>} ves DEF_VirtualElement 的数组
     * @param {Number} i 当前的ves的下标
     * @param {String} _attrVal 属性值
     * @param {String} tname 临时的元素名称，用作实例的 elements 当前的索引
     * @param {Number} k 当前的ves的下标
     * @param {String} forkey 给 for 用的 for 的 判断体
     * @returns {Number} 返回运算完成后的ves下标
     */
    attrHandle(key,elements,ves,i,_attrVal,tname,k,forkey){
        var tgt=elements[tname];
        var attrVal=templateStringRender(_attrVal,this,[tgt]).str,//htmlToCode(_attrVal),
         k=k, that=this;
        switch(key){
            case ExCtrl.attrKeyStr.ctrlID:
            break;
            case ExCtrl.attrKeyStr.if:
                return this.ctrlIf(elements,ves,i,attrVal,tname,forkey);
            break;
            case ExCtrl.attrKeyStr.for:
                k=this.renderFor(elements,ves,i,attrVal,tname,forkey);
                elements[tname].forVesOP=i;
                elements[tname].forVesED=k;
            break;
            case ExCtrl.attrKeyStr.childCtrl:
                this.renderChildCtrl(elements[ves[k].ctrlID],ves[k],_attrVal);
            break;
            case ExCtrl.attrKeyStr.childCtrlData:
                // 这是给子控件赋 data 的属性， 应为一个表达式;
                // 实现在 renderChildCtrl() 里
            break;
            default:
                if(key.indexOf(ExCtrl.attrKeyStr.keyDownEventBefore)==0){
                    addKeyEvent(tgt,true,
                        (key.slice(ExCtrl.attrKeyStr.keyDownEventBefore.length,key.lastIndexOf(ExCtrl.attrKeyStr.keyDownEventAfter)))
                        .split(ExCtrl.attrKeyStr.keyDownEventCilpKey),
                        function(e){
                            (new Function(["e","tgt"],attrVal)).call(that,e,this)
                        },false);
                }
                else if(key.indexOf(ExCtrl.attrKeyStr.keyUpEventBefore)==0){
                    addKeyEvent(tgt,true,
                        (key.slice(ExCtrl.attrKeyStr.keyUpEventBefore.length,key.lastIndexOf(ExCtrl.attrKeyStr.keyUpEventAfter))).split(ExCtrl.attrKeyStr.keyUpEventCilpKey),
                        function(e){
                            (new Function(["e","tgt"],attrVal)).call(that,e,this)
                        },true);
                }
                else if(key==ExCtrl.attrKeyStr.proxyResizeEvent){
                    addResizeEvent(tgt,function(e){
                        (new Function(['e',"tgt",],attrVal)).call(that,e,tgt)
                    });
                }
                else if(key.indexOf(ExCtrl.attrKeyStr.proxyEventBefore)==0){
                    elements[tname].addEventListener(key.slice(ExCtrl.attrKeyStr.proxyEventBefore.length),function(e){
                        (new Function(["e","tgt"],attrVal)).call(that,e,this);
                    });
                }
                else if(key.indexOf(ExCtrl.attrKeyStr.ctrlEventBefore)==0){
                    this.ctrlActionList[key.slice(ExCtrl.attrKeyStr.ctrlEventBefore.length)].push(function(e){
                        (new Function(["e","tgt"],attrVal)).call(that,e,tgt);
                    });
                }
                else{
                    elements[tname].setAttribute(key,this.stringRender(htmlToCode(_attrVal),tname,"attr",0,key,tgt));
                }
            break;
        }
        return k;
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
    /**
     * 渲染 模板字符 内容
     * @param {String} str  write TemplateKeyStr
     * @param {String} ctrlID    登记 ID       
     * @param {String} type      登记 类型  
     * @param {Boolean} ishtml   控制返回值, 默认将返回字符串 ，非0 将返回 DocumentFragment
     * @param {Array<>} attrkey   如果是登记的 标签的属性值 这个是属性的 key
     * @param {Element} tgt 
     * @return {String||DocumentFragment} 字符串 或 包含内容的文档片段
     */
    stringRender(str,ctrlID,type,ishtml,attrkey,tgt){
        var tgt=tgt;
        var temp=templateStringRender(str,this,[tgt]);
        var fragment=document.createDocumentFragment(),tempElement=document.createElement("div");
        if(temp.hit.length 
            && ctrlID&&ctrlID.indexOf("-EX_for-")==-1
            ){
            // 有模版字符串,添加一条datalink
            for(var i=temp.hit.length-1;i>=0;--i){
                if(this.dataLinks[temp.hit[i].expression]){
                    var f=1;
                    for(var j=this.dataLinks[temp.hit[i].expression].length-1;(j>=0)&&(f);--j){
                        if(this.dataLinks[temp.hit[i].expression].link[j].ctrlID==ctrlID&&
                            this.dataLinks[temp.hit[i].expression].link[j].type==type){
                            f=0;
                            break;
                        }
                    }
                    if(!f){
                        // 有被登记过的元素
                        if(type=="attr"&&attrkey)
                        this.dataLinks[temp.hit[i].expression].link.push({ctrlID:ctrlID,type:type,attrkey:attrkey});
                    }else{
                        // 未被登记过的元素
                        if(type=="attr"&&attrkey){
                            this.dataLinks[temp.hit[i].expression].link.push({ctrlID:ctrlID,type:type,attrkey:attrkey});
                        }else{
                            this.dataLinks[temp.hit[i].expression].link.push({ctrlID:ctrlID,type:type});
                        }
                    }
                    this.dataLinks[temp.hit[i].expression].value=temp.hit[i].value;
                    // else continue;
                }
                else{
                    this.dataLinks[temp.hit[i].expression]=new DataLink(temp.hit[i].expression,temp.hit[i].value,{ctrlID:ctrlID,type:type});
                    if(type=="attr"&&attrkey){
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
     * @param {Array<Element>}   elements    
     * @param {Array<DEF_VirtualElement>}   ves         DEF_VirtualElement list
     * @param {Number}  i           当前的ves的索引
     * @param {String}  forStr      属性内容
     * @param {String}  tname       elements的索引
     * @param {Array}  forkey       用于给 for 配备唯一值, 会将 模板 中的表达式替换
     * @returns {Number} 返回跳过子元素的索引
     */
    renderFor(elements,ves,i,forStr,tname,forkey){
        var k=i,p,temp,l,ioffset=ioffset||0;
        var fillInner;
        var tgt=this.elements[ves[i].ctrlID];
        var for1Fun=new Function(["tgt"],forStr.slice(0,forStr.indexOf(';'))),
            for2Fun=new Function(["tgt"],"return "+forStr.slice(forStr.indexOf(';')+1,forStr.lastIndexOf(';'))),
            for3Fun=new Function(["tgt"],forStr.slice(forStr.lastIndexOf(';')));
        // k=循环后遇到的元素的下标
        for(k=i+1;k<ves.length&&ves[k].depth>ves[i].depth;++k);
        fillInner=ves.slice(i+1,k);
        for(for1Fun.call(this,tgt),l=1;for2Fun.call(this,tgt);++l,for3Fun.call(this,tgt)){
            //递归得到循环内部的元素
            temp=this.itemVEToElement(fillInner,"-EX_for-"+tname+"-C"+l);
            elements[tname].appendChild(temp.fragment);
            Object.assign(elements,temp.elements);
        }
        return k-1;
    }
    /**
     * 控制元素是否出现
     * @param {Array<Element>}   elements    
     * @param {Array<DEF_VirtualElement>}   ves         DEF_VirtualElement list
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
            return k-1;
        }
        else{
            elements[tname].hidden=0;
            return i;
        }
    }
    /**
     * 渲染子控件
     * @param {Element} element         
     * @param {DEF_VirtualElement} ve   
     * @param {String} childCtrlType  控件的类型
     */
    renderChildCtrl(element,ve,childCtrlType){
        var dataStr=ve.getAttribute(ExCtrl.attrKeyStr.childCtrlData);
        var then=this;
        if(!dataStr){
            getDataCallback();
            return;
        }
        else{
            (new Function(["callback"],dataStr)).call(this,getDataCallback);
        }
        function getDataCallback(data){
            var childCtrl=new then.childCtrlType[childCtrlType](data);
            then.childCtrl[ve.ctrlID]=childCtrl;
            then.childCtrl[ve.ctrlID].parentCtrl=this;
            childCtrl.addend(element);
        }
    }
    /**
     * 把 ve 转换成 js 的 Element 对象;
     * @param   {Array<DEF_VirtualElement>} ves   DEF_VirtualElement list
     * @param   {String}     _nameEX    用来添加命名的
     * @return  {Object{elements,DocumentFragment}}
     */
    itemVEToElement(ves,_nameEX,forkey){
        var elements={},
            rtnFragment=document.createDocumentFragment(),
            i,j,k,minD=Infinity,
            dHash=new Array(ves.length),
            nameEX=_nameEX||"",
            tname;
        for(i=0;i<ves.length;i=k,++i){
            k=i;
            tname=ves[i].ctrlID+nameEX;
            elements[tname]=document.createElement(ves[i].tagName);
            elements[tname].vesIndex=i;
            elements[tname].ctrlID=tname;
            for(j=ves[i].attribute.length-1;j>=0;--j){
                k=this.attrHandle(ves[i].attribute[j].key,elements,ves,i,ves[i].attribute[j].val,tname,k,forkey);
            }
            if(dHash[ves[i].depth-1]){ //如果存在上一层
                dHash[ves[i].depth-1].appendChild(this.stringRender(ves[i].before,tname,"before",1,forkey,dHash[ves[i].depth-1]));
                if(!elements[tname].hidden)dHash[ves[i].depth-1].appendChild(elements[tname]);
            }
            
            if(!ves[i+1]||ves[i+1].depth<=ves[i].depth){// 如果下一个不是这一个的子
                var ti=i;
                do{
                    if(ves[ti].innerEnd){
                        elements[ves[ti].ctrlID+nameEX].appendChild(this.stringRender(ves[ti].innerEnd,tname,"innerEnd",1,forkey,elements[tname]));
                    }
                    --ti;
                }while((ves[ti])&&(ves[ti].depth<ves[i].depth));
            }

            dHash[ves[i].depth]=elements[tname];

            if(ves[i].depth<minD){// 刷新最小深度
                minD=ves[i].depth;
                rtnFragment=document.createDocumentFragment();
                rtnFragment.appendChild(this.stringRender(ves[i].before,tname,"before",1,forkey,rtnFragment));
                if(!elements[tname].hidden)rtnFragment.appendChild(elements[tname]);//添加到root
            }else{
                if(ves[i].depth==minD){
                    rtnFragment.appendChild(this.stringRender(ves[i].before,tname,"before",1,forkey,rtnFragment));
                    if(!elements[tname].hidden)rtnFragment.appendChild(elements[tname]);
                }
            }
        }

        return {elements:elements,fragment:rtnFragment};
    }
    createContent(){
        var temp=this.itemVEToElement(this.bluePrint.ves);
        this.elements=temp.elements;
        this.rootNodes=nodeListToArray(temp.fragment.childNodes);
    }
    renderString(){
        var i,j,tempFootprint={},tid,ttype;
        //  重新渲染 stringRender 的
        for(i in this.dataLinks){
            for(j=this.dataLinks[i].link.length-1;j>=0;--j){
                // todo : 如果在模板文本里有会修改数据的表达式 
                tid=this.dataLinks[i].link[j].ctrlID;
                if(this.dataLinks[i].value==this.dataLinks[i].expFnc.call(this,this.elements[tid]))
                continue;
                ttype=this.dataLinks[i].link[j].type;
                for(j=this.dataLinks[i].link.length-1;j>=0;--j){
                    tid=this.dataLinks[i].link[j].ctrlID;
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
            if(elementCtrlIDs[i].indexOf("-EX_for-")!=-1){
                this.elements[elementCtrlIDs[i]].remove();
                delete this.elements[elementCtrlIDs[i]];
            }
        }
        //  重新渲染 stringRender 的
        for(i in this.dataLinks){
            for(j=this.dataLinks[i].link.length-1;j>=0;--j){
                // todo : 如果在模板文本里有会修改数据的表达式 
                tid=this.dataLinks[i].link[j].ctrlID;
                if(this.dataLinks[i].value==this.dataLinks[i].expFnc.call(this,this.elements[tid]))
                continue;
                ttype=this.dataLinks[i].link[j].type;
                for(j=this.dataLinks[i].link.length-1;j>=0;--j){
                    tid=this.dataLinks[i].link[j].ctrlID;
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
        elementCtrlIDs=Object.keys(this.elements);
        for(i=0;i<elementCtrlIDs.length;++i){
            tgtElem=this.elements[elementCtrlIDs[i]];
            var tempVE=bluePrint.getByCtrlID(elementCtrlIDs[i]),attrKey;
                
            for(j=tempVE.attribute.length-1;j>=0;--j){
                attrKey=tempVE.attribute[j].key;
                if(this.reRenderAttrCtrl[attrKey]){
                    this.reRenderAttrCtrl[attrKey].call(this,bluePrint.ves,tgtElem);
                }
            }
        }
        if(this.reRender_callback)this.reRender_callback();
    }
    // render 的 方法集; 给 stringRender 处理的内容
    // 加在元素前面的东西
    renderCtrl_before(ctrlID){
        var tgtElement=this.elements[ctrlID];
        var thisVe=this.bluePrint.getByCtrlID(ctrlID);
        do{
            tgtElement.previousSibling.remove();
        }while(!(tgtElement.previousSibling.ctrlID));
        this.elements[ctrlID].before(this.stringRender(thisVe.before,ctrlID,"before",1));
    }
    //加在元素末尾的内容
    renderCtrl_innerEnd(ctrlID){
        var tgtElement=this.elements[ctrlID];
        var thisVe=this.bluePrint.getByCtrlID(ctrlID);
        do{
            tgtElement.childNodes[tgtElement.childNodes.length-1].remove();
        }while(tgtElement.childNodes[tgtElement.childNodes.length-1]&&tgtElement.childNodes[tgtElement.childNodes.length-1].ctrlID);
        this.elements[ctrlID].appendChild(this.stringRender(thisVe.innerEnd,ctrlID,"innerEnd",1,tgtElement));
    }
    // 渲染 元素 的 控件属性
    renderCtrl_attr(ctrlID,attrkey){
        var tgtElement=this.elements[ctrlID];
        var thisVE=this.bluePrint.getByCtrlID(ctrlID);
        this.elements[ctrlID].setAttribute(attrkey,this.stringRender(thisVE.getAttribute(attrkey),ctrlID,"attr",0,attrkey,tgtElement));
    }
    // render 的 方法集; 给影响自身内部的属性 "ctrl-for" "ctrl-if" 等
    reRenderAttrCtrl={
        "ctrl-for":function(ves,tgtElem){
            var tgtve=this.bluePrint.getByCtrlID(tgtElem.ctrlID);
            tgtElem.innerHTML="";
            this.renderFor(this.elements,ves,tgtElem.vesIndex,tgtve.getAttribute("ctrl-for"),tgtElem.ctrlID);
        },
        "ctrl-if":function(ves,tgtElem){
            if(eval(tgtElem.ctrlAttr["ctrl-if"])){
                var j;
                var tgtParentNode;
                if(ves[tgtElem.vesIndex].depth){
                    for(j=tgtElem.vesIndex-1;j>=0;--j){// 向前寻找父元素
                        if(ves[j].depth+1==ves[tgtElem.vesIndex].depth){
                            tgtParentNode=this.elements[ves[j].ctrlID];
                            break;
                        }
                    }
                }
                else{
                    // 深度为0 为rootnode
                    tgtParentNode=this.parentNode;
                }
                for(j=tgtElem.vesIndex;j<ves.length;++j){
                    if(ves[tgtElem.vesIndex].depth==ves[j]){
                        // 有next element
                        tgtParentNode.insertBefore(tgtElem,this.elements[ves[j].ctrlID]);
                    }
                    if(ves[tgtElem.vesIndex].depth>ves[j]||!(ves[j+1])){
                        // 这个是同深度的最后一个元素
                        tgtParentNode.appendChild(tgtElem);
                    }
                }
            }
            else{
                tgtElem.remove();
            }
        },
        "ctrl-child_ctrl":function(ves,tgtElem){
            this.childCtrl[tgtElem.ctrlID].reRender();
        }
    }
}

// todo: ? 能不能把render for 优化, 再次渲染时能否只影响部分dom？
// 但是要这必须用 for in 或其他的指令, 非常呃呃