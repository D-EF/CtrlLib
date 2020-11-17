
/**供 htmlToControl 处理xml字符串
 * @param {String}  tagName     标签名
 * @param {Number}  depth       深度
 * @param {Array}   attribute   标签的属性  [{key,val}]
 * @param {String}  before      在标签前的内容
 * @param {String}  innerEnd    最后一段内容
 */
function DEF_VirtualElement(tagName,depth,attribute,before,innerEnd){
    this.tagName=tagName;
    this.depth=depth;
    this.attribute=attribute;
    this.before=before;
    this.innerEnd=innerEnd;
}
DEF_VirtualElement.prototype={
    /**
     * @return {Number} 1:join; 2:update
     */
    setAttribute:function(key,val){
        for(var i=this.attribute.length-1;i>=0;--i){
            if(key==this.attribute[i].key){
                this.attribute[i].val=val;
                return 2;
            }
        }
        this.attribute.push({key:key,val:val});
        return 1;
    },
    /**
     * @return {String} val
     */
    getAttribute:function(key){
        for(var i=this.attribute.length-1;i>=0;--i){
            if(key==this.attribute[i].key){
                return this.attribute[i].val;
            }
        }
        return;
    }
}

//所有无内容元素(短标签)的tag name
var voidElementsTagName=["br","hr","img","input","link","meta","area","base","col","command","embed","keygen","param","source","track","wbr"];

/**把xml转换成DEF_VirtualElement
 * @param {String} xmlStr
 * @return {Object} {ves:[VirtualElement],maxDepth:Number}
 */
function xmlToVE(_xmlStr){
    var xmlStr=_xmlStr.replace(/<!--(.|[\r\n])*?-->/,"");//去除注释
        xmlStr=xmlStr.replace(/\ +/g," ").replace(/[\r\n]/g,"");//去除多余的空格和换行
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
                if(voidElementsTagName.includes(tempTagName)){
                    --depth;
                }
            }
        }
    }
    if(depth){
        console.error("标签没有对应的 开始 结束; 深度:"+depth);
        // return;
    }
    return {ves:ves,maxDepth:maxDepth};
}