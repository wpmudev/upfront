(function(e){define(["scripts/upfront/inline-panels/l10n","scripts/upfront/inline-panels/item","scripts/upfront/inline-panels/control"],function(t,n,r){var i=r.extend({multiControl:!0,events:{click:"onClickControl","click .upfront-inline-panel-item":"selectItem"},initialize:function(){var t=this;e(document).click(function(n){var r=e(n.target);r.closest("#page").length&&r[0]!==t.el&&!r.closest(t.el).length&&t.isOpen&&t.close()})},onClickControl:function(e){if(this.isDisabled)return;e.preventDefault(),this.clicked(e),this.$el.siblings(".upfront-control-dialog-open").removeClass("upfront-control-dialog-open"),this.isOpen?this.close():this.open()},open:function(){this.isOpen=!0,this.$el.addClass("upfront-control-dialog-open")},close:function(){this.isOpen=!1,this.$el.removeClass("upfront-control-dialog-open")},render:function(){n.prototype.render.call(this,arguments);var t=this.$(".uimage-caption-control"),r=this,i;this.$el.hasClass("uimage-caption-control-item")||this.$el.addClass("uimage-caption-control-item"),t.length||(t=e('<div class="uimage-caption-control inline-panel-control-dialog"></div>'),this.$el.append(t)),_.each(this.sub_items,function(e,n){n===r.selected?e.setIsSelected(!0):e.setIsSelected(!1),e.render(),t.append(e.$el)}),i=this.sub_items[this.selected],i&&(typeof i.icon!="undefined"?this.$el.children("i").addClass("upfront-icon-region-"+i.icon):typeof i.label!="undefined"&&this.$el.find(".tooltip-content").append(": "+i.label))},get_selected_item:function(){return this.selected},selectItem:function(t){var n=!1,r=e(t.target).is("i")?e(t.target):e(t.target).find("i");_.each(this.sub_items,function(i,s){r.hasClass("upfront-icon-region-"+i.icon)&&(n=s),!n&&e(t.target).closest(".upfront-inline-panel-item").attr("id")===i.id&&(n=s)}),n&&(this.selected=n,this.render(),this.trigger("select",n))},setDisabled:function(e){this.isDisabled=e,e?this.tooltip=t.ctrl.caption_position_disabled:this.tooltip=t.ctrl.caption_position}});return i})})(jQuery);