!function(e){define(["scripts/upfront/inline-panels/item","scripts/upfront/inline-panels/control"],function(t,i){var n=Upfront.mainData.l10n.image_element,s=i.extend({multiControl:!0,events:{click:"onClickControl","click .upfront-inline-panel-item":"selectItem"},initialize:function(){var t=this;e(document).click(function(i){var n=e(i.target);n.closest("#page").length&&n[0]!==t.el&&!n.closest(t.el).length&&t.isOpen&&t.close()})},onClickControl:function(e){this.isDisabled||(e.preventDefault(),this.clicked(e),this.$el.siblings(".upfront-control-dialog-open").removeClass("upfront-control-dialog-open"),this.isOpen?this.close():this.open())},open:function(){this.isOpen=!0,this.$el.addClass("upfront-control-dialog-open")},close:function(){this.isOpen=!1,this.$el.removeClass("upfront-control-dialog-open")},render:function(){t.prototype.render.call(this,arguments);var i,n=this.$(".uimage-caption-control"),s=this,o="";this.$el.hasClass("uimage-caption-control-item")||this.$el.addClass("uimage-caption-control-item"),"undefined"!=typeof this.wrapperClass&&(o=this.wrapperClass),n.length||(n=e('<div class="uimage-caption-control inline-panel-control-dialog '+o+'"></div>'),this.$el.append(n)),_.each(this.sub_items,function(e,t){t===s.selected?e.setIsSelected(!0):e.setIsSelected(!1),e.render(),e.$el.find("i").addClass("upfront-icon-region-caption"),n.append(e.$el),s.listenTo(e,"click",s.selectItem)}),i=this.sub_items[this.selected],i&&("undefined"!=typeof i.icon?this.$el.children("i").addClass("upfront-icon-region-"+i.icon):"undefined"!=typeof i.label&&this.$el.find(".tooltip-content").append(": "+i.label))},get_selected_item:function(){return this.selected},selectItem:function(t){var i=!1,n=e(t.target).is("i")?e(t.target):e(t.target).find("i");_.each(this.sub_items,function(s,o){n.hasClass("upfront-icon-region-"+s.icon)&&(i=o),i||e(t.target).closest(".upfront-inline-panel-item").attr("id")!==s.id||(i=o)}),i&&(this.selected=i,this.render(),this.trigger("select",i))},setDisabled:function(e){this.isDisabled=e,e?this.tooltip=n.ctrl.caption_position_disabled:this.tooltip=n.ctrl.caption_display}});return s})}(jQuery);