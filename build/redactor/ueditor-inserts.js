(function(e){define(["text!scripts/redactor/ueditor-templates.html"],function(t){var n={IMAGE:"image",EMBED:"embed"},r=Backbone.View.extend({shortcodeName:"ueditor-insert",attributes:{contenteditable:"false"},defaultData:{},resizable:!1,initialize:function(e){e=e||{};var t=e.data||{};t=_.extend({},this.defaultData,t),t.id||(t.id="uinsert-"+ ++Upfront.data.ueditor.insertCount,Upfront.Events.trigger("content:insertcount:updated")),this.el.id=t.id,this.data=new Backbone.Model(t),this.listenTo(this.data,"change add remove reset",this.render),this.createControls(),typeof this.init=="function"&&this.init()},start:function(){var t=e.Deferred();return t.resolve(),t.promise()},getOutput:function(){var e=this.data.toJSON(),t='[ueditor-insert type="'+this.type+'"';return _.each(e,function(e,n){t+=" "+n+'="'+e+'"'}),t+"]"},importInserts:function(t){var n=this,r=new RegExp("(["+this.shortcodeName+"[^]]*?])","ig"),i=t.html(),s=e("<div></div>");i=i.replace(r,'<p class="ueditor-insert">$1</p>');var o=s.html(i).find("p.ueditor-insert");o.each(function(){var e=n.parseShortcode(this.innerHTML);e.type&&a[e.type]})},parseShortcode:function(t){var n=/\[([^\s\]]+)([^\]]*?)\]/i,r=/(\w+)\s*=\s*"([^"]*)"(?:\s|$)|(\w+)\s*=\s*\'([^\']*)\'(?:\s|$)|(\w+)\s*=\s*([^\s\'"]+)(?:\s|$)|"([^"]*)"(?:\s|$)|(\S+)(?:\s|$)/ig,i=t.match(n),s={},o;console.log("insert");if(!i)return!1;s.shortcodeName=i[1],o=e.trim(i[2]);if(o){var u=o.match(r);u&&_.each(u,function(t){t=e.trim(t);var n=t.split("=");if(n.length==1)s[t]=t;else{var r=e.trim(n[0]),i=e.trim(n.slice(1).join("="));if(i[0]=='"'&&i[i.length-1]=='"'||i[0]=="'"&&i[i.length-1]=="'")i=i.slice(1,-1);s[r]=i}})}return s},createControls:function(){var e=this,t=Upfront.Views.Editor.InlinePanels;this.controls&&(this.controls.remove(),this.controls=!1);if(!this.controlsData)return;this.controls=new t.ControlPanel;var n=[];_.each(this.controlsData,function(r){var i;if(r.type=="simple")i=e.createSimpleControl(r),e.controls.listenTo(i,"click",function(){e.controls.trigger("control:click",i),e.controls.trigger("control:click:"+i.id,i)});else if(r.type=="multi"){i=new t.TooltipControl,i.selected=r.selected;if(r.subItems){var s={};_.each(r.subItems,function(t){s[t.id]=e.createSimpleControl(t)}),i.sub_items=s}e.controls.listenTo(i,"select",function(t){e.controls.trigger("control:select:"+i.id,t)})}else r.type=="dialog"&&(i=new t.DialogControl,i.view=r.view,e.controls.listenTo(i,"panel:ok",function(t){e.controls.trigger("control:ok:"+i.id,t,i)}),e.controls.listenTo(i,"panel:open",function(){e.controls.$el.addClass("uinsert-control-visible"),e.$el.addClass("nosortable")}),e.controls.listenTo(i,"panel:close",function(){e.controls.$el.removeClass("uinsert-control-visible"),e.$el.removeClass("nosortable")}));i&&(i.icon=r.icon,i.tooltip=r.tooltip,i.id=r.id,n.push(i))}),this.controls.items=_(n),this.controls.render(),typeof this.controlEvents=="function"&&this.controlEvents(),this.controls.delegateEvents()},createSimpleControl:function(e){var t=new Upfront.Views.Editor.InlinePanels.Control;return t.icon=e.icon,t.tooltip=e.tooltip,t.id=e.id,t},getAligmnentControlData:function(e){var t={left:{id:"left",icon:"alignleft",tooltip:"Align left"},right:{id:"right",icon:"alignright",tooltip:"Align right"},center:{id:"center",icon:"aligncenter",tooltip:"Align center"},full:{id:"full",icon:"alignfull",tooltip:"Full width"}},n={id:"alignment",type:"multi",icon:"alignment",tooltip:"Alignment",subItems:[]};return _.each(e,function(e){t[e]&&n.subItems.push(t[e])}),n},getRemoveControlData:function(){return{id:"remove",type:"simple",icon:"remove",tooltip:"Delete"}},resizableInsert:function(){var e=this,t=this.data.get("align"),n=!0,r=!0,i=".upfront-icon-control-resize-se",s={},o=Upfront.Behaviors.GridEditor;this.$el.hasClass("ui-resizable")&&this.$el.resizable("destroy"),t=="left"?n=!1:t=="right"&&(r=!1,i=".upfront-icon-control-resize-sw"),this.$(i).length||(r&&(this.$el.append('<span class="upfront-icon-control upfront-icon-control-resize-se upfront-resize-handle-se ui-resizable-handle ui-resizable-se nosortable" style="display: inline;"></span>'),s.se=".upfront-icon-control-resize-se"),n&&(this.$el.append('<span class="upfront-icon-control upfront-icon-control-resize-sw upfront-resize-handle-sw ui-resizable-handle ui-resizable-sw nosortable" style="display: inline;"></span>'),s.sw=".upfront-icon-control-resize-sw"));var u=this.getResizableOptions?this.getResizableOptions():{};u.handles=s,u.grid=[o.col_size,o.baseline],this.$el.resizable(u)}}),i=r.extend({type:"image",className:"ueditor-insert upfront-inserted_image-wrapper",tpl:_.template(e(t).find("#image-insert-tpl").html()),resizable:!0,defaultData:{captionPosition:"nocaption",caption:"A wonderful image :)",imageFull:{src:"",width:100,height:100},imageThumb:{src:"",width:100,height:100},linkType:"do_nothing",linkUrl:"",isLocal:1,externalImage:{top:0,left:0,width:0,height:0}},getResizableOptions:function(){var t={resize:e.proxy(this.onResizing,this),start:e.proxy(this.onStartResizing,this),stop:e.proxy(this.onStopResizing,this)};return["left","right"].indexOf(this.data.get("captionPosition"))!=-1&&(t.minWidth=2*Upfront.Behaviors.GridEditor.col_size+parseInt(this.data.get("imageThumb").width,10)),this.data.get("align")=="full"&&(t.minWidth=this.data.get("width"),t.maxWidth=t.minWidth),t},init:function(){var e=this.getAligmnentControlData(["left","center","full","right"]);e.selected=this.data.get("align"),this.controlsData=[e,{id:"link",type:"dialog",icon:"link",tooltip:"Link image",view:this.getLinkView()},{id:"caption",type:"multi",icon:"caption",tooltip:"Caption",selected:this.data.get("captionPosition")||"nocaption",subItems:[{id:"nocaption",icon:"nocaption",tooltip:"No caption"},{id:"left",icon:"caption-left",tooltip:"At the left"},{id:"bottom",icon:"caption-bottom",tooltip:"At the bottom"},{id:"right",icon:"caption-right",tooltip:"At the right"}]},this.getRemoveControlData()],this.createControls();if(!this.data.get("width")){var t=this.data.get("imageThumb").width;["left","right"].indexOf(this.data.get("captionPosition"))!=-1&&(t+=3*Upfront.Behaviors.GridEditor.col_size),this.data.set({width:t},{silent:!0})}console.log(this.data.toJSON())},start:function(){var e=this,t=Upfront.Media.Manager.open({multiple_selection:!1});return t.done(function(t,n){var r=e.getImageData(n);r.id=e.data.id,e.data.clear({silent:!0}),console.log(r),e.data.set(r),e.controlsData[0].selected=e.data.get("align"),e.createControls()}),t},render:function(){var e=this,t=this.data.toJSON(),n=this.data.get("imageThumb");n.src||(n={height:t.height,width:t.width,src:t.src}),t.align=="full"?t.image=t.imageFull:t.image=t.imageThumb;var r=this.data.get("imageFull").src;r||(this.data.set("imageFull",{height:t.height,width:t.width,src:t.src}),t.image=this.data.get("imageFull")),this.$el.html(this.tpl(t)).removeClass("aligncenter alignleft alignright alignfull").addClass("align"+t.align).addClass("clearfix"),t.align!="full"?this.$el.width(parseInt(t.width,10)):this.$el.css("width","auto"),this.controls.render(),this.$el.append(this.controls.$el),this.updateControlsPosition(),this.captionTimer=!1,t.captionPosition!="nocaption"&&(this.$(".wp-caption-text").off("keyup").on("keyup",function(t){e.data.set("caption",this.innerHTML,{silent:!0}),e.data.trigger("update")}).ueditor({linebreaks:!0,autostart:!0,pastePlainText:!0,airButtons:["bold","italic","upfrontLink","stateAlign"]}),this.ueditor=this.$(".wp-caption-text").data("ueditor"),this.ueditor.redactor.events.on("ueditor:focus",function(t){if(t!=e.ueditor.redactor)return;var n=e.$el.closest(".upfront-content-marker-contents").data("ueditor"),r=n?n.redactor:!1;if(!r)return;r.$editor.off("drop.redactor paste.redactor keydown.redactor keyup.redactor focus.redactor blur.redactor"),r.$source.on("keydown.redactor-textarea")}),this.ueditor.redactor.events.on("ueditor:blur",function(t){if(t!=e.ueditor.redactor)return;var n=e.$el.closest(".upfront-content-marker-contents").data("ueditor"),r=n?n.redactor:!1;if(!r)return;r.buildBindKeyboard()}));var i={display:"inline-block",overflow:"hidden",position:"relative",height:n.height},s=this.calculateImageResize(n,this.data.get("imageFull"));t.align=="full"?t.captionPosition=="left"||t.captionPosition=="right"?i.width=n.width:i.width="100%":i.width=n.width,this.$(".uinsert-image-wrapper").css(i).addClass("uinsert-drag-handle").find("img").attr("src",this.data.get("imageFull").src).css({position:"absolute","max-width":"none","max-height":"none"}).css(s),this.data.get("isLocal")||this.data.set({externalImage:s},{silent:!0}),this.resizableInsert(),(t.captionPosition=="left"||t.captionPosition=="right")&&this.resizableImage()},controlEvents:function(){var e=this;this.stopListening(this.controls),this.listenTo(this.controls,"control:click:remove",function(e){console.log(e),this.trigger("remove",this)}),this.listenTo(this.controls,"control:select:alignment",function(t){var n={align:t},r=Upfront.Behaviors.GridEditor.col_size,i=this.data.get("imageThumb"),s=this.data.get("captionPosition"),o=s=="left"||s=="right",u;t=="full"?(this.data.set(n),n.width=e.$el.width(),o?i.width=(n.width/r-3)*r:i.width=n.width,i.width=Math.round(i.width),i.src=this.data.get("isLocal")?this.generateThumbSrc(i.width,i.height):i.src,n.thumb=i):this.data.get("align")=="full"&&(u=Math.round((this.data.get("width")/r-6)*r),n.width=u,o?i.width=u-3*r:i.width=u,i.width=Math.round(i.width),i.src=this.data.get("isLocal")?this.generateThumbSrc(i.width,i.height):i.src,n.thumb=i),this.data.set(n)}),this.listenTo(this.controls,"control:ok:link",function(e,t){var n=e.$("input[type=text]").val(),r=e.$("input[type=radio]:checked").val()||"do_nothing",i={};"external"===r&&!n.match(/https?:\/\//)&&!n.match(/\/\/:/)&&(n=n.match(/^www\./)||n.match(/\./)?"http://"+n:n),i={linkType:r,linkUrl:n},this.data.set(i),e.model.set(i),t.close()}),this.listenTo(this.controls,"control:select:caption",function(e){var t=this.data.get("captionPosition"),n={captionPosition:e},r=["left","right"].indexOf(this.data.get("captionPosition"))!=-1,i=["left","right"].indexOf(e)!=-1,s=this.data.get("align"),o=this.data.get("imageThumb"),u=Upfront.Behaviors.GridEditor.col_size;r!=i&&(s=="full"?(o.width=i?(this.data.get("width")/u-3)*u:this.data.get("width"),o.width=Math.round(o.width),o.src=this.data.get("isLocal")?this.generateThumbSrc(o.width,o.height):o.src,n.imageThumb=o):n.width=i?parseInt(this.data.get("imageThumb").width,10)+3*u:parseInt(this.data.get("imageThumb").width,10)),this.data.set(n)})},updateControlsPosition:function(){var e=this.data.get("width"),t=this.data.get("captionPosition"),n=this.data.get("imageThumb").width,r=this.controls.$el,i=0;t=="left"?i=Math.min(e-n+n/2-r.width()/2,e-r.width()):i=Math.max(0,n/2-r.width()/2),r.css("margin-left",i+"px")},getSimpleOutput:function(){var t=this.el.cloneNode(),n=this.data.toJSON();return n.image=n.imageFull,this.data.set("width",this.$el.width(),{silent:!0}),this.data.trigger("update"),n.isLocal=parseInt(n.isLocal,10),t.innerHTML=this.tpl(n),e(t).width(this.data.get("width")),e("<div>").html(t).html()},getOutput:function(){var t=this.el.cloneNode(),n=this.data.toJSON();return n.image=n.imageThumb,this.data.set("width",this.$el.width(),{silent:!0}),this.data.trigger("update"),n.isLocal=parseInt(n.isLocal,10),t.innerHTML=this.tpl(n),e(t).width(this.data.get("width")),e("<div>").html(t).html()},getImageData:function(t){if(!t)return!1;var n=t.at(0).toJSON(),r=this.getSelectedImage(n),i=e.extend({},this.defaultData,{attachmentId:n.ID,title:n.post_tite,imageFull:n.image,imageThumb:this.getThumb(n.additional_sizes),linkType:"do_nothing",linkUrl:"",align:"center",captionPosition:"nocaption"});return i},getThumb:function(e){var t={width:0};return _.each(e,function(e){e.width<=500&&e.width>t.width&&(t=e)}),t},getSelectedImage:function(e){if(e.selected_size=="full")return e.image;var t=e.selected_size?e.selected_size.split("x"):[];if(t.length!=2)return e.image;for(var n=0;n<e.additional_sizes.length;n++){var r=e.additional_sizes[n];if(r.width==t[0]&&r.height==t[1])return r}return e.image},importInserts:function(t,n){var r=this,i=t.find("img"),s={};return i.each(function(){var t=e(this),i=t.closest(".upfront-inserted_image-wrapper"),o=!1;i.length?o=r.importFromWrapper(i,n):o=r.importFromImage(t),s[o.data.id]=o}),s},importFromWrapper:function(e,t){var n=e.attr("id"),r=!1,s=!1,o=!1;return t[n]?r=new i({data:t[n]}):(r=this.importFromImage(e.find("img")),s=e.css("float"),s!="none"&&r.data.set("align",s),o=e.find(".wp-caption-text"),o.length&&(r.data.set("caption",o.html()),e.hasClass("uinsert-caption-left")?r.data.set("captionPosition","left"):e.hasClass("uinsert-caption-right")?r.data.set("captionPosition","right"):r.data.set("captionPosition","bottom"))),r.render(),e.replaceWith(r.$el),r},importFromImage:function(t){var n=this.defaultData,r={src:t.attr("src"),width:t.width(),height:t.height()},s=e("<a>").attr("href",r.src)[0],o=this.calculateRealSize(r.src);s.origin!=window.location.origin&&(n.isLocal=0),this.calculateRealSize(r.src),n.imageThumb=r,n.imageFull={width:o.width,height:o.height,src:r.src};var u="center";t.hasClass("aligncenter")?u="center":t.hasClass("alignleft")?u="left":t.hasClass("alignright")&&(u="right"),n.align=u;var a=t.parent();a.is("a")&&(n.linkUrl=a.attr("href"),n.linkType="external");var f=t.attr("class");f?(f=f.match(/wp-image-(\d+)/),f?n.attachmentId=f[1]:n.attachmentId=!1):n.attachmentId=!1,n.title=t.attr("title");var l=new i({data:n});return l.render(),t.replaceWith(l.$el),l},getLinkView:function(){if(this.linkView)return linkView;var e=new s({data:{linkType:this.data.get("linkType"),linkUrl:this.data.get("linkUrl")}});return this.linkView=e,e},calculateRealSize:function(e){var t=new Image;return t.src=e,{width:t.width,height:t.height}},generateThumbSrc:function(e,t){var n=this.data.get("imageFull").src,r=n.split("."),i=r.pop();return n=r.join(".")+"-"+e+"x"+t+"."+i,n},onStartResizing:function(){console.log("start resizing"),this.resizeCache={wrapper:this.$(".uinsert-image-wrapper"),image:this.$("img"),caption:this.$("wp-caption-text"),imagedata:this.data.get("imageFull"),captionPosition:this.data.get("captionPosition"),align:this.data.get("align")},this.controls.$el.hide()},onStopResizing:function(e,t){console.log("stop resizing");var n=this.resizeCache.wrapper,r=n.width(),i=n.height(),s={imageThumb:{width:r,height:i,src:this.generateThumbSrc(r,i)},width:this.$el.width()};if(!parseInt(this.data.get("isLocal"),10)){var o=n.find("img"),u=o.position();u.width=o.width(),u.height=o.height(),console.log(u),s.imageThumb.src=this.data.get("imageFull").src,s.externalImage=u}this.data.set(s,{silent:!0}),this.controls.$el.show(),this.updateControlsPosition()},onResizing:function(t,n){if(t.target!=this.el)return;this.resizeCache.align=="right"&&e(this.$el).css("left",0);var r=this.resizeCache.wrapper,i=r.parents(".ueditable"),s=this.resizeCache.captionPosition;if(s=="nocaption"){if(i.length&&n.size.width>i.width())return!1;r.css(n.size)}else s=="bottom"?r.css({width:n.size.width,height:n.size.height-this.resizeCache.caption.outerHeight()}):r.height(n.size.height);this.$el.css({height:"auto"});var o=this.calculateImageResize({width:r.width(),height:r.height()},this.resizeCache.imagedata);this.resizeCache.image.css(o)},calculateImageResize:function(e,t){var n=t.width/t.height>e.width/e.height?"height":"width",r=t[n]/e[n],i={width:Math.round(t.width/r),height:Math.round(t.height/r)},s=n=="width";return i.top=s?-Math.round((i.height-e.height)/2):0,i.left=s?0:-Math.round((i.width-e.width)/2),i},resizableImage:function(){var t=this,n=this.data.get("captionPosition"),r={w:".upfront-resize-handle-w"},i="w",s=Upfront.Behaviors.GridEditor.col_size;n=="right"&&(r={e:".upfront-resize-handle-e"},i="e"),this.$(".uinsert-image-wrapper").append('<span class="upfront-icon-control upfront-icon-control-resize-'+i+" upfront-resize-handle-"+i+" ui-resizable-handle ui-resizable-"+i+' nosortable" style="display: inline;"></span>').resizable({handles:r,start:function(n){var r=t.$el.width();t.onStartResizing(),t.$el.width(t.$el.width()),e(this).resizable("option",{maxWidth:r-2*s,minWidth:2*s})},resize:function(n,r){var i=t.resizeCache.wrapper,s=t.calculateImageResize({width:i.width(),height:i.height()},t.resizeCache.imagedata);t.resizeCache.image.css(s),e(this).css({left:0})},stop:function(e,n){t.onStopResizing()},grid:[s,Upfront.Behaviors.GridEditor.baseline]})}}),s=Backbone.View.extend({tpl:_.template(e(t).find("#image-link-tpl").html()),initialize:function(e){e.data&&(this.model=new Backbone.Model(e.data),this.listenTo(this.model,"change",this.render))},events:{"change input[type=radio]":"updateData"},render:function(){this.$el.width("200px");var e=this.model.toJSON();e.checked='checked="checked"',this.$el.html(this.tpl(e))},updateData:function(e){var t=this,n=this.$("input:checked").val(),r=this.$("#uinsert-image-link-url").val();if(n=="post"){var i={postTypes:this.postTypes()};Upfront.Views.Editor.PostSelector.open(i).done(function(e){t.model.set({linkType:"post",linkUrl:e.get("permalink")})})}else this.model.set({linkType:n,linkUrl:r})},postTypes:function(){var e=[];return _.each(Upfront.data.ugallery.postTypes,function(t){t.name!="attachment"&&e.push({name:t.name,label:t.label})}),e}}),o=r.extend({type:"embed",className:"ueditor-insert upfront-inserted_embed-wrapper uinsert-drag-handle",tpl:_.template(e(t).find("#embed-insert-tpl").html()),defaultData:{code:" "},init:function(){var e=this.getAligmnentControlData(["left","center","full","right"]);e.selected=this.data.get("align")||"center",this.controlsData=[e,{id:"code",type:"dialog",icon:"embed",tooltip:"Change code",view:this.getFormView()},this.getRemoveControlData()],this.createControls()},render:function(){var e=this.data.toJSON();this.$el.html(this.tpl(e)).removeClass("aligncenter alignleft alignright alignfull").addClass("align"+this.data.get("align")),this.controls.render(),this.$el.append(this.controls.$el)},controlEvents:function(){this.stopListening(this.controls),this.listenTo(this.controls,"control:click:remove",function(e){this.trigger("remove",this)}),this.listenTo(this.controls,"control:select:alignment",function(e){this.data.set("align",e)}),this.listenTo(this.controls,"control:ok:code",function(e,t){var n={code:e.$("textarea").val()};this.data.set(n),t.close()})},start:function(){var t=e.Deferred();return t.resolve(),this.onStartActions(),t.promise()},onStartActions:function(){var e=this;this.controls.$el.show(function(){e.controls.$el.find(".upfront-icon-region-embed").next(".uimage-control-panel").show(),e.controls.$el.find(".upfront-icon-region-embed").click(),e.controls.$el.find(".upfront-field-embed_code").focus()})},getOutput:function(){var t=this.el.cloneNode(),n=this.data.toJSON();return t.innerHTML=this.tpl(n),e("<div>").html(t).html()},importInserts:function(t,n){var r=this,i=t.find(".upfront-inserted_embed-wrapper"),s={};return i.each(function(){var t=e(this),i=!1;t.length?i=r.importFromWrapper(e(this),n):i=o({data:"Default data"}),s[i.data.id]=i}),s},importFromWrapper:function(e,t){var n=e.attr("id"),r=!1,i=!1;return r=new o({data:t[n]}),r.render(),e.replaceWith(r.$el),r},getFormView:function(){if(this.formView)return this.formView;var e=new u({data:{code:this.data.get("code")}});return this.formView=e,e.on(),e}}),u=Backbone.View.extend({tpl:_.template(e(t).find("#embed-insert-form-tpl").html()),initialize:function(e){e.data&&(this.model=new Backbone.Model(e.data),this.listenTo(this.model,"change",this.render))},events:{},render:function(){this.$el.width("400px");var e=this.model.toJSON();this.$el.html(this.tpl(e))}}),a={};return a[n.IMAGE]=i,a[n.EMBED]=o,{UeditorInsert:r,inserts:a,TYPES:n}})})(jQuery);