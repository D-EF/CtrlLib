/**
 * 以后写需要继承类的东西都不会再用function的写法了. 忒蛋疼了
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

