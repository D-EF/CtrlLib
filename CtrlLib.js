function CtrlLib(){
    this.name;
    this.data={};
    this.nodes=[];
    this.rootNodes=[];
    this.parentNode;
    this.recont=[];
    this.dataLinks={};
}
CtrlLib.prototype={
    /**
     * 初始化
     * @param {Element} _parentNode
     */
    addend:function(_parentNode,...surplusArgument){
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
        }else{
            console.error('Fatal error! This Control have not parentNode!');
        }
    },
    /**
     * addend刚开始执行的
     */
    initialize:function(){},
    /**
     * addend后的回调
     * 能调用到initialize 的 argument
     */
    callback:function(){},
    /** 创建内容 */
    createContent:function(){this.nodes=this.rootNodes=[document.createElement("div")]},
    /**
     * 重新渲染
     * 根据data渲染部分需要渲染的内容
     */
    reRender:function(){},
    /**
     * 重新渲染完成后的回调
     */
    // reRender_callback:function(){}
}

/**
 * @param {String} expression
 * @param {String} value
 * @param {Object{CtorID,type}} link
 */
function DataLink(expression,value,link){
    this.expression=expression;
    this.expFnc=new Function("return "+expression);
    this.value=value;
    this.link=[link];
    // link={
    //     ctrlID:"id",
    //     type:"type"
    // }
}