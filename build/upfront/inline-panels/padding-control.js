!function(t){define(["scripts/upfront/inline-panels/item","scripts/upfront/inline-panels/control"],function(e,n){var i=Upfront.mainData.l10n.global.views,d=n.extend({multiControl:!0,events:{click:"onClickControl"},initialize:function(){var e=this;t(document).click(function(n){var i=t(n.target);i.closest("#page").length&&i[0]!==e.el&&!i.closest(e.el).length&&e.isOpen&&e.close()}),t(document).mouseup(function(n){var i=t(n.target),d=Upfront.data.currentEntity;i.closest("#page").length&&i[0]!==e.el&&!i.closest(e.el).length&&"undefined"!=typeof d&&"undefined"!=typeof d.padding_hint_locked&&d.padding_hint_locked&&(d.padding_hint_locked=!1,d.top_padding_hint_timer=setTimeout(function(){"function"==typeof d.hide_top_padding_hint&&d.hide_top_padding_hint()},1e3),d.bottom_padding_hint_timer=setTimeout(function(){"function"==typeof d.hide_bottom_padding_hint&&d.hide_bottom_padding_hint()},1e3))}),this.default_padding={top:!1,bottom:!1,left:!1,right:!1},this.listenTo(Upfront.Events,"upfront:paddings:updated",this.refresh)},onClickControl:function(e){var n=t(e.target);if(!this.isDisabled)return n.closest(".upfront-icon-region-padding").length?void(n.hasClass(".upfront-field-checkbox")||(e.preventDefault(),this.clicked(e),this.$el.siblings(".upfront-control-dialog-open").removeClass("upfront-control-dialog-open"),this.listenTo(Upfront.Events,"upfront:hide:paddingPanel",this.close),this.isOpen?this.close():this.open())):void e.stopPropagation()},open:function(){this.isOpen=!0,this.refresh(),this.$el.addClass("upfront-control-dialog-open"),this.update_position(),Upfront.Events.trigger("upfront:hide:subControl");var e=this.$el.closest(".upfront-region-container"),n=t(".upfront-region-container").not(".upfront-region-container-shadow").last();n.get(0)==e.get(0)&&e.addClass("upfront-last-region-padding")},close:function(){this.isOpen=!1,this.$el.removeClass("upfront-control-dialog-open"),this.$el.closest(".upfront-inline-panel-item-open").removeClass("upfront-inline-panel-item-open"),this.$el.closest(".upfront-region-container").removeClass("upfront-last-region-padding")},on_render:function(){var e=this,n=e.$(".upfront-padding-control"),d=t('<div class="upfront-padding-container upfront-padding-container-top"></div>'),o=t('<div class="upfront-padding-container upfront-padding-container-lock"></div>'),p=t('<div class="upfront-padding-container upfront-padding-container-left"></div>'),a=t('<div class="upfront-padding-container upfront-padding-container-right"></div>'),r=t('<div class="upfront-padding-container upfront-padding-container-bottom"></div>'),s=Upfront.Settings.LayoutEditor.Grid.column_padding;e.$el.hasClass("upfront-padding-control-item")||e.$el.addClass("upfront-padding-control-item"),0===n.length&&(n=t('<div class="upfront-padding-control inline-panel-control-dialog"></div>'),e.$el.append(n)),e.default_padding.top===!1&&(e.default_padding.top=s),e.default_padding.bottom===!1&&(e.default_padding.bottom=s),e.default_padding.left===!1&&(e.default_padding.left=s),e.default_padding.right===!1&&(e.default_padding.right=s),e.paddingTop=new Upfront.Views.Editor.Field.Number({model:this.model,use_breakpoint_property:!0,property:"top_padding_num",label:"",default_value:this.model.get_breakpoint_property_value("top_padding_num")||e.default_padding.top,min:0,max:200,step:5,change:function(t){var t=this.get_value(),n=this.model.get_breakpoint_property_value("lock_padding",!0);"yes"===n&&e.update_locked_values(t),this.model.set_breakpoint_property("use_padding","yes",!0),this.model.set_breakpoint_property("top_padding_use","yes",!0),this.model.set_breakpoint_property("top_padding_slider",t,!0),this.model.set_breakpoint_property("top_padding_num",t),Upfront.Events.trigger("upfront:paddings:updated",this.model,Upfront.data.currentEntity),Upfront.Events.trigger("upfront:paddings:top:updated",this.model,Upfront.data.currentEntity)}}),e.paddingLeft=new Upfront.Views.Editor.Field.Number({model:this.model,use_breakpoint_property:!0,property:"left_padding_num",label:"",default_value:this.model.get_breakpoint_property_value("left_padding_num")||e.default_padding.left,min:0,max:200,step:5,change:function(){var t=this.get_value();this.model.set_breakpoint_property("use_padding","yes",!0),this.model.set_breakpoint_property("left_padding_use","yes",!0),this.model.set_breakpoint_property("left_padding_slider",t,!0),this.model.set_breakpoint_property("left_padding_num",t),Upfront.Events.trigger("upfront:paddings:updated",this.model,Upfront.data.currentEntity),Upfront.Events.trigger("upfront:paddings:left:updated",this.model,Upfront.data.currentEntity)}}),e.paddingRight=new Upfront.Views.Editor.Field.Number({model:this.model,use_breakpoint_property:!0,property:"right_padding_num",label:"",default_value:this.model.get_breakpoint_property_value("right_padding_num")||e.default_padding.right,min:0,max:200,step:5,change:function(){var t=this.get_value();this.model.set_breakpoint_property("use_padding","yes",!0),this.model.set_breakpoint_property("right_padding_use","yes",!0),this.model.set_breakpoint_property("right_padding_slider",t,!0),this.model.set_breakpoint_property("right_padding_num",t),Upfront.Events.trigger("upfront:paddings:updated",this.model,Upfront.data.currentEntity),Upfront.Events.trigger("upfront:paddings:right:updated",this.model,Upfront.data.currentEntity)}}),e.paddingBottom=new Upfront.Views.Editor.Field.Number({model:this.model,use_breakpoint_property:!0,property:"bottom_padding_num",label:"",default_value:this.model.get_breakpoint_property_value("bottom_padding_num")||e.default_padding.bottom,min:0,max:200,step:5,change:function(){var t=this.get_value();this.model.set_breakpoint_property("use_padding","yes",!0),this.model.set_breakpoint_property("bottom_padding_use","yes",!0),this.model.set_breakpoint_property("bottom_padding_slider",t,!0),this.model.set_breakpoint_property("bottom_padding_num",t),Upfront.Events.trigger("upfront:paddings:updated",this.model,Upfront.data.currentEntity),Upfront.Events.trigger("upfront:paddings:bottom:updated",this.model,Upfront.data.currentEntity)}}),e.lockPadding=new Upfront.Views.Editor.Field.Checkboxes({model:this.model,className:"padding-lock",use_breakpoint_property:!0,property:"lock_padding",label:"",default_value:0,multiple:!1,values:[{label:"",value:"yes"}],show:function(t){"yes"==t?(e.paddingLeft.$el.find("input").prop("disabled",!0).css("opacity",.4),e.paddingRight.$el.find("input").prop("disabled",!0).css("opacity",.4),e.paddingBottom.$el.find("input").prop("disabled",!0).css("opacity",.4)):(e.paddingLeft.$el.find("input").prop("disabled",!1).css("opacity",1),e.paddingRight.$el.find("input").prop("disabled",!1).css("opacity",1),e.paddingBottom.$el.find("input").prop("disabled",!1).css("opacity",1))},change:function(t){var n=this.model.get_breakpoint_property_value("top_padding_num",!0);"yes"===t&&e.update_locked_values(n),this.model.set_breakpoint_property("lock_padding",t,!0)}}),n.html(""),$paddingControlTitle='<span class="upfront-control-arrow"></span><span class="upfront-padding-title">'+i.padding_title+"</span>",n.append($paddingControlTitle),$paddingControlTitle='<span class="upfront-padding-keyboard">&nbsp;</span><span class="upfront-checkbox-info" title="'+i.padding_keyboard+'"></span>',n.append($paddingControlTitle),e.paddingTop.render(),d.append(e.paddingTop.$el),n.append(d),e.lockPadding.render(),o.append(e.lockPadding.$el),e.lockPadding.delegateEvents(),n.append(o),e.paddingLeft.render(),p.append(e.paddingLeft.$el),n.append(p),e.paddingRight.render(),a.append(e.paddingRight.$el),n.append(a),e.paddingBottom.render(),r.append(e.paddingBottom.$el),n.append(r),d.on("mousedown",function(){Upfront.data.currentEntity.padding_hint_locked=!0}).on("mouseup",function(){var t=Upfront.data.currentEntity;t.padding_hint_locked=!1,t.top_padding_hint_timer=setTimeout(function(){"function"==typeof t.hide_top_padding_hint&&t.hide_top_padding_hint()},1e3)}),r.on("mousedown",function(){Upfront.data.currentEntity.padding_hint_locked=!0}).on("mouseup",function(){var t=Upfront.data.currentEntity;t.padding_hint_locked=!1,t.bottom_padding_hint_timer=setTimeout(function(){"function"==typeof t.hide_bottom_padding_hint&&t.hide_bottom_padding_hint()},1e3)})},update_locked_values:function(t){this.model.set_breakpoint_property("left_padding_use","yes",!0),this.model.set_breakpoint_property("left_padding_slider",t,!0),this.model.set_breakpoint_property("left_padding_num",t),this.model.set_breakpoint_property("bottom_padding_use","yes",!0),this.model.set_breakpoint_property("bottom_padding_slider",t,!0),this.model.set_breakpoint_property("bottom_padding_num",t),this.model.set_breakpoint_property("right_padding_use","yes",!0),this.model.set_breakpoint_property("right_padding_slider",t,!0),this.model.set_breakpoint_property("right_padding_num",t),this.paddingLeft.get_field().val(t),this.paddingRight.get_field().val(t),this.paddingTop.get_field().val(t),this.paddingBottom.get_field().val(t)},refresh:function(t){if(!t||t===this.model){var e,n,i,d,o=Upfront.Settings.LayoutEditor.Grid.column_padding,p=this.model.get_breakpoint_property_value("top_padding_use",!0),a=this.model.get_breakpoint_property_value("bottom_padding_use",!0),r=this.model.get_breakpoint_property_value("left_padding_use",!0),s=this.model.get_breakpoint_property_value("right_padding_use",!0),l=this.model.get_breakpoint_property_value("lock_padding",!0),_=this.lockPadding.$el.find("input");this.default_padding.top===!1&&(this.default_padding.top=o),this.default_padding.bottom===!1&&(this.default_padding.bottom=o),this.default_padding.left===!1&&(this.default_padding.left=o),this.default_padding.right===!1&&(this.default_padding.right=o),e=p?this.model.get_breakpoint_property_value("top_padding_num",!0):this.default_padding.top,n=a?this.model.get_breakpoint_property_value("bottom_padding_num",!0):this.default_padding.bottom,i=r?this.model.get_breakpoint_property_value("left_padding_num",!0):this.default_padding.left,d=s?this.model.get_breakpoint_property_value("right_padding_num",!0):this.default_padding.right,l?_.attr("checked","checked"):_.removeAttr("checked"),_.trigger("change"),"undefined"!=typeof this.paddingTop&&this.paddingTop.get_field().val(e),"undefined"!=typeof this.paddingBottom&&this.paddingBottom.get_field().val(n),"undefined"!=typeof this.paddingLeft&&this.paddingLeft.get_field().val(i),"undefined"!=typeof this.paddingRight&&this.paddingRight.get_field().val(d)}},on_up_arrow_click:function(){if("undefined"!=typeof this.paddingTop){var t=parseInt(this.model.get_breakpoint_property_value("top_padding_num",!0),10)-5;t=t<0?0:t,this.model.set_breakpoint_property("top_padding_use","yes"),this.model.set_breakpoint_property("top_padding_num",t),this.model.set_breakpoint_property("top_padding_slider",t),Upfront.Events.trigger("upfront:paddings:updated",this.model,Upfront.data.currentEntity),Upfront.Events.trigger("upfront:paddings:top:updated",this.model,Upfront.data.currentEntity),this.refresh()}},on_down_arrow_click:function(){if("undefined"!=typeof this.paddingTop){var t=parseInt(this.model.get_breakpoint_property_value("top_padding_num",!0),10)+5;this.model.set_breakpoint_property("top_padding_use","yes"),this.model.set_breakpoint_property("top_padding_num",t),this.model.set_breakpoint_property("top_padding_slider",t),Upfront.Events.trigger("upfront:paddings:updated",this.model,Upfront.data.currentEntity),Upfront.Events.trigger("upfront:paddings:top:updated",this.model,Upfront.data.currentEntity),this.refresh()}},update_position:function(){var t=this.$el.prevAll().length,e=28*t,n=Upfront.Util.isRTL()?"right":"left";this.$el.find(".upfront-padding-control").css(n,-(e+5)),this.$el.find(".upfront-control-arrow").css(n,e)}});return d})}(jQuery);