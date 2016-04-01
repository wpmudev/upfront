(function(e){var t={selection:[],selecting:!1,create_mergeable:function(t,n){var r=this,i=Upfront.Behaviors.LayoutEditor,s=r.layout.get("regions");t.$el.selectable({distance:10,filter:".upfront-module",cancel:".upfront-module:not(.upfront-module-spacer), .upfront-module-group, .upfront-region-side-fixed, .upfront-entity_meta, .upfront-region-edit-trigger, .upfront-region-edit-fixed-trigger, .upfront-region-finish-edit, .upfront-icon-control-region-resize, .upfront-inline-modal, .upfront-inline-panels",selecting:function(t,n){var r=e(n.selecting),s,o,u,a,f;if(r.closest(".upfront-module-group").length>0)return;if(i.selection.length>0){s=e(i.selection[0]).closest(".upfront-region");if(r.closest(".upfront-region").get(0)!=s.get(0))return;i._add_selections(s.find(".ui-selecting"),s.find(".upfront-module").not(".upfront-ui-selected, .upfront-module-parent-group"),s.find(".upfront-module-group"))}else i._add_selection(n.selecting);i._update_selection_outline()},unselecting:function(t,n){var r=e(n.unselecting),s,o;if(i.selection.length>1){s=e(i.selection[0]).closest(".upfront-region");if(r.closest(".upfront-region").get(0)!=s.get(0))return;e(".upfront-ui-selected").each(function(){i._remove_selection(this)}),o=s.find(".ui-selecting"),o.length>0&&(i._add_selection(o.get(0)),i._add_selections(o,s.find(".upfront-module").not(".upfront-ui-selected, .upfront-module-parent-group"),s.find(".upfront-module-group"))),i._update_selection_outline();return}i._remove_selection(n.unselecting),i._update_selection_outline()},unselected:function(t,n){var r=e(n.unselected);r.find(".upfront-selected-border").remove(),e(".upfront-module-group-group").remove()},start:function(e,t){i.remove_selections(),i.selection=[],i.selecting=!0},stop:function(e,t){i.parse_selections()}})},refresh_mergeable:function(){this.remove_selections(),e(".ui-selectable").each(function(){e(this).selectable("refresh")})},enable_mergeable:function(){this.remove_selections(),e(".ui-selectable").each(function(){e(this).selectable("enable")})},disable_mergeable:function(){this.remove_selections(),e(".ui-selectable").each(function(){e(this).selectable("disable")})},destroy_mergeable:function(){this.remove_selections(),e(".ui-selectable").each(function(){e(this).selectable("destroy")})},parse_selections:function(){if(!e(".upfront-ui-selected").length)return!1;if(!Upfront.Application.user_can_modify_layout())return!1;var t=this,n=Upfront.Application.layout.get("regions"),r=e(".upfront-ui-selected:first").closest(".upfront-region"),i=n.get_by_name(r.data("name")),s=i?i.get("modules"):!1,o=i?i.get("wrappers"):!1,u=function(){e(this).find(".upfront-selected-border").remove(),e(this).removeClass("upfront-ui-selected ui-selected")},a=e(".upfront-ui-selected");if(a.length<2)return a.each(function(){t._remove_selection(this)}),e("#upfront-group-selection").remove(),!1;e(".upfront-module-group-group").remove();var f=e('<div class="upfront-module-group-toggle upfront-module-group-group">'+Upfront.Settings.l10n.global.behaviors.group+"</div>"),l=sel_left=sel_right=sel_bottom=!1,c=wrap_left=wrap_right=wrap_bottom=!1,h=group_left=0;e("body").append(f),a.each(function(){var t=e(this).offset(),n=e(this).outerWidth(),r=e(this).outerHeight(),i=e(this).closest(".upfront-wrapper"),s=i.offset(),o=i.outerWidth(),u=i.outerHeight();t.right=t.left+n,t.bottom=t.top+r,l=l===!1||t.top<l?t.top:l,sel_bottom=sel_bottom===!1||t.bottom>sel_bottom?t.bottom:sel_bottom,sel_left=sel_left===!1||t.left<sel_left?t.left:sel_left,sel_right=sel_right===!1||t.right>sel_right?t.right:sel_right,s.right=s.left+o,s.bottom=s.top+u,c=c===!1||s.top<c?s.top:c,wrap_bottom=wrap_bottom===!1||s.bottom>wrap_bottom?s.bottom:wrap_bottom,wrap_left=wrap_left===!1||s.left<wrap_left?s.left:wrap_left,wrap_right=wrap_right===!1||s.right>wrap_right?s.right:wrap_right}),h=l+Math.round((sel_bottom-l)/2)-Math.round(f.outerHeight()/2),group_left=sel_left+Math.round((sel_right-sel_left)/2)-Math.round(f.outerWidth()/2),f.css({position:"absolute",zIndex:999999,top:h,left:group_left}),setTimeout(function(){t.selecting=!1},1e3),f.on("click",function(){var n=Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),u=Upfront.Behaviors.GridEditor,f=!1,l=Math.round((wrap_right-wrap_left)/u.grid.column_width),c=u.parse_modules_to_lines(s,o,n.id,n.columns),h=[],p=[],d=[],v=!1,m=!1,g=0,y=0,b=0,w=!1;_.each(c,function(t){var n=[],r=[],i=[],s=[],o=[],u=0,l=0,c=0;_.each(t.wrappers,function(t){var h=[],p=[],d=[];_.each(t.modules,function(t){var n=!1;a.each(function(){var r=e(this).attr("id"),i;t.model.get_element_id()==r&&(f===!1&&(f=Upfront.data.module_views[t.model.cid]),h.push(t),n=!0)}),n||(h.length==0?p.push(t):d.push(t))}),h.length>0?(n.push({modules:h,top_modules:p,bottom_modules:d,model:t.model,col:t.col,clear:t.clear,spacer:t.spacer,order:t.order}),u+=t.col,p.length&&s.push({modules:p,model:t.model,col:t.col,clear:t.clear,spacer:t.spacer,order:t.order}),d.length&&o.push({modules:d,model:t.model,col:t.col,clear:t.clear,spacer:t.spacer,order:t.order})):((n.length==0?r:i).push({modules:t.modules,model:t.model,col:t.col,clear:t.clear,spacer:t.spacer,order:t.order}),n.length==0?l+=t.col:c+=t.col)}),n.length>0&&(h.push({wrappers:n,top_wrappers:s,bottom_wrappers:o,col:u}),g=u>g?u:g,r.length>0&&(p.push({wrappers:r,col:l}),y=l>y?l:y),i.length>0&&(d.push({wrappers:i,col:c}),b=c>b?c:b))}),u.start(f,f.model),p.length>1&&(t._do_combine(p,i)||t._do_group(p,i)),p.length==0&&d.length==0&&(w=!0),t._do_group(h,i,!1,w),d.length>1&&(t._do_combine(d,i)||t._do_group(d,i)),u.update_position_data(r.find(".upfront-editable_entities_container:first")),u.update_wrappers(i),e(this).remove(),e("#upfront-group-selection").remove(),t.selection=[]})},_do_group:function(e,t,n,r){var i=this,s=Upfront.Behaviors.GridEditor,o=n===!0,r=r===!0,u=t.get("modules"),a=t.get("wrappers"),f=Upfront.Util.get_unique_id("module-group"),l=new Upfront.Models.ModuleGroup,c=!1,h=l.get("modules"),p=l.get("wrappers"),d=!1,v=!1,m=!1,g=0,y=!1,b=!1;_.each(e,function(e,n){g=e.col>g?e.col:g,_.each(e.wrappers,function(e,t){var r=new Upfront.Models.Wrapper({}),i=Upfront.Util.get_unique_id("wrapper"),o=Upfront.data.wrapper_views[e.model.cid],f="top_modules"in e&&e.top_modules.length>0,l="bottom_modules"in e&&e.bottom_modules.length>0;r.set_property("wrapper_id",i),r.set_property("class",e.model.get_property_value_by_name("class")),r.replace_class(s.grid.class+e.col),t==0&&(r.add_class("clr"),n==0&&(d=e.clear)),p.add(r),_.each(e.modules,function(e,t){var n=u.indexOf(e.model),r=Upfront.data.module_views[e.model.cid];y===!1&&(y=n),e.model.set_property("wrapper_id",i,!0),u.remove(e.model,{silent:!0}),r.$el.detach(),!f&&!l&&o.$el.detach(),h.add(e.model)}),n==0&&t==0?(m=e.model.get_wrapper_id(),v=e.model):f||a.remove(e.model)}),"bottom_wrappers"in e&&e.bottom_wrappers.length>1&&(r?i._do_split(e.bottom_wrappers,t):i._do_group([{wrappers:e.bottom_wrappers,col:e.col}],t)),"top_wrappers"in e&&e.top_wrappers.length>1&&(r?(_.each(e.top_wrappers,function(e,t){_.each(e.modules,function(e,t){var n=u.indexOf(e.model);if(b===!1){b=n;return}u.remove(e.model,{silent:!0}),b++,e.model.add_to(u,b)})}),b!==!1&&(y=b+1),o=!0):i._do_group([{wrappers:e.top_wrappers,col:e.col}],t))}),o&&(v=new Upfront.Models.Wrapper({}),m=Upfront.Util.get_unique_id("wrapper"),a.add(v)),v.set_property("wrapper_id",m),v.replace_class(s.grid.class+g),d&&v.add_class("clr"),l.set_property("wrapper_id",m),l.set_property("element_id",f),l.replace_class(s.grid.class+g),l.set_property("original_col",g),l.add_to(u,y),Upfront.Events.trigger("entity:module_group:group",l,t)},_do_combine:function(e,t){var n=this,r=Upfront.Behaviors.GridEditor,i=t.get("modules"),s=t.get("wrappers"),o=[],u=[],a=!0;_.each(e,function(e,t){t in o||(o[t]=[]),_.each(e.wrappers,function(e,n){n in u||(u[n]=[]),o[t][n]=e.col,u[n].push(e)})});if(o.length>1)for(var f=1;f<o.length;f++)if(!_.isEqual(o[f-1],o[f])){a=!1;break}return a?(_.each(u,function(e){var t=0,n=_.filter(e,function(e){return e.spacer}),r=e.length==n.length,o;_.each(e,function(e,n){if(n==0){o=e.model.get_wrapper_id(),t=i.indexOf(_.last(e.modules).model),e.spacer&&!r&&(_.each(e.modules,function(e){i.remove(e.model)}),t--);return}s.remove(e.model),e.spacer?_.each(e.modules,function(e){i.remove(e.model)}):_.each(e.modules,function(e,n){e.model.set_property("wrapper_id",o,!0),i.remove(e.model,{silent:!0}),t++,e.model.add_to(i,t)})})}),!0):!1},_do_split:function(e,t){var n=this,r=Upfront.Behaviors.GridEditor,i=t.get("modules"),s=t.get("wrappers");return _.each(e,function(e,t){var n=new Upfront.Models.Wrapper({}),r=Upfront.Util.get_unique_id("wrapper");n.set_property("wrapper_id",r),n.set_property("class",e.model.get_property_value_by_name("class")),s.add(n),_.each(e.modules,function(e,t){var n=i.indexOf(e.model);e.model.set_property("wrapper_id",r,!0),i.remove(e.model,{silent:!0}),e.model.add_to(i,n)})}),!0},_get_group_position:function(t){var n=sel_left=sel_right=sel_bottom=!1,r=wrap_left=wrap_right=wrap_bottom=!1;return t.each(function(){var t=e(this).offset(),i=Math.round(parseFloat(e(this).css("width"))),s=Math.round(parseFloat(e(this).css("height"))),o=e(this).closest(".upfront-wrapper"),u=o.offset(),a=Math.round(parseFloat(o.css("width"))),f=Math.round(parseFloat(o.css("height")));t.left=Math.round(t.left),t.top=Math.round(t.top),t.right=t.left+i,t.bottom=t.top+s,n=n===!1||t.top<n?t.top:n,sel_bottom=sel_bottom===!1||t.bottom>sel_bottom?t.bottom:sel_bottom,sel_left=sel_left===!1||t.left<sel_left?t.left:sel_left,sel_right=sel_right===!1||t.right>sel_right?t.right:sel_right,u.left=Math.round(u.left),u.top=Math.round(u.top),u.right=u.left+a,u.bottom=u.top+f,r=r===!1||u.top<r?u.top:r,wrap_bottom=wrap_bottom===!1||u.bottom>wrap_bottom?u.bottom:wrap_bottom,wrap_left=wrap_left===!1||u.left<wrap_left?u.left:wrap_left,wrap_right=wrap_right===!1||u.right>wrap_right?u.right:wrap_right}),{element:{top:n,bottom:sel_bottom,left:sel_left,right:sel_right},wrapper:{top:r,bottom:wrap_bottom,left:wrap_left,right:wrap_right}}},_find_affected_el:function(t,n){if(this.selection.length==0)return!1;var r=!1;return t.each(function(){var t=e(this).offset(),i=Math.round(parseFloat(e(this).css("width"))),s=Math.round(parseFloat(e(this).css("height"))),o=Math.round(t.top),u=Math.round(t.left),a=o+s,f=u+i;n.top<a&&n.bottom>o&&n.left<f&&n.right>u&&(r=r!==!1?r.add(e(this)):e(this))}),r},_update_selection_outline:function(){var t=e("#upfront-group-selection"),n=this._get_group_position(e(this.selection));t.length||(t=e('<div id="upfront-group-selection" />'),t.appendTo("body")),t.css({top:n.element.top,left:n.element.left,height:n.element.bottom-n.element.top,width:n.element.right-n.element.left})},_add_selection:function(t){var n=_.find(this.selection,function(e){return e==t});if(n)return;this.selection.push(t),e(t).addClass("upfront-ui-selected")},_add_selections:function(t,n,r){var i=this,s=[],o,u,a;t.each(function(){var t=this,f=_.find(i.selection,function(e){return e==t}),l=e(n);if(f)return;s=[],o=i._get_group_position(e(i.selection).add(this)),u=i._find_affected_el(l,o.element);while(u!==!1)u.each(function(){s.push(this)}),l=l.not(u),o=i._get_group_position(e(i.selection).add(s)),u=i._find_affected_el(l,o.element);a=i._find_affected_el(r,o.element);if(a!==!1)return;_.each(s,function(e){i._add_selection(e)})});return},_remove_selection:function(t){this.selection=_.reject(this.selection,function(e){return e==t}),e(t).find(".upfront-selected-border").remove(),e(t).removeClass("upfront-ui-selected ui-selected")},remove_selections:function(){var t=Upfront.Behaviors.LayoutEditor;e(".upfront-ui-selected").each(function(){t._remove_selection(this)}),t._update_selection_outline(),e(".upfront-module-group-group").remove()},create_undo:function(){this.layout.store_undo_state()},apply_history_change:function(){var e=Upfront.Application.layout.get("regions"),t=e?e.get_by_name("shadow"):!1;e&&t&&(e.remove(t),t=!1),Upfront.Application.layout_view.render()},save_dialog:function(t,n){e("body").append("<div id='upfront-save-dialog-background' />"),e("body").append("<div id='upfront-save-dialog' />");var r=e("#upfront-save-dialog"),i=e("#upfront-save-dialog-background"),s=Upfront.Application.layout.get("current_layout"),o="";o+="<p>"+Upfront.Settings.l10n.global.behaviors.this_post_only+"</p>",e.each(_upfront_post_data.layout,function(e,t){if(e=="type")return;o+='<span class="upfront-save-button" data-save-as="'+t+'">'+Upfront.Settings.LayoutEditor.Specificity[e]+"</span>"}),location.pathname.indexOf("create_new")>-1?(i.remove(),r.remove(),t.apply(n,["single-post"])):(r.html(o),e("#upfront-save-dialog").on("click",".upfront-save-button",function(){var s=e(this).attr("data-save-as");return i.remove(),r.remove(),t.apply(n,[s]),!1}),e("#upfront-save-dialog-background").on("click",function(){return i.remove(),r.remove(),!1}))},load_theme:function(e){var t=location.origin;t+=location.pathname.split("create_new")[0],t+="create_new/"+e,location.toString().indexOf("dev=true")>-1&&(t+="?dev=true"),window.location=t},open_theme_fonts_manager:function(){var t={},n=new Upfront.Views.Editor.Fonts.Text_Fonts_Manager({collection:Upfront.Views.Editor.Fonts.theme_fonts_collection});n.render();if(Upfront.Application.mode.current===Upfront.Application.MODE.THEME){var r=new Upfront.Views.Editor.Fonts.Icon_Fonts_Manager({collection:Upfront.Views.Editor.Fonts.icon_fonts_collection});r.render()}var i=Upfront.Popup.open(function(n,r,i){var s=e(this);s.empty().append('<p class="upfront-popup-placeholder">'+Upfront.Settings.l10n.global.behaviors.loading_content+"</p>"),t.$popup={top:r,content:s,bottom:i}},{width:750},"font-manager-popup");t.$popup.top.html('<ul class="upfront-tabs"><li id="theme-text-fonts-tab" class="active">'+Upfront.Settings.l10n.global.behaviors.theme_text_fonts+"</li>"+(Upfront.Application.mode.current===Upfront.Application.MODE.THEME?'<li id="theme-icon-fonts-tab">'+Upfront.Settings.l10n.global.behaviors.theme_icon_fonts+"</li>":"")+"</ul>"+t.$popup.top.html()),t.$popup.top.on("click","#theme-text-fonts-tab",function(r){t.$popup.content.html(n.el),e("#theme-icon-fonts-tab").removeClass("active"),e("#theme-text-fonts-tab").addClass("active"),e(".theme-fonts-ok-button").css("margin-top","30px")}),t.$popup.top.on("click","#theme-icon-fonts-tab",function(){t.$popup.content.html(r.el),e("#theme-text-fonts-tab").removeClass("active"),e("#theme-icon-fonts-tab").addClass("active"),e(".theme-fonts-ok-button").css("margin-top",0)}),t.$popup.bottom.append('<a class="theme-fonts-ok-button">'+Upfront.Settings.l10n.global.behaviors.ok+"</a>"),t.$popup.content.html(n.el),n.set_ok_button(t.$popup.bottom.find(".theme-fonts-ok-button")),t.$popup.bottom.find(".theme-fonts-ok-button").on("click",function(){Upfront.Popup.close()})},create_layout_dialog:function(){var t=Upfront.Application,n=Upfront.Behaviors.LayoutEditor,r={layout:new Upfront.Views.Editor.Field.Select({name:"layout",values:[{label:Upfront.Settings.l10n.global.behaviors.loading,value:""}],change:function(){var e=this.get_value();e==="single-page"?r.$_page_name_wrap.show():r.$_page_name_wrap.hide()}}),page_name:new Upfront.Views.Editor.Field.Text({name:"page_name",label:Upfront.Settings.l10n.global.behaviors.page_layout_name}),inherit:new Upfront.Views.Editor.Field.Radios({name:"inherit",layout:"horizontal-inline",values:[{label:Upfront.Settings.l10n.global.behaviors.start_fresh,value:""},{label:Upfront.Settings.l10n.global.behaviors.start_from_existing,value:"existing"}]}),existing:new Upfront.Views.Editor.Field.Select({name:"existing",values:[]})};n.available_layouts?r.layout.options.values=_.map(n.available_layouts,function(e,t){return{label:e.label,value:t,disabled:e.saved}}):Upfront.Util.post({action:"upfront_list_available_layout"}).done(function(e){n.available_layouts=e.data,r.layout.options.values=_.map(n.available_layouts,function(e,t){return{label:e.label,value:t,disabled:e.saved}}),r.layout.render(),r.layout.delegateEvents()}),n.all_templates?r.existing.options.values=_.map(n.all_templates,function(e,t){return{label:t,value:e}}):Upfront.Util.post({action:"upfront-wp-model",model_action:"get_post_extra",postId:"fake",allTemplates:!0}).done(function(e){if(!e.data||!e.data.allTemplates)return!1;if(0===e.data.allTemplates.length)return r.inherit.$el.hide(),r.existing.$el.hide(),!1;n.all_templates=e.data.allTemplates,r.existing.options.values=[],_.each(e.data.allTemplates,function(e,t){r.existing.options.values.push({label:t,value:e})}),r.existing.render()}),n.layout_modal||(n.layout_modal=new Upfront.Views.Editor.Modal({to:e("body"),button:!1,top:120,width:540}),n.layout_modal.render(),e("body").append(n.layout_modal.el)),n.layout_modal.open(function(t,i){var s=e('<div style="clear:both"><span class="uf-button">'+Upfront.Settings.l10n.global.behaviors.create+"</span></div>"),o=e('<div class="upfront-modal-select-wrap" />');$page_name_wrap=e('<div class="upfront-modal-select-wrap" />'),r.$_page_name_wrap=$page_name_wrap,_.each(r,function(e){if(!e.render)return!0;e.render(),e.delegateEvents()}),t.html('<h1 class="upfront-modal-title">'+Upfront.Settings.l10n.global.behaviors.create_new_layout+"</h1>"),o.append(r.layout.el),t.append(o),$page_name_wrap.hide(),$page_name_wrap.append(r.page_name.el),$page_name_wrap.append(r.inherit.el),$page_name_wrap.append(r.existing.el),t.append($page_name_wrap),t.append(s),s.on("click",function(){n.layout_modal.close(!0)})},n).done(function(){var e=r.layout.get_value(),i=t.layout.get("layout_slug"),s=_.extend({},n.available_layouts[e]),o=r.page_name.get_value();e==="single-page"&&o&&(e="single-page-"+o.replace(/\s/g,"-").toLowerCase(),s={layout:{type:"single",item:"single-page",specificity:e}}),s.use_existing=e.match(/^single-page/)&&o&&"existing"===r.inherit.get_value()?r.existing.get_value():!1,t.create_layout(s.layout,{layout_slug:i,use_existing:s.use_existing}).done(function(){t.layout.set("current_layout",e),n._export_layout()})})},browse_layout_dialog:function(){var t=Upfront.Application,n=Upfront.Behaviors.LayoutEditor,r={layout:new Upfront.Views.Editor.Field.Select({name:"layout",values:[{label:Upfront.Settings.l10n.global.behaviors.loading,value:""}],default_value:t.layout.get("current_layout")})};n.browse_modal||(n.browse_modal=new Upfront.Views.Editor.Modal({to:e("body"),button:!1,top:120,width:540}),n.browse_modal.render(),e("body").append(n.browse_modal.el)),n._get_saved_layout().done(function(e){!e||e.length==0?r.layout.options.values=[{label:Upfront.Settings.l10n.global.behaviors.no_saved_layout,value:""}]:r.layout.options.values=_.map(n.saved_layouts,function(e,t){return{label:e.label,value:t}}),r.layout.render(),r.layout.delegateEvents()}),n.browse_modal.open(function(t,i){var s=e('<span class="uf-button">'+Upfront.Settings.l10n.global.behaviors.edit+"</span>"),o=e('<div class="upfront-modal-select-wrap" />');_.each(r,function(e){e.render(),e.delegateEvents()}),t.html('<h1 class="upfront-modal-title">'+Upfront.Settings.l10n.global.behaviors.edit_saved_layout+"</h1>"),o.append(r.layout.el),t.append(o),t.append(s),s.on("click",function(){n.browse_modal.close(!0)})},n).done(function(){var e=r.layout.get_value(),i=t.layout.get("layout_slug"),s=n.saved_layouts[e];s.latest_post&&(_upfront_post_data.post_id=s.latest_post),t.layout.set("current_layout",e),t.load_layout(s.layout,{layout_slug:i})})},is_exporter_start_page:function(){return Upfront.themeExporter.currentTheme==="upfront"},export_dialog:function(){var t=Upfront.Application,n=Upfront.Behaviors.LayoutEditor,r,i;i=new Upfront.Views.Editor.Loading({loading:Upfront.Settings.l10n.global.behaviors.checking_layouts,done:Upfront.Settings.l10n.global.behaviors.layout_exported,fixed:!0}),n.is_exporter_start_page()?(r={theme:new Upfront.Views.Editor.Field.Select({name:"theme",default_value:Upfront.themeExporter.currentTheme==="upfront"?"":Upfront.themeExporter.currentTheme,label:Upfront.Settings.l10n.global.behaviors.select_theme,values:[{label:Upfront.Settings.l10n.global.behaviors.new_theme,value:""}],change:function(){var t=this.get_value(),n=e([r.name.el,r.directory.el,r.author.el,r.author_uri.el]);t!=""?n.hide():n.show()}}),name:new Upfront.Views.Editor.Field.Text({name:"name",label:Upfront.Settings.l10n.global.behaviors.theme_name}),directory:new Upfront.Views.Editor.Field.Text({name:"directory",label:Upfront.Settings.l10n.global.behaviors.directory}),author:new Upfront.Views.Editor.Field.Text({name:"author",label:Upfront.Settings.l10n.global.behaviors.author}),author_uri:new Upfront.Views.Editor.Field.Text({name:"author_uri",label:Upfront.Settings.l10n.global.behaviors.author_uri}),activate:new Upfront.Views.Editor.Field.Checkboxes({name:"activate",default_value:!0,multiple:!1,values:[{label:Upfront.Settings.l10n.global.behaviors.activate_upon_creation,value:1}]}),with_images:new Upfront.Views.Editor.Field.Checkboxes({name:"with_images",default_value:!0,multiple:!1,values:[{label:Upfront.Settings.l10n.global.behaviors.export_theme_images,value:1}]})},n.export_modal||(n.export_modal=new Upfront.Views.Editor.Modal({to:e("body"),button:!1,top:120,width:540}),n.export_modal.render(),e("body").append(n.export_modal.el)),n._get_themes().done(function(e){r.theme.options.values=_.union([{label:Upfront.Settings.l10n.global.behaviors.new_theme,value:""}],_.map(e,function(e,t){return{label:e.name,value:e.directory}})),r.theme.render(),r.theme.delegateEvents(),r.theme.$el.find("input").trigger("change")}),n.export_modal.open(function(t,s){var o=e('<span class="uf-button">'+Upfront.Settings.l10n.global.behaviors.export_button+"</span>");_.each(r,function(e){e.render(),e.delegateEvents()}),t.html('<h1 class="upfront-modal-title">'+Upfront.Settings.l10n.global.behaviors.export_theme+"</h1>"),t.append(r.theme.el),t.append(r.name.el),t.append(r.directory.el),t.append(r.author.el),t.append(r.author_uri.el),t.append(r.activate.el),t.append(r.with_images.el),t.append(o),o.on("click",function(){var t,s,o,u,a;t=r.theme.get_value()?r.theme.get_value():r.directory.get_value(),s=function(){var e={"thx-theme-name":r.name.get_value(),"thx-theme-slug":r.directory.get_value(),"thx-author":r.author.get_value(),"thx-author-uri":r.author_uri.get_value(),"thx-theme-template":"upfront","thx-activate_theme":r.activate.get_value()||"","thx-export_with_images":r.with_images.get_value()||"",add_global_regions:Upfront.Application.current_subapplication.layout.get("layout_slug")!=="blank"};return i.update_loading_text(Upfront.Settings.l10n.global.behaviors.creating_theme),n._create_theme(e)},i.render(),e("body").append(i.el),s().done(function(){n.export_single_layout(i,t).done(function(){n.load_theme(t)})})})},n)):(i.render(),e("body").append(i.el),n.export_single_layout(i,Upfront.themeExporter.currentTheme))},export_single_layout:function(e,t){var n=this,r=Upfront.Application,i=Upfront.Behaviors.LayoutEditor,s=_upfront_post_data.layout.specificity||_upfront_post_data.layout.item||_upfront_post_data.layout.type;return e.update_loading_text(Upfront.Settings.l10n.global.behaviors.exporting_layout+s),i._export_layout({theme:t}).done(function(){e.done(function(){i.export_modal&&i.export_modal.close(!0),i.clean_region_css()})})},first_save_dialog:function(e){var t=Upfront.Application,n=Upfront.Behaviors.LayoutEditor,r=t.layout.get("current_layout");e&&(!r||r=="archive-home")&&n.message_dialog(Upfront.Settings.l10n.global.behaviors.excellent_start,Upfront.Settings.l10n.global.behaviors.homepage_created)},message_dialog:function(t,n){var r=Upfront.Application,i=Upfront.Behaviors.LayoutEditor;i.message_modal||(i.message_modal=new Upfront.Views.Editor.Modal({to:e("body"),button:!0,top:120,width:540}),i.message_modal.render(),e("body").append(i.message_modal.el)),i.message_modal.open(function(e,r){r.addClass("upfront-message-modal"),e.html('<h1 class="upfront-modal-title">'+t+"</h1>"),e.append(n)},i)},_get_saved_layout:function(){var t=this,n=new e.Deferred;return Upfront.Application.is_builder()?Upfront.Util.post({action:"upfront_list_theme_layouts"}).success(function(e){t.saved_layouts=e.data,n.resolve(e.data)}).error(function(){n.reject()}):setTimeout(n.reject),n.promise()},_get_themes:function(){var t=this,n=new e.Deferred;return Upfront.Application.is_builder()?Upfront.Util.post({action:"upfront_thx-get-themes"}).success(function(e){t.themes=e,n.resolve(e)}).error(function(){n.reject()}):setTimeout(n.reject),n.promise()},_create_theme:function(t){var n=new e.Deferred;return Upfront.Application.is_builder()?Upfront.Util.post({action:"upfront_thx-create-theme",form:this._build_query(t)}).success(function(e){e&&e.error?n.reject(e.error):n.resolve()}).error(function(){n.reject()}):setTimeout(n.reject),n.promise()},export_element_styles:function(e){if(!Upfront.Application.is_builder())return!1;Upfront.Util.post({action:"upfront_thx-export-element-styles",data:e}).success(function(t){if(t&&t.error){Upfront.Views.Editor.notify(t.error);return}Upfront.data.styles[e.elementType]||(Upfront.data.styles[e.elementType]=[]),Upfront.data.styles[e.elementType].indexOf(e.stylename)===-1&&Upfront.data.styles[e.elementType].push(e.stylename),Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.behaviors.style_exported)}).error(function(){Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.behaviors.style_export_fail)})},_export_layout:function(t){var n,r,i,s=new e.Deferred,o={};return Upfront.Application.is_builder()?(n=_.findWhere(Upfront.Application.current_subapplication.get_layout_data().properties,{name:"typography"}),i=_.findWhere(Upfront.Application.current_subapplication.get_layout_data().properties,{name:"layout_style"}),r=_.extend({},Upfront.Util.model_to_json(Upfront.Application.current_subapplication.get_layout_data().properties)),r=_.reject(r,function(e){return _.contains(["typography","layout_style","global_regions"],e.name)}),o={typography:n?JSON.stringify(n.value):"",regions:JSON.stringify(Upfront.Application.current_subapplication.get_layout_data().regions),template:_upfront_post_data.layout.specificity||_upfront_post_data.layout.item||_upfront_post_data.layout.type,layout_properties:JSON.stringify(r),theme:Upfront.themeExporter.currentTheme,layout_style:i?i.value:"",theme_colors:{colors:Upfront.Views.Theme_Colors.colors.toJSON(),range:Upfront.Views.Theme_Colors.range},post_image_variants:Upfront.Content.ImageVariants.toJSON()},Upfront.themeExporter.layoutStyleDirty&&(o.layout_style=e("#layout-style").html(),Upfront.themeExporter.layoutStyleDirty=!1),t&&(o=_.extend(o,t)),Upfront.Util.post({action:"upfront_thx-export-layout",data:o}).success(function(e){e&&e.error?s.reject(e.error):s.resolve()}).error(function(){s.reject()}),s.promise()):(setTimeout(s.reject),s.promise())},clean_region_css:function(){var t=this,n=Upfront.Application.cssEditor,r=Upfront.Behaviors.LayoutEditor,i=[n.elementTypes.RegionContainer,n.elementTypes.Region],s=_upfront_post_data.layout,o=s.specificity||s.item||s.type,u=Upfront.Application.layout.get("regions"),a=[],f=[],l=function(t){if(!f[t]){Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.behaviors.region_css_cleaned),c.resolve();return}var n=f[t].elementType,r=f[t].styleName;Upfront.Application.get_current()===Upfront.Settings.Application.MODE.THEME?data={action:"upfront_thx-delete-element-styles",data:{stylename:r,elementType:n}}:data={action:"upfront_delete_styles",styleName:r,elementType:n},Upfront.Util.post(data).done(function(){var i=Upfront.data.styles[n].indexOf(r);i!=-1&&Upfront.data.styles[n].splice(i,1),e("#upfront-style-"+r).remove(),l(t+1)})},c=new e.Deferred;return u.each(function(e){var t=e.is_main()?n.elementTypes.RegionContainer.id:n.elementTypes.Region.id,r=o+"-"+e.get("name")+"-style",i=e.get("scope")=="global";_.isArray(Upfront.data.styles[t])&&Upfront.data.styles[t].indexOf(r)!=-1&&a.push(r),r=t+"-"+e.get("name")+"-style",_.isArray(Upfront.data.styles[t])&&Upfront.data.styles[t].indexOf(r)!=-1&&a.push(r)}),r._get_saved_layout().done(function(e){_.each(i,function(t){_.each(Upfront.data.styles[t.id],function(n){var r=!1;_.each(e,function(e,t){if(t==o)return;var i=o.match(new RegExp("^"+t+"-"));n.match(new RegExp("^"+t))&&(!i||i&&!n.match(new RegExp("^"+o)))&&(r=!0)}),!_.contains(a,n)&&n.match(new RegExp("^"+o))&&!r&&f.push({elementType:t.id,styleName:n})})}),f.length>0&&(Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.behaviors.cleaning_region_css),l(0))}),c.promise()},_build_query:function(e){return _.map(e,function(e,t){return t+"="+e}).join("&")},clean_global_regions:function(){Upfront.data.global_regions=!1},open_global_region_manager:function(){var t=Upfront.Behaviors.LayoutEditor;Upfront.Popup.open(function(n,r,i){var s=e(this);s.html('<p class="upfront-popup-placeholder">'+Upfront.Settings.l10n.global.behaviors.loading_content+"</p>"),Upfront.data.global_regions?t._render_global_region_manager(s):t._refresh_global_regions().done(function(){t._render_global_region_manager(s)})},{width:600},"global-region-manager")},_refresh_global_regions:function(){return Upfront.Util.post({action:"upfront_list_scoped_regions",scope:"global",storage_key:_upfront_save_storage_key}).done(function(e){Upfront.data.global_regions=e.data})},_render_global_region_manager:function(t){var n=Upfront.Behaviors.LayoutEditor,r=Upfront.Application.layout.get("regions"),i=[{title:Upfront.Settings.l10n.global.behaviors.global_regions,classname:"global",data:_.sortBy(Upfront.data.global_regions,function(e,t,n){return!e.container||e.name==e.container?t*3:_.indexOf(n,_.findWhere(n,{name:e.container}))*3+1})},{title:Upfront.Settings.l10n.global.behaviors.lightboxes,classname:"lightbox",data:Upfront.Util.model_to_json(r.filter(function(e){return e.get("sub")=="lightbox"}))}];t.html(""),_.each(i,function(r){var i=e('<div class="global-region-manager-wrap global-region-manager-'+r.classname+'"></div>'),s=e('<h3 class="global-region-manager-title">'+r.title+"</h3>"),o=e('<div class="global-region-manager-content upfront-scroll-panel"></div>');i.append([s,o]),n._render_regions(r.data,o),t.append(i),Upfront.Views.Mixins.Upfront_Scroll_Mixin.stop_scroll_propagation(o)}),t.on("click",".region-list-edit",function(e){e.preventDefault()}),t.on("click",".region-list-trash",function(i){i.preventDefault();var s=e(this).attr("data-name");e(this).closest(".global-region-manager-wrap").hasClass("global-region-manager-global")&&confirm("Deleting the global regions will remove it from all layouts. Continue?")&&Upfront.Util.post({action:"upfront_delete_scoped_regions",scope:"global",name:s,storage_key:_upfront_save_storage_key}).done(function(e){e.data&&(_.each(e.data,function(e){var t=r.get_by_name(e);r.remove(t)}),n._refresh_global_regions().done(function(){n._render_global_region_manager(t)}))})})},_render_regions:function(t,n){var r=e('<ul class="global-region-manager-lists"></ul>');_.each(t,function(e){var n=["global-region-manager-list"],i=!1;!e.container||e.name==e.container?n.push("region-list-main"):(i=_.find(t,function(t){return t.name==e.container}),n.push("region-list-sub"),n.push("region-list-sub-"+e.sub),i&&n.push("region-list-sub-has-main")),r.append('<li class="'+n.join(" ")+'">'+'<span class="region-list-name">'+e.title+"</span>"+'<span class="region-list-control">'+(Upfront.Application.get_current()!=Upfront.Settings.Application.MODE.THEME?'<a href="#" class="region-list-trash" data-name="'+e.name+'">'+Upfront.Settings.l10n.global.behaviors.trash+"</a>":"")+"</span>"+"</li>")}),n.append(r)}};define(t)})(jQuery);