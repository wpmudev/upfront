(function(e){define([],function(){var e=Backbone.View.extend({initialize:function(e){var t=this;t.options=e,this.fields=e.fields?_(e.fields):_([]),this.on("panel:set",function(){t.fields.each(function(e){e.panel=t.panel,e.trigger("panel:set")})})},render:function(){this.$el.html(""),this.options.title&&this.$el.append('<div class="upfront-settings-item-title">'+this.options.title+"</div>"),this.$el.append('<div class="upfront-settings-item-content"></div>');var e=this.$el.find(".upfront-settings-item-content");this.fields.each(function(t){t.render(),t.delegateEvents(),e.append(t.el)}),this.trigger("rendered")},save_fields:function(){var e=_([]);this.fields.each(function(t,n,r){if(t.property){var i=t.get_value(),s=t.get_saved_value();!t.multiple&&i!=s?e.push(t):t.multiple&&(i.length!=s.length||_.difference(i,s).length!=0)&&e.push(t)}}),e.each(function(e,t,n){e.use_breakpoint_property?e.model.set_breakpoint_property(e.property_name,e.get_value(),!0):e.property.set({value:e.get_value()},{silent:!0})}),e.size()>0&&(this.panel.is_changed=!0)},remove:function(){this.fields&&this.fields.each(function(e){e.remove()}),Backbone.View.prototype.remove.call(this)}});return e})})(jQuery);