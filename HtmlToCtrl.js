/**
 * 根据html代码, 创建一个 CtrlLib 的派生类
 * @param {String} htmlStr html代码
 * @param {Object} _prototype 追加到派生控件的原型链
 * @returns 返回一个 CtrlLib 的 派生类
 */
function htmlToCtrl(htmlStr,_prototype){
    var i,j;
    var ExCtrl=function(){
        CtrlLib.call(this,arguments);
    }
    inheritClass(CtrlLib,ExCtrl);

    //  把实参的prototype添加到ExCtrl;
    if(_prototype)ExCtrl.prototype=Object.assign(ExCtrl.prototype,_prototype);
    ExCtrl.prototype=Object.assign(ExCtrl.prototype,ExCtrl_Prototype);

    // 建立蓝图 op
    ExCtrl.prototype.bluePrint=xmlToVE(htmlStr);
    var proxyEvent_keyWord="proxy-on";

    ExCtrl.prototype.bluePrint=xmlToVE(htmlStr);
    var tempCountDepth=new Array(ExCtrl.prototype.bluePrint.maxDepth);
    for(i=ExCtrl.prototype.bluePrint.maxDepth-1;i>=0;--i){
        tempCountDepth[i]=0;
    }
    var pName;
    var ves=ExCtrl.prototype.bluePrint.ves;
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
        ExCtrl.prototype.bluePrint.ves[i].ctrlID=pName;
        ves[i].setAttribute("ctrl-id",pName)
    }
    // 建立蓝图 ed
    return ExCtrl;
}
ExCtrl_Prototype={
    templateKeyStr:{op:"${",ed:"}"},
    /**渲染 模板字符 内容
     * @param {String} str  write TemplateKeyStr
     * @param {String} ctrlID    可选的, 登记 ID       
     * @param {String} type      可选的, 登记 类型  
     * @param {Boolean} ishtml   控制返回值, 默认将返回字符串 ，非0 将返回 DocumentFragment
     * @param {Array} forkey   用于给 for 配备唯一值, 会将 模板 中的表达式替换
     * @return {String||DocumentFragment} 字符串 或 包含内容的文档片段
     */
    stringRender:function(str,ctrlID,type,ishtml,forkey){
        var temp=[],tDL,tempstr;
        var headFlag=0,footFlag=0;
        var q,p;// q是左
        var fragment=document.createDocumentFragment(),tempElement=document.createElement("div");

        //字符串处理open
        if(ctrlID){
            if(!this.dLink)this.dLink={};
            if(!this.dLink[ctrlID])this.dLink[ctrlID]={};
            tDL=this.dLink[ctrlID][type]={bluePrint:str,nodes:[]};
        }
        for(p=0,q=0;str[p];++p){
            for(var i=0;i<this.templateKeyStr.op.length;++i){
                if(!(headFlag=str[p+i]==this.templateKeyStr.op[i])){break;}
            }
            
            if(headFlag){ // 检测到头
                temp.push(str.slice(q,p));
                q=p+2;
                while(1){
                    ++p;
                    for(var i=0;i<this.templateKeyStr.ed.length;++i){
                        if(!(footFlag=str[p+i]==this.templateKeyStr.ed[i])){break;}
                    }
                    if(footFlag){
                        tempstr=str.slice(q,p);
                        oldL=temp.join("").length;
                        temp.push((new Function("return "+tempstr)).call(this));
                        q=p+1;
                        break;
                    }
                }
            }
        }
        temp.push(str.slice(q,p));
        //字符串处理end
        if(tDL&&temp.length<2){
            //因为没有匹配 模板标记(templateKeyStr) 所以删除登记
            delete this.dLink[ctrlID][type];
        }
        // else{
        //     console.log(ctrlID);
        // }

        if((ctrlID&&type&&!Object.keys(this.dLink[ctrlID]).length)){
            delete this.dLink[ctrlID];
        }
        // if(ctrlID&&ctrlID.indexOf("EX-for")!=-1){
        //     /*删除由 for 创建的元素的dlink*/
        //     delete this.dLink[ctrlID];
        // }
        if(ishtml){
            // 将字符串转成 node 并且输入到 fragment
            tempElement.innerHTML=temp.join("");
            p=tempElement.childNodes.length;
            for(--p;p>=0;--p){
                tDL.nodes.push(tempElement.childNodes[p]);
                fragment.prepend(tempElement.childNodes[p]);
            }
            return fragment;
        }
        else{
            return temp.join("");
        }
    },
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
    renderFor:function(elements,ves,i,forStr,tname,forkey){
        var k=i,p,temp,l,ioffset=ioffset||0;
        var fillInner;
        var for1Fun=new Function(forStr.slice(0,forStr.indexOf(';'))),
            for2Fun=new Function("return "+forStr.slice(forStr.indexOf(';')+1,forStr.lastIndexOf(';'))),
            for3Fun=new Function(forStr.slice(forStr.lastIndexOf(';')));
        // k=循环后遇到的元素的下标
        for(k=i+1;k<ves.length&&ves[k].depth>ves[i].depth;++k);
        fillInner=ves.slice(i+1,k);
        for(for1Fun.call(this),l=1;for2Fun.call(this);++l,for3Fun.call(this)){
            //递归得到循环内部的元素
            temp=this.itemVEToElement(fillInner,"_EX-for"+tname+"-C"+l);
            elements[tname].appendChild(temp.fragment);
            Object.assign(elements,temp.elements);
        }
        return k-1;
    },
    /**
     * 
     * @param {Array<Element>}   elements    
     * @param {Array<DEF_VirtualElement>}   ves         DEF_VirtualElement list
     * @param {Number}  i           当前的ves的索引
     * @param {String}  attrVal     属性内容
     * @param {String}  tname       elements的索引
     * @returns {Number} 返回跳过子元素的索引
     */
    ctrlIf:function(elements,ves,i,attrVal,tname){
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
    },
    /**
     * 
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
    attrHandle:function(key,elements,ves,i,_attrVal,tname,k,forkey){
        var attrVal=htmlToCode(_attrVal);
        if(key.indexOf("ctrl-")!=-1&&key!="ctrl-id"){
            if(!elements[tname].ctrlAttr){
                elements[tname].ctrlAttr={}
            }
            elements[tname].ctrlAttr[key]=_attrVal;
        }
        var k=k;
        switch(key){
            case "ctrl-id":
            break;
            case "ctrl-if":
                return this.ctrlIf(elements,ves,i,attrVal,tname,forkey);
            break;
            case "ctrl-for":
                k=this.renderFor(elements,ves,i,attrVal,tname,forkey);
                elements[tname].forVesOP=i;
                elements[tname].forVesED=k;
            break;
            default:
                elements[tname].setAttribute(key,this.stringRender(attrVal,tname,"attr",0,forkey));
            break;
        }
        return k;
    },
    /**把 ve 转换成 js 的 Element 对象;
     * @param   {Array<DEF_VirtualElement>} ves   DEF_VirtualElement list
     * @param   {String}     _nameEX    用来添加命名的
     * @return  {Object{elements,DocumentFragment}}
     */
    itemVEToElement:function(ves,_nameEX,forkey){
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
                dHash[ves[i].depth-1].appendChild(this.stringRender(ves[i].before,tname,"before",1,forkey));
                if(!elements[tname].hidden)dHash[ves[i].depth-1].appendChild(elements[tname]);
            }
            if(!ves[i+1]||ves[i+1].depth<=ves[i].depth){// 如果下一个不是这一个的子
                elements[tname].appendChild(this.stringRender(ves[i].innerEnd,tname,"innerEnd",1,forkey));
            }
            dHash[ves[i].depth]=elements[tname];

            if(ves[i].depth<minD){// 刷新最小深度
                minD=ves[i].depth;
                rtnFragment=document.createDocumentFragment();
                rtnFragment.appendChild(this.stringRender(ves[i].before,tname,"before",1,forkey));
                if(!elements[tname].hidden)rtnFragment.appendChild(elements[tname]);//添加到root
            }else{
                if(ves[i].depth==minD){
                    rtnFragment.appendChild(this.stringRender(ves[i].before,tname,"before",1,forkey));
                    if(!elements[tname].hidden)rtnFragment.appendChild(elements[tname]);
                }
            }
        }

        return {elements:elements,fragment:rtnFragment};
    },
    createContent:function(){
        var temp=this.itemVEToElement(this.bluePrint.ves);
        this.elements=temp.elements;
        this.rootNodes=nodeListToArray(temp.fragment.childNodes);
    },
    /**
     * 根据依赖项重新渲染所有内容 仅有在 stringRender 中登记过才能使用
     */
    reRender:function(){
        var i,j,ctrlIDs=Object.keys(this.dLink),keys2,tempT;
        var ves=this.bluePrint.ves;
        var elementCtrlIDs=Object.keys(this.elements);

        // 清除循环填充的东西
        for(i=elementCtrlIDs.length-1;i>=0;--i){
            if(elementCtrlIDs[i].indexOf("_EX-for")!=-1){
                this.elements[elementCtrlIDs[i]].remove();
                delete this.elements[elementCtrlIDs[i]];
            }
        }
        //  重新渲染 stringRender 的
        for(i=ctrlIDs.length-1;i>=0;--i)
        {
            keys2=Object.keys(this.dLink[ctrlIDs[i]]);
            for(j=keys2.length-1;j>=0;--j){
                tempT=this.dLink[ctrlIDs[i]][keys2[j]];
                this.renderCtrl[keys2[j]].call(this,tempT,ctrlIDs[i],keys2[j]);
            }
        }
        // 重新渲染 ctrl-attr 内容
        elementCtrlIDs=Object.keys(this.elements);
        for(i=0;i<elementCtrlIDs.length;++i){
            tgtElem=this.elements[elementCtrlIDs[i]];
            var ctrlAttrKeys=Object.keys(tgtElem.ctrlAttr);
            for(j=ctrlAttrKeys.length-1;j>=0;--j){
                this.reRenderAttrCtrl[ctrlAttrKeys[j]].call(this,ves,tgtElem);
            }
        }
    },
    // render 的 方法集; 给 stringRender 处理的内容
    renderCtrl:{
        // 加在元素前面的东西
        before:function(tempT,ctrlID){
            var k=tempT.nodes.length-1;
            do{
                tempT.nodes[k].remove();
            }while(k--)
            this.elements[ctrlID].before(this.stringRender(tempT.bluePrint,ctrlID,"before",1));
        },
        //加在元素末尾的内容
        innerEnd:function(tempT,ctrlID){
            var k=tempT.nodes.length-1;
            do{
                tempT.nodes[k].remove();
            }while(k--)
            this.elements[ctrlID].appendChild(this.stringRender(tempT.bluePrint,ctrlID,"innerEnd",1));
        },
        attr:function(tempT,ctrlID,attrkey){
            // 元素 属性
            this.elements[ctrlID].setAttribute(attrkey.slice(8),this.stringRender(tempT.bluePrint,ctrlID,"attr"));//6=="attrVal-".length
        }
    },
    // render 的 方法集; 给影响自身内部的属性 "ctrl-for" "ctrl-if" 等
    reRenderAttrCtrl:{
        "ctrl-for":function(ves,tgtElem){
            tgtElem.innerHTML="";
            this.renderFor(this.elements,ves,tgtElem.vesIndex,tgtElem.ctrlAttr["ctrl-for"],tgtElem.ctrlID);
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
        }
    }
}