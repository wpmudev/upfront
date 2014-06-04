(function(e){define(["text!scripts/redactor/ueditor-templates.html"],function(t){var n={IMAGE:"image",EMBED:"embed"},r=Backbone.View.extend({shortcodeName:"ueditor-insert",attributes:{contenteditable:"false"},defaultData:{},initialize:function(e){e=e||{};var t=e.data||{};t=_.extend({},this.defaultData,t),t.id||(t.id="uinsert-"+ ++Upfront.data.ueditor.insertCount,Upfront.Events.trigger("content:insertcount:updated")),this.el.id=t.id,this.data=new Backbone.Model(t),this.listenTo(this.data,"change add remove reset",this.render),this.createControls(),typeof this.init=="function"&&this.init()},start:function(){var t=e.Deferred();return t.resolve(),t.promise()},getOutput:function(){var e=this.data.toJSON(),t='[ueditor-insert type="'+this.type+'"';return _.each(e,function(e,n){t+=" "+n+'="'+e+'"'}),t+"]"},importInserts:function(t){var n=this,r=new RegExp("(["+this.shortcodeName+"[^]]*?])","ig"),i=t.html(),s=e("<div></div>");i=i.replace(r,'<p class="ueditor-insert">$1</p>');var o=s.html(i).find("p.ueditor-insert");o.each(function(){var e=n.parseShortcode(this.innerHTML);e.type&&a[e.type]})},parseShortcode:function(t){var n=/\[([^\s\]]+)([^\]]*?)\]/i,r=/(\w+)\s*=\s*"([^"]*)"(?:\s|$)|(\w+)\s*=\s*\'([^\']*)\'(?:\s|$)|(\w+)\s*=\s*([^\s\'"]+)(?:\s|$)|"([^"]*)"(?:\s|$)|(\S+)(?:\s|$)/ig,i=t.match(n),s={},o;console.log("insert");if(!i)return!1;s.shortcodeName=i[1],o=e.trim(i[2]);if(o){var u=o.match(r);u&&_.each(u,function(t){t=e.trim(t);var n=t.split("=");if(n.length==1)s[t]=t;else{var r=e.trim(n[0]),i=e.trim(n.slice(1).join("="));if(i[0]=='"'&&i[i.length-1]=='"'||i[0]=="'"&&i[i.length-1]=="'")i=i.slice(1,-1);s[r]=i}})}return s},createControls:function(){var e=this,t=Upfront.Views.Editor.InlinePanels;this.controls&&(this.controls.remove(),this.controls=!1);if(!this.controlsData)return;this.controls=new t.ControlPanel;var n=[];_.each(this.controlsData,function(r){var i;if(r.type=="simple")i=e.createSimpleControl(r),e.controls.listenTo(i,"click",function(){e.controls.trigger("control:click",i),e.controls.trigger("control:click:"+i.id,i)});else if(r.type=="multi"){i=new t.TooltipControl,i.selected=r.selected;if(r.subItems){var s={};_.each(r.subItems,function(t){s[t.id]=e.createSimpleControl(t)}),i.sub_items=s}e.controls.listenTo(i,"select",function(t){e.controls.trigger("control:select:"+i.id,t)})}else r.type=="dialog"&&(i=new t.DialogControl,i.view=r.view,e.controls.listenTo(i,"panel:ok",function(t){e.controls.trigger("control:ok:"+i.id,t,i)}),e.controls.listenTo(i,"panel:open",function(){e.controls.$el.addClass("uinsert-control-visible"),e.$el.addClass("nosortable")}),e.controls.listenTo(i,"panel:close",function(){e.controls.$el.removeClass("uinsert-control-visible"),e.$el.removeClass("nosortable")}));i&&(i.icon=r.icon,i.tooltip=r.tooltip,i.id=r.id,n.push(i))}),this.controls.items=_(n),this.controls.render(),typeof this.controlEvents=="function"&&this.controlEvents(),this.controls.delegateEvents()},createSimpleControl:function(e){var t=new Upfront.Views.Editor.InlinePanels.Control;return t.icon=e.icon,t.tooltip=e.tooltip,t.id=e.id,t},getAligmnentControlData:function(e){var t={left:{id:"left",icon:"alignleft",tooltip:"Align left"},right:{id:"right",icon:"alignright",tooltip:"Align right"},center:{id:"center",icon:"aligncenter",tooltip:"Align center"},full:{id:"full",icon:"alignfull",tooltip:"Full width"}},n={id:"alignment",type:"multi",icon:"alignment",tooltip:"Alignment",subItems:[]};return _.each(e,function(e){t[e]&&n.subItems.push(t[e])}),n},getRemoveControlData:function(){return{id:"remove",type:"simple",icon:"remove",tooltip:"Delete"}}}),i=r.extend({type:"image",className:"ueditor-insert upfront-inserted_image-wrapper",tpl:_.template(e(t).find("#image-insert-tpl").html()),defaultData:{captionPosition:"nocaption",caption:"A wonderful image :)",imageFull:{src:"",width:100,height:100},imageThumb:{src:"",width:100,height:100},linkType:"do_nothing",linkUrl:""},init:function(){var e=this.getAligmnentControlData(["left","center","full","right"]);e.selected=this.data.get("align"),this.controlsData=[e,{id:"link",type:"dialog",icon:"link",tooltip:"Link image",view:this.getLinkView()},{id:"caption",type:"multi",icon:"caption",tooltip:"Caption",selected:this.data.get("captionPosition")||"nocaption",subItems:[{id:"nocaption",icon:"nocaption",tooltip:"No caption"},{id:"left",icon:"caption-left",tooltip:"At the left"},{id:"bottom",icon:"caption-bottom",tooltip:"At the bottom"},{id:"right",icon:"caption-right",tooltip:"At the right"}]},this.getRemoveControlData()],this.createControls()},start:function(){var e=this,t=Upfront.Media.Manager.open();return t.done(function(t,n){var r=e.getImageData(n);r.id=e.data.id,e.data.clear({silent:!0}),console.log(r),e.data.set(r),e.controlsData[0].selected=e.data.get("align"),e.createControls()}),t},render:function(){var e=this,t=this.data.toJSON();t.align=="full"?t.image=t.imageFull:t.image=t.imageThumb,t.captionPosition=="left"||t.captionPosition=="right"?this.$el.css({"min-width":parseInt(t.image.width,10)+100+"px","max-width":2*parseInt(t.image.width,10)+"px"}):this.$el.css({"min-width":"auto","max-width":"auto"}),this.$el.html(this.tpl(t)).removeClass("aligncenter alignleft alignright alignfull").addClass("align"+this.data.get("align")),this.controls.render(),this.$el.append(this.controls.$el),this.captionTimer=!1,this.$(".wp-caption-text").attr("contenteditable",!0).addClass("nosortable").off("keyup").on("keyup",function(t){e.data.set("caption",this.innerHTML,{silent:!0}),e.data.trigger("update")})},controlEvents:function(){this.stopListening(this.controls),this.listenTo(this.controls,"control:click:remove",function(e){console.log(e),this.trigger("remove",this)}),this.listenTo(this.controls,"control:select:alignment",function(e){this.data.set("align",e)}),this.listenTo(this.controls,"control:ok:link",function(e,t){var n={linkType:e.$("input[type=radio]:checked").val()||"do_nothing",linkUrl:e.$("input[type=text]").val()};this.data.set(n),t.close()}),this.listenTo(this.controls,"control:select:caption",function(e){this.data.set({captionPosition:e})})},getOutput:function(){var t=this.el.cloneNode(),n=this.data.toJSON();return n.align=="full"?n.image=n.imageFull:n.image=n.imageThumb,n.caption=n.caption||this.defaultData.caption,this.data.set("width",this.$el.width(),{silent:!0}),this.data.trigger("update"),t.innerHTML=this.tpl(n),e(t).width(this.data.get("width")),e("<div>").html(t).html()},getImageData:function(t){if(!t)return!1;var n=t.at(0).toJSON(),r=this.getSelectedImage(n),i=e.extend({},this.defaultData,{attachmentId:n.ID,title:n.post_tite,imageFull:n.image,imageThumb:this.getThumb(n.additional_sizes),linkType:"do_nothing",linkUrl:"",align:"center",captionPosition:"nocaption"});return i},getThumb:function(e){var t={width:0};return _.each(e,function(e){e.width<=500&&e.width>t.width&&(t=e)}),t},getSelectedImage:function(e){if(e.selected_size=="full")return e.image;var t=e.selected_size.split("x");if(t.length!=2)return e.image;for(var n=0;n<e.additional_sizes.length;n++){var r=e.additional_sizes[n];if(r.width==t[0]&&r.height==t[1])return r}return e.image},importInserts:function(t,n){var r=this,i=t.find("img"),s={};return i.each(function(){var t=e(this),i=t.closest(".upfront-inserted_image-wrapper"),o=!1;i.length?o=r.importFromWrapper(i,n):o=r.importFromImage(t),s[o.data.id]=o}),s},importFromWrapper:function(e,t){var n=e.attr("id"),r=!1,s=!1,o=!1;return t[n]?r=new i({data:t[n]}):(r=this.importFromImage(e.find("img")),s=e.css("float"),s!="none"&&r.data.set("align",s),o=e.find(".wp-caption-text"),o.length&&(r.data.set("caption",o.html()),e.hasClass("uinsert-caption-left")?r.data.set("captionPosition","left"):e.hasClass("uinsert-caption-right")?r.data.set("captionPosition","right"):r.data.set("captionPosition","bottom"))),r.render(),e.replaceWith(r.$el),r},importFromImage:function(e){var t=this.defaultData,n={src:e.attr("src"),width:e.width(),height:e.height()};t.imageFull=n,t.imageThumb=n;var r="center";e.hasClass("aligncenter")?r="center":e.hasClass("alignleft")?r="left":e.hasClass("alignright")&&(r="right"),t.align=r;var s=e.parent();s.is("a")&&(t.linkUrl=s.attr("href"),t.linkType="external");var o=e.attr("class");o?(o=o.match(/wp-image-(\d+)/),o?t.attachmentId=o[1]:t.attachmentId=!1):t.attachmentId=!1,t.title=e.attr("title");var u=new i({data:t});return u.render(),e.replaceWith(u.$el),u},getLinkView:function(){if(this.linkView)return linkView;var e=new s({data:{linkType:this.data.get("linkType"),linkUrl:this.data.get("linkUrl")}});return this.linkView=e,e}}),s=Backbone.View.extend({tpl:_.template(e(t).find("#image-link-tpl").html()),initialize:function(e){e.data&&(this.model=new Backbone.Model(e.data),this.listenTo(this.model,"change",this.render))},events:{"change input[type=radio]":"updateData"},render:function(){this.$el.width("200px");var e=this.model.toJSON();e.checked='checked="checked"',this.$el.html(this.tpl(e))},updateData:function(e){var t=this,n=this.$("input:checked").val(),r=this.$("#uinsert-image-link-url").val();if(n=="post"){var i={postTypes:this.postTypes()};Upfront.Views.Editor.PostSelector.open(i).done(function(e){t.model.set({linkType:"post",linkUrl:e.get("permalink")})})}else this.model.set({linkType:n,linkUrl:r})},postTypes:function(){var e=[];return _.each(Upfront.data.ugallery.postTypes,function(t){t.name!="attachment"&&e.push({name:t.name,label:t.label})}),e}}),o=r.extend({type:"embed",className:"ueditor-insert upfront-inserted_embed-wrapper",tpl:_.template(e(t).find("#embed-insert-tpl").html()),defaultData:{code:" "},init:function(){var e=this.getAligmnentControlData(["left","center","full","right"]);e.selected=this.data.get("align")||"center",this.controlsData=[e,{id:"code",type:"dialog",icon:"embed",tooltip:"Change code",view:this.getFormView()},this.getRemoveControlData()],this.createControls()},render:function(){var e=this.data.toJSON();this.$el.html(this.tpl(e)).removeClass("aligncenter alignleft alignright alignfull").addClass("align"+this.data.get("align")),this.controls.render(),this.$el.append(this.controls.$el)},controlEvents:function(){this.stopListening(this.controls),this.listenTo(this.controls,"control:click:remove",function(e){this.trigger("remove",this)}),this.listenTo(this.controls,"control:select:alignment",function(e){this.data.set("align",e)}),this.listenTo(this.controls,"control:ok:code",function(e,t){var n={code:e.$("textarea").val()};this.data.set(n),t.close()})},start:function(){var t=e.Deferred();return t.resolve(),this.onStartActions(),t.promise()},onStartActions:function(){var e=this;this.controls.$el.show(function(){e.controls.$el.find(".upfront-icon-region-embed").next(".uimage-control-panel").show(),e.controls.$el.find(".upfront-icon-region-embed").click(),e.controls.$el.find(".upfront-field-embed_code").focus()})},getOutput:function(){var t=this.el.cloneNode(),n=this.data.toJSON();return n.align=="full"&&(n.src=n.srcFull||n.src),t.innerHTML=this.tpl(n),e("<div>").html(t).html()},importInserts:function(t,n){var r=this,i=t.find(".upfront-inserted_embed-wrapper"),s={};return i.each(function(){var t=e(this),i=!1;t.length?i=r.importFromWrapper(e(this),n):i=o({data:"Default data"}),s[i.data.id]=i}),s},importFromWrapper:function(e,t){var n=e.attr("id"),r=!1,i=!1;return r=new o({data:t[n]}),r.render(),e.replaceWith(r.$el),r},getFormView:function(){if(this.formView)return this.formView;var e=new u({data:{code:this.data.get("code")}});return this.formView=e,e.on(),e}}),u=Backbone.View.extend({tpl:_.template(e(t).find("#embed-insert-form-tpl").html()),initialize:function(e){e.data&&(this.model=new Backbone.Model(e.data),this.listenTo(this.model,"change",this.render))},events:{},render:function(){this.$el.width("400px");var e=this.model.toJSON();this.$el.html(this.tpl(e))}}),a={};return a[n.IMAGE]=i,a[n.EMBED]=o,{UeditorInsert:r,inserts:a,TYPES:n}})})(jQuery);