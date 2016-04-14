!function(t){define(["text!scripts/redactor/ueditor-templates.html"],function(e){var i=Backbone.View.extend({shortcodeName:"ueditor-insert",attributes:{contenteditable:"false"},defaultData:{},resizable:!1,initialize:function(t){t=t||{};var e=t.data||{};e.id||(e.id=this.generate_new_id(),Upfront.Events.trigger("content:insertcount:updated")),this.el.id=e.id,this.data=new Backbone.Model(e),this.listenTo(this.data,"change add remove reset",this.render),this.createControls(),"function"==typeof this.init&&this.init(t)},generate_new_id:function(){return"uinsert-"+ ++Upfront.data.ueditor.insertCount},start:function(){var e=t.Deferred();return e.resolve(),e.promise()},getOutput:function(){var t=this.data.toJSON(),e='[ueditor-insert type="'+this.type+'"';return _.each(t,function(t,i){e+=" "+i+'="'+t+'"'}),e+"]"},importInserts:function(e){var i=this,n=new RegExp("(["+this.shortcodeName.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")+"[^]]*?])","ig"),o=e.html(),s=t("<div></div>");o=o.replace(n,'<p class="ueditor-insert">$1</p>');var r=s.html(o).find("p.ueditor-insert");r.each(function(){var t=i.parseShortcode(this.innerHTML);t.type&&insertObjects[t.type]})},parseShortcode:function(e){var i,n=/\[([^\s\]]+)([^\]]*?)\]/i,o=/(\w+)\s*=\s*"([^"]*)"(?:\s|$)|(\w+)\s*=\s*\'([^\']*)\'(?:\s|$)|(\w+)\s*=\s*([^\s\'"]+)(?:\s|$)|"([^"]*)"(?:\s|$)|(\S+)(?:\s|$)/gi,s=e.match(n),r={};if(!s)return!1;if(r.shortcodeName=s[1],i=t.trim(s[2])){var l=i.match(o);l&&_.each(l,function(e){e=t.trim(e);var i=e.split("=");if(1==i.length)r[e]=e;else{var n=t.trim(i[0]),o=t.trim(i.slice(1).join("="));('"'==o[0]&&'"'==o[o.length-1]||"'"==o[0]&&"'"==o[o.length-1])&&(o=o.slice(1,-1)),r[n]=o}})}return r},createControls:function(){var t=this,e=Upfront.Views.Editor.InlinePanels;if(this.controls&&(this.controls.remove(),this.controls=!1),this.controlsData){this.controls=e.ControlPanel.extend({position_v:"top"}),this.controls=new this.controls;var i=[];_.each(this.controlsData,function(n){var o;if("simple"==n.type)o=t.createSimpleControl(n),t.controls.listenTo(o,"click",function(){t.controls.trigger("control:click",o),t.controls.trigger("control:click:"+o.id,o)});else if("multi"==n.type){if(o=new e.TooltipControl,o.selected=n.selected,n.subItems){var s={};_.each(n.subItems,function(e){s[e.id]=t.createSimpleControl(e)}),o.sub_items=s}t.controls.listenTo(o,"select",function(e){t.controls.trigger("control:select:"+o.id,e)})}else"dialog"==n.type&&(o=new e.DialogControl,o.view=n.view,t.controls.listenTo(o,"panel:ok",function(e){t.controls.trigger("control:ok:"+o.id,e,o)}),t.controls.listenTo(o,"panel:open",function(){t.controls.$el.addClass("uinsert-control-visible"),t.$el.addClass("nosortable")}),t.controls.listenTo(o,"panel:close",function(){t.controls.$el.removeClass("uinsert-control-visible"),t.$el.removeClass("nosortable")}));o&&(_.extend(o,n),i.push(o))}),this.controls.items=_(i),this.controls.render(),"function"==typeof this.controlEvents&&this.controlEvents(),this.controls.delegateEvents()}},createSimpleControl:function(t){var e=new Upfront.Views.Editor.InlinePanels.Control;return e.icon=t.icon,e.tooltip=t.tooltip,e.id=t.id,e.label=t.label,e},getAligmnentControlData:function(t){var e={left:{id:"left",icon:"alignleft",tooltip:"Align left"},right:{id:"right",icon:"alignright",tooltip:"Align right"},center:{id:"center",icon:"aligncenter",tooltip:"Align center"},full:{id:"full",icon:"alignfull",tooltip:"Full width"}},i={id:"alignment",type:"multi",icon:"alignment",tooltip:"Alignment",subItems:[]};return _.each(t,function(t){e[t]&&i.subItems.push(e[t])}),i},getRemoveControlData:function(){return{id:"remove",type:"simple",icon:"remove",tooltip:"Delete"}},resizableInsert:function(){if(this.resizable){var t=this.data.get("align"),e=!0,i=!0,n=".upfront-icon-control-resize-se",o={},s=Upfront.Behaviors.GridEditor;this.$el.hasClass("ui-resizable")&&this.$el.resizable("destroy"),"left"==t?e=!1:"right"==t&&(i=!1,n=".upfront-icon-control-resize-sw"),this.$(n).length||(i&&(this.$el.append('<span class="upfront-icon-control upfront-icon-control-resize-se upfront-resize-handle-se ui-resizable-handle ui-resizable-se nosortable" style="display: inline;"></span>'),o.se=".upfront-icon-control-resize-se"),e&&(this.$el.append('<span class="upfront-icon-control upfront-icon-control-resize-sw upfront-resize-handle-sw ui-resizable-handle ui-resizable-sw nosortable" style="display: inline;"></span>'),o.sw=".upfront-icon-control-resize-sw"));var r=this.getResizableOptions?this.getResizableOptions():{};r.handles=o,r.grid=[s.col_size,s.baseline],this.$el.resizable(r)}}});return{UeditorInsert:i}})}(jQuery);